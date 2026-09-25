import { HourRequestCategory, HourRequestStatus, Prisma } from '@prisma/client';
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
  category?: HourRequestCategory | string;
  hours: number;
  proofUrl?: string | null;
  description?: string | null;
}

function parseCategory(category?: string): HourRequestCategory {
  if (category === 'VOLUNTEER') return HourRequestCategory.VOLUNTEER;
  if (category === 'MAJOR') return HourRequestCategory.MAJOR;
  return HourRequestCategory.COOP;
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
      studentName: identity.userId,
      title: input.title.trim(),
      category: parseCategory(input.category),
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
      category: input.category ? parseCategory(input.category) : existing.category,
      hours: input.hours,
      proofUrl: input.proofUrl || null,
      description: input.description || null,
      status: HourRequestStatus.PENDING,
      rejectionReason: null,
    },
  });
}

/** Staff/admin approves a PENDING request */
export async function approveHourRequest(identity: Identity, requestId: string) {
  const existing = await prisma.hourRequest.findUnique({ where: { id: requestId } });
  if (!existing) throw new HourRequestNotFoundError();
  if (existing.status !== HourRequestStatus.PENDING) {
    throw new HourRequestStateError('อนุมัติได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      status: HourRequestStatus.APPROVED,
      reviewedBy: identity.userId,
      rejectionReason: null,
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
  if (existing.status !== HourRequestStatus.PENDING) {
    throw new HourRequestStateError('ปฏิเสธได้เฉพาะคำร้องที่สถานะรอตรวจสอบเท่านั้น');
  }

  return prisma.hourRequest.update({
    where: { id: requestId },
    data: {
      status: HourRequestStatus.REJECTED,
      reviewedBy: identity.userId,
      rejectionReason: reason.trim(),
    },
  });
}

export type { Prisma };