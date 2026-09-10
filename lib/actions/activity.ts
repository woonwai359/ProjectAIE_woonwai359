'use server';

import { revalidatePath } from 'next/cache';
import { Prisma, ActivityStatus, RegistrationStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getIdentity, requireAdmin, ForbiddenError, UnauthorizedError } from '@/lib/auth';
import { MAX_WAITLIST_SIZE } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Shared result type — every action returns this instead of throwing across
// the server/client boundary, so the UI can render inline errors.
// ---------------------------------------------------------------------------

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

function handleKnownErrors(err: unknown): ActionResult<never> {
  if (err instanceof UnauthorizedError) {
    return { success: false, error: 'ไม่พบข้อมูลผู้ใช้จาก API Gateway กรุณาเข้าสู่ระบบใหม่' };
  }
  if (err instanceof ForbiddenError) {
    return { success: false, error: 'คุณไม่มีสิทธิ์ทำรายการนี้ (ต้องเป็นเจ้าหน้าที่/อาจารย์)' };
  }
  if (err instanceof z.ZodError) {
    return { success: false, error: err.errors.map((e) => e.message).join(', ') };
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return { success: false, error: 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ' };
    }
    if (err.code === 'P2034') {
      return { success: false, error: 'มีผู้ใช้งานพร้อมกันจำนวนมาก กรุณาลองใหม่อีกครั้ง' };
    }
  }
  console.error('[csmju-coop-hours] Unhandled action error:', err);
  return { success: false, error: 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง' };
}

// ---------------------------------------------------------------------------
// 1. createActivity — admin only
// ---------------------------------------------------------------------------

const createActivitySchema = z
  .object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่อกิจกรรม').max(200),
    description: z.string().trim().min(1, 'กรุณากรอกรายละเอียดกิจกรรม'),
    location: z.string().trim().min(1, 'กรุณากรอกสถานที่'),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    registrationDeadline: z.coerce.date(),
    capacity: z.coerce.number().int().min(1, 'จำนวนที่นั่งต้องมากกว่า 0'),
    lecturerInCharge: z.string().trim().min(1, 'กรุณาระบุอาจารย์ผู้รับผิดชอบ'),
    coopHours: z.coerce.number().min(0).default(0),
    volunteerHours: z.coerce.number().min(0).default(0),
    majorHours: z.coerce.number().min(0).default(0),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มกิจกรรม',
    path: ['endTime'],
  })
  .refine((data) => data.registrationDeadline <= data.startTime, {
    message: 'วันปิดรับสมัครต้องอยู่ก่อนหรือเท่ากับเวลาเริ่มกิจกรรม',
    path: ['registrationDeadline'],
  })
  .refine((data) => data.coopHours > 0 || data.volunteerHours > 0 || data.majorHours > 0, {
    message: 'กิจกรรมต้องให้ชั่วโมงอย่างน้อยหนึ่งประเภท',
    path: ['coopHours'],
  });

export async function createActivity(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const identity = getIdentity();
    requireAdmin(identity);

    const parsed = createActivitySchema.parse({
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      startTime: formData.get('startTime'),
      endTime: formData.get('endTime'),
      registrationDeadline: formData.get('registrationDeadline'),
      capacity: formData.get('capacity'),
      lecturerInCharge: formData.get('lecturerInCharge'),
      coopHours: formData.get('coopHours') || 0,
      volunteerHours: formData.get('volunteerHours') || 0,
      majorHours: formData.get('majorHours') || 0,
    });

    const activity = await prisma.activity.create({
      data: {
        ...parsed,
        status: ActivityStatus.OPEN,
        createdByUsername: identity.userId,
      },
      select: { id: true },
    });

    revalidatePath('/admin/activities');
    revalidatePath('/dashboard');
    return { success: true, data: activity };
  } catch (err) {
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 2. registerActivity — student self-registration, race-condition safe
// ---------------------------------------------------------------------------

export async function registerActivity(
  activityId: string
): Promise<ActionResult<{ status: RegistrationStatus; queueNumber: number | null }>> {
  try {
    const identity = getIdentity();

    // Ensure a UserProfile row exists (first-touch mirror of shared identity).
    await prisma.userProfile.upsert({
      where: { username: identity.userId },
      update: {},
      create: { username: identity.userId },
    });

    const result = await prisma.$transaction(
      async (tx) => {
        const activity = await tx.activity.findUnique({ where: { id: activityId } });
        if (!activity) {
          throw new Error('ไม่พบกิจกรรมนี้ในระบบ');
        }
        if (activity.status !== ActivityStatus.OPEN) {
          throw new Error('กิจกรรมนี้ปิดรับสมัครแล้ว');
        }
        if (new Date() > activity.registrationDeadline) {
          throw new Error('หมดเขตรับสมัครกิจกรรมนี้แล้ว');
        }

        const existing = await tx.registration.findUnique({
          where: { activityId_username: { activityId, username: identity.userId } },
        });
        if (existing && existing.status !== RegistrationStatus.CANCELLED) {
          throw new Error('คุณลงทะเบียนกิจกรรมนี้ไว้แล้ว');
        }

        const activeCount = await tx.registration.count({
          where: { activityId, status: RegistrationStatus.REGISTERED },
        });
        const waitingCount = await tx.registration.count({
          where: { activityId, status: RegistrationStatus.WAITING },
        });

        let status: RegistrationStatus;
        let queueNumber: number | null = null;

        if (activeCount < activity.capacity) {
          status = RegistrationStatus.REGISTERED;
        } else if (waitingCount < MAX_WAITLIST_SIZE) {
          status = RegistrationStatus.WAITING;
          queueNumber = waitingCount + 1;
        } else {
          throw new Error('ที่นั่งและคิวสำรองเต็มแล้ว');
        }

        const data = {
          status,
          queueNumber,
          registeredAt: new Date(),
          cancelledAt: null,
        };

        const registration = existing
          ? await tx.registration.update({ where: { id: existing.id }, data })
          : await tx.registration.create({
              data: { activityId, username: identity.userId, ...data },
            });

        return { status: registration.status, queueNumber: registration.queueNumber };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath('/dashboard');
    revalidatePath(`/admin/activities/${activityId}/attendance`);
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof Error && !(err instanceof Prisma.PrismaClientKnownRequestError)) {
      // Business-rule errors thrown with plain `throw new Error(...)` above.
      return { success: false, error: err.message };
    }
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 3. cancelRegistration — with waiting-list auto-promotion
// ---------------------------------------------------------------------------

export async function cancelRegistration(registrationId: string): Promise<ActionResult> {
  try {
    const identity = getIdentity();

    await prisma.$transaction(
      async (tx) => {
        const registration = await tx.registration.findUnique({ where: { id: registrationId } });
        if (!registration) {
          throw new Error('ไม่พบรายการลงทะเบียนนี้');
        }
        // Students may only cancel their own registration; admins may cancel any.
        if (identity.subsystemRole !== 'admin' && registration.username !== identity.userId) {
          throw new ForbiddenError('คุณสามารถยกเลิกได้เฉพาะการลงทะเบียนของตนเอง');
        }
        if (
          registration.status !== RegistrationStatus.REGISTERED &&
          registration.status !== RegistrationStatus.WAITING
        ) {
          throw new Error('ไม่สามารถยกเลิกรายการนี้ได้');
        }

        const wasRegistered = registration.status === RegistrationStatus.REGISTERED;

        await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: RegistrationStatus.CANCELLED,
            queueNumber: null,
            cancelledAt: new Date(),
          },
        });

        if (wasRegistered) {
          // Promote the first waiting student, if any, into the freed seat.
          const nextInLine = await tx.registration.findFirst({
            where: { activityId: registration.activityId, status: RegistrationStatus.WAITING, queueNumber: 1 },
          });

          if (nextInLine) {
            await tx.registration.update({
              where: { id: nextInLine.id },
              data: { status: RegistrationStatus.REGISTERED, queueNumber: null },
            });

            // Shift everyone else up by one. Ordered ascending so the
            // @@unique([activityId, queueNumber]) constraint is never
            // briefly violated mid-loop.
            const remaining = await tx.registration.findMany({
              where: {
                activityId: registration.activityId,
                status: RegistrationStatus.WAITING,
                queueNumber: { gt: 1 },
              },
              orderBy: { queueNumber: 'asc' },
            });
            for (const r of remaining) {
              await tx.registration.update({
                where: { id: r.id },
                data: { queueNumber: (r.queueNumber ?? 1) - 1 },
              });
            }
          }
        } else {
          // A waiting-list student cancelled: close the gap behind them.
          const behind = await tx.registration.findMany({
            where: {
              activityId: registration.activityId,
              status: RegistrationStatus.WAITING,
              queueNumber: { gt: registration.queueNumber ?? 0 },
            },
            orderBy: { queueNumber: 'asc' },
          });
          for (const r of behind) {
            await tx.registration.update({
              where: { id: r.id },
              data: { queueNumber: (r.queueNumber ?? 1) - 1 },
            });
          }
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (err) {
    if (err instanceof Error && !(err instanceof Prisma.PrismaClientKnownRequestError) && !(err instanceof ForbiddenError)) {
      return { success: false, error: err.message };
    }
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 4. batchConfirmAttendance — admin only, credits hours immediately
// ---------------------------------------------------------------------------

export async function batchConfirmAttendance(
  activityId: string,
  attendedUsernames: string[]
): Promise<ActionResult<{ attended: number; absent: number }>> {
  try {
    const identity = getIdentity();
    requireAdmin(identity);

    const attendedSet = new Set(attendedUsernames);

    const result = await prisma.$transaction(async (tx) => {
      const activity = await tx.activity.findUnique({ where: { id: activityId } });
      if (!activity) throw new Error('ไม่พบกิจกรรมนี้ในระบบ');

      // Only students holding a confirmed seat can be marked present/absent —
      // waiting-list students who were never promoted have nothing to credit.
      const seated = await tx.registration.findMany({
        where: {
          activityId,
          status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.ATTENDED, RegistrationStatus.ABSENT] },
        },
      });

      let attended = 0;
      let absent = 0;

      for (const reg of seated) {
        if (attendedSet.has(reg.username)) {
          await tx.registration.update({
            where: { id: reg.id },
            data: {
              status: RegistrationStatus.ATTENDED,
              attendedAt: new Date(),
              creditedCoopHours: activity.coopHours,
              creditedVolunteerHours: activity.volunteerHours,
              creditedMajorHours: activity.majorHours,
            },
          });

          await tx.userHourSummary.upsert({
            where: { username: reg.username },
            create: {
              username: reg.username,
              coopHours: activity.coopHours,
              volunteerHours: activity.volunteerHours,
              majorHours: activity.majorHours,
            },
            update: {
              coopHours: { increment: activity.coopHours },
              volunteerHours: { increment: activity.volunteerHours },
              majorHours: { increment: activity.majorHours },
            },
          });

          attended += 1;
        } else {
          // Was previously ATTENDED and is now being un-checked: reverse the credit.
          if (reg.status === RegistrationStatus.ATTENDED) {
            await tx.userHourSummary.upsert({
              where: { username: reg.username },
              create: { username: reg.username, coopHours: 0, volunteerHours: 0, majorHours: 0 },
              update: {
                coopHours: { decrement: reg.creditedCoopHours ?? 0 },
                volunteerHours: { decrement: reg.creditedVolunteerHours ?? 0 },
                majorHours: { decrement: reg.creditedMajorHours ?? 0 },
              },
            });
          }

          await tx.registration.update({
            where: { id: reg.id },
            data: {
              status: RegistrationStatus.ABSENT,
              attendedAt: null,
              creditedCoopHours: null,
              creditedVolunteerHours: null,
              creditedMajorHours: null,
            },
          });
          absent += 1;
        }
      }

      return { attended, absent };
    });

    revalidatePath(`/admin/activities/${activityId}/attendance`);
    revalidatePath('/dashboard');
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof Error && !(err instanceof Prisma.PrismaClientKnownRequestError) && !(err instanceof ForbiddenError)) {
      return { success: false, error: err.message };
    }
    return handleKnownErrors(err);
  }
}

// ---------------------------------------------------------------------------
// 5. closeActivity — convenience admin action used by the activities list
// ---------------------------------------------------------------------------

export async function setActivityStatus(
  activityId: string,
  status: ActivityStatus
): Promise<ActionResult> {
  try {
    const identity = getIdentity();
    requireAdmin(identity);

    await prisma.activity.update({ where: { id: activityId }, data: { status } });

    revalidatePath('/admin/activities');
    revalidatePath('/dashboard');
    return { success: true, data: undefined };
  } catch (err) {
    return handleKnownErrors(err);
  }
}
