import { HourRequestCategory, HourRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Identity } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Shared errors — thrown by the service layer, translated to either an
// ActionResult (Server Actions) or a standard envelope + HTTP status
// (Route Handlers) by the two callers in lib/actions/hour-request.ts and
// app/api/requests/**.
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
  category: HourRequestCategory;
  hours: number;
  proofUrl?: string | null;
  description?: string | null;
}

function validateInput(input: HourRequestInput): void {
  if (!input.title || input.title.trim().length === 0) {
    throw new HourRequestStateError('กรุณากรอกชื่องาน/กิจกรรม');
  }
  if (!['COOP', 'VOLUNTEER', 'MAJOR'].includes(input.category)) {
    throw new HourRequestStateError('หมวดหมู่ไม่ถูกต้อง');
  }
  if (!Number.isFinite(input.hours) || input.hours <= 0) {
    throw new HourRequestStateError('จำนวนชั่วโมงต้องมากกว่า 0');
  }
}

function categoryToSummaryField(category: HourRequestCategory): 'coopHours' | 'volunteerHours' | 'majorHours' {
  switch (category) {
    case HourRequestCategory.COOP:
      return 'coopHours';
    case HourRequestCategory.VOLUNTEER:
      return 'volunteerHours';
    case HourRequestCategory.MAJOR:
      return 'majorHours';
  }
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function listMyHourRequests(studentId: string) {
  return prisma.hourRequest.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function listPendingHourRequests() {
  return prisma.hourRequest.findMany({
    where: { status: HourRequestStatus.PENDING },
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

  return prisma.hourRequest.create({
    data: {
      studentId: identity.userId,
      studentName: identity.userId, // display name isn't in the JWT; refined once UserProfile.displayName is set
      title: input.title.trim(),
      category: input.category,
      hours: input.hours,
      proofUrl: input.proofUrl || null,
      description: input.description || null,
      status: HourRequestStatus.PENDING,
    },
  });
}

/** Student edits a REJECTED request and resubmits it — resets to PENDING. */
export async function resubmitHourRequest(identity: Identity, requestId: string, input: HourRequestInput) {
  validateInput(input);

  const existing = await prisma.hourRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new HourRequestNotFoundError();
  if (existing.studentId !== identity.userId) throw new HourRequestOwnershipError();
  if (existing.status !== HourRequestStatus.REJECTED) {
    throw new HourRequestStateError('แก้ไขและยื่นใหม่ได้เฉพาะคำร้องที่ถูกปฏิเสธเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      title: input.title.trim(),
      category: input.category,
      hours: input.hours,
      proofUrl: input.proofUrl || null,
      description: input.description || null,
      status: HourRequestStatus.PENDING,
      rejectionReason: null,
      reviewedBy: null,
    },
  });
}

/** Staff/admin approves a PENDING request — credits hours into UserHourSummary. */
export async function approveHourRequest(identity: Identity, requestId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.hourRequest.findUnique({ where: { id: requestId } });
    if (!existing) throw new HourRequestNotFoundError();
    if (existing.status !== HourRequestStatus.PENDING) {
      throw new HourRequestStateError('อนุมัติได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
    }

    const field = categoryToSummaryField(existing.category);

    await tx.userHourSummary.upsert({
      where: { username: existing.studentId },
      create: { username: existing.studentId, [field]: existing.hours },
      update: { [field]: { increment: existing.hours } },
    });

    return tx.hourRequest.update({
      where: { id: requestId },
      data: {
        status: HourRequestStatus.APPROVED,
        reviewedBy: identity.userId,
        rejectionReason: null,
      },
    });
  });
}

/** Staff/admin rejects a PENDING request with a required reason. */
export async function rejectHourRequest(identity: Identity, requestId: string, reason: string) {
  if (!reason || reason.trim().length === 0) {
    throw new HourRequestStateError('กรุณาระบุเหตุผลที่ปฏิเสธหรือส่งกลับแก้ไข');
  }

  const existing = await prisma.hourRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new HourRequestNotFoundError();
  if (existing.status !== HourRequestStatus.PENDING) {
    throw new HourRequestStateError('ปฏิเสธได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      status: HourRequestStatus.REJECTED,
      rejectionReason: reason.trim(),
      reviewedBy: identity.userId,
    },
  });
}

export type { Prisma };