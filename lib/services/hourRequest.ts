import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Identity } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Shared errors
// ---------------------------------------------------------------------------

export class HourRequestNotFoundError extends Error {
  constructor() {
    super('ไม่พบคำร้องนี้ในระบบ');
    this.name = 'HourRequestNotFoundError';
  }
}

export class HourRequestStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HourRequestStateError';
  }
}

export class HourRequestOwnershipError extends Error {
  constructor() {
    super('คุณไม่มีสิทธิ์แก้ไขคำร้องนี้');
    this.name = 'HourRequestOwnershipError';
  }
}

// ---------------------------------------------------------------------------
// Input shape shared by create + resubmit
// ---------------------------------------------------------------------------

export interface HourRequestInput {
  title: string;
  category?: string;
  hours: number;
  proofUrl?: string | null;
  description?: string | null;
}

function validateInput(input: HourRequestInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new HourRequestStateError('กรุณากรอกชื่องาน/กิจกรรม');
  }
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new HourRequestStateError('จำนวนชั่วโมงต้องมากกว่า 0');
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listMyHourRequests(studentId: string) {
  return prisma.hourRequest.findMany({
    where: { userId: studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPendingHourRequests() {
  return prisma.hourRequest.findMany({
    where: { status: 'PENDING_APPROVAL' },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getHourRequestById(id: string) {
  return prisma.hourRequest.findUnique({ where: { id } });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createHourRequest(identity: Identity, input: HourRequestInput) {
  validateInput(input);

  const today = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return prisma.hourRequest.create({
    data: {
      userId: identity.userId,
      title: input.title.trim(),
      type: input.category || 'กิจกรรมภายนอก (คอมพิวเตอร์)',
      typeCategory: 'ภายนอก',
      dateStr: today,
      timeStr: '09:00 - 16:00',
      hours: input.hours,
      status: 'PENDING_APPROVAL',
      statusText: 'รอตรวจสอบ',
      imageProof: input.proofUrl || null,
      note: input.description || null,
    },
  });
}

/** Student edits a REJECTED request and resubmits it — resets to PENDING_APPROVAL. */
export async function resubmitHourRequest(identity: Identity, requestId: string, input: HourRequestInput) {
  validateInput(input);

  const existing = await prisma.hourRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new HourRequestNotFoundError();
  if (existing.userId !== identity.userId) throw new HourRequestOwnershipError();
  if (existing.status !== 'REJECTED') {
    throw new HourRequestStateError('แก้ไขและยื่นใหม่ได้เฉพาะคำร้องที่ถูกปฏิเสธเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      title: input.title.trim(),
      type: input.category || existing.type,
      hours: input.hours,
      imageProof: input.proofUrl || null,
      note: input.description || null,
      status: 'PENDING_APPROVAL',
      statusText: 'รอตรวจสอบ',
      rejectReason: null,
    },
  });
}

/** Staff/admin approves a PENDING request */
export async function approveHourRequest(identity: Identity, requestId: string) {
  const existing = await prisma.hourRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new HourRequestNotFoundError();
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new HourRequestStateError('อนุมัติได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      statusText: 'อนุมัติแล้ว',
      approvedHours: existing.hours,
      rejectReason: null,
    },
  });
}

/** Staff/admin rejects a PENDING request with a required reason. */
export async function rejectHourRequest(identity: Identity, requestId: string, reason: string) {
  if (!reason || reason.trim().length === 0) {
    throw new HourRequestStateError('กรุณาระบุเหตุผลที่ปฏิเสธหรือส่งกลับแก้ไข');
  }

  const existing = await prisma.hourRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new HourRequestNotFoundError();
  if (existing.status !== 'PENDING_APPROVAL') {
    throw new HourRequestStateError('ปฏิเสธได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      status: 'REJECTED',
      statusText: 'ส่งกลับแก้ไข',
      rejectReason: reason.trim(),
    },
  });
}

export type { Prisma };