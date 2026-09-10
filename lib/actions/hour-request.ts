'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getIdentity, requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/auth';
import {
  createHourRequest as createHourRequestService,
  resubmitHourRequest as resubmitHourRequestService,
  approveHourRequest as approveHourRequestService,
  rejectHourRequest as rejectHourRequestService,
  HourRequestNotFoundError,
  HourRequestStateError,
  HourRequestOwnershipError,
} from '@/lib/services/hourRequest';
import type { ActionResult } from '@/lib/actions/activity';

function handleKnownErrors(err: unknown): ActionResult<never> {
  if (err instanceof UnauthorizedError) {
    return { success: false, error: 'ไม่พบข้อมูลผู้ใช้จาก API Gateway กรุณาเข้าสู่ระบบใหม่' };
  }
  if (err instanceof ForbiddenError) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ทำรายการนี้ (ต้องเป็นเจ้าหน้าที่/อาจารย์)' };
  }
  if (
    err instanceof HourRequestNotFoundError ||
    err instanceof HourRequestStateError ||
    err instanceof HourRequestOwnershipError
  ) {
    return { success: false, error: err.message };
  }
  if (err instanceof z.ZodError) {
    return { success: false, error: err.errors.map((e) => e.message).join(', ') };
  }
  console.error('[csmju-coop-hours] Unhandled hour-request action error:', err);
  return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง' };
}

const requestFormSchema = z.object({
  title: z.string().trim().min(1, 'กรุณากรอกชื่องาน/กิจกรรม').max(200),
  category: z.enum(['COOP', 'VOLUNTEER', 'MAJOR'], { errorMap: () => ({ message: 'กรุณาเลือกหมวดหมู่' }) }),
  hours: z.coerce.number().positive('จำนวนชั่วโมงต้องมากกว่า 0'),
  proofUrl: z.string().trim().optional().or(z.literal('')),
  description: z.string().trim().optional().or(z.literal('')),
});

function parseForm(formData: FormData) {
  return requestFormSchema.parse({
    title: formData.get('title'),
    category: formData.get('category'),
    hours: formData.get('hours'),
    proofUrl: formData.get('proofUrl') ?? '',
    description: formData.get('description') ?? '',
  });
}

// ---------------------------------------------------------------------------
// Student actions
// ---------------------------------------------------------------------------

export async function submitHourRequest(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const identity = getIdentity();
    const parsed = parseForm(formData);

    const request = await createHourRequestService(identity, parsed);

    revalidatePath('/dashboard');
    revalidatePath('/requests');
    return { success: true, data: { id: request.id } };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

export async function resubmitHourRequestAction(
  requestId: string,
  formData: FormData
): Promise<ActionResult<{ id: string }>> {
  try {
    const identity = getIdentity();
    const parsed = parseForm(formData);

    const request = await resubmitHourRequestService(identity, requestId, parsed);

    revalidatePath('/dashboard');
    revalidatePath('/requests');
    return { success: true, data: { id: request.id } };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// Staff/admin actions
// ---------------------------------------------------------------------------

export async function approveHourRequestAction(requestId: string): Promise<ActionResult> {
  try {
    const identity = getIdentity();
    requireAdmin(identity);

    await approveHourRequestService(identity, requestId);

    revalidatePath('/admin/requests');
    revalidatePath('/admin/students');
    return { success: true, data: undefined };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

export async function rejectHourRequestAction(requestId: string, reason: string): Promise<ActionResult> {
  try {
    const identity = getIdentity();
    requireAdmin(identity);

    await rejectHourRequestService(identity, requestId, reason);

    revalidatePath('/admin/requests');
    return { success: true, data: undefined };
  } catch (err) {
    return handleKnownErrors(err);
  }
}