import { prisma } from '@/lib/prisma';
import { ActivityStatus, RegistrationStatus } from '@prisma/client';
import { MAX_WAITLIST_SIZE } from '@/lib/utils';

export type ActivityBadge =
  | { kind: 'REGISTERED' }
  | { kind: 'WAITING'; queueNumber: number }
  | { kind: 'AVAILABLE'; seatsLeft: number }
  | { kind: 'WAITLIST_OPEN'; spotsLeft: number }
  | { kind: 'FULL' }
  | { kind: 'CLOSED' };

export interface ActivityWithBadge {
  id: string;
  title: string;
  description: string;
  location: string;
  startTime: Date;
  endTime: Date;
  registrationDeadline: Date;
  capacity: number;
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
  status: ActivityStatus;
  registeredCount: number;
  waitingCount: number;
  badge: ActivityBadge;
}

function computeBadge(params: {
  status: ActivityStatus;
  registeredCount: number;
  waitingCount: number;
  capacity: number;
  deadline: Date;
  myStatus?: RegistrationStatus;
  myQueueNumber?: number | null;
}): ActivityBadge {
  const { status, registeredCount, waitingCount, capacity, deadline, myStatus, myQueueNumber } = params;

  if (myStatus === RegistrationStatus.REGISTERED) return { kind: 'REGISTERED' };
  if (myStatus === RegistrationStatus.WAITING) {
    return { kind: 'WAITING', queueNumber: myQueueNumber ?? 0 };
  }

  if (status !== ActivityStatus.OPEN || new Date() > deadline) return { kind: 'CLOSED' };

  const seatsLeft = capacity - registeredCount;
  if (seatsLeft > 0) return { kind: 'AVAILABLE', seatsLeft };

  const spotsLeft = MAX_WAITLIST_SIZE - waitingCount;
  if (spotsLeft > 0) return { kind: 'WAITLIST_OPEN', spotsLeft };

  return { kind: 'FULL' };
}

/** Activities for the student dashboard, each annotated with this user's
 * registration status and a ready-to-render badge. */
export async function getActivitiesForStudent(username: string): Promise<ActivityWithBadge[]> {
  const activities = await prisma.activity.findMany({
    orderBy: { startTime: 'asc' },
    include: {
      registrations: {
        where: { status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITING] } },
        select: { status: true, username: true, queueNumber: true },
      },
    },
  });

  return activities.map((a) => {
    const registeredCount = a.registrations.filter((r) => r.status === RegistrationStatus.REGISTERED).length;
    const waitingCount = a.registrations.filter((r) => r.status === RegistrationStatus.WAITING).length;
    const mine = a.registrations.find((r) => r.username === username);

    return {
      id: a.id,
      title: a.title,
      description: a.description,
      location: a.location,
      startTime: a.startTime,
      endTime: a.endTime,
      registrationDeadline: a.registrationDeadline,
      capacity: a.capacity,
      coopHours: a.coopHours,
      volunteerHours: a.volunteerHours,
      majorHours: a.majorHours,
      status: a.status,
      registeredCount,
      waitingCount,
      badge: computeBadge({
        status: a.status,
        registeredCount,
        waitingCount,
        capacity: a.capacity,
        deadline: a.registrationDeadline,
        myStatus: mine?.status,
        myQueueNumber: mine?.queueNumber,
      }),
    };
  });
}

export interface MyRegistrationRow {
  registrationId: string;
  activityId: string;
  activityTitle: string;
  status: RegistrationStatus;
  queueNumber: number | null;
  startTime: Date;
  creditedCoopHours: number | null;
  creditedVolunteerHours: number | null;
  creditedMajorHours: number | null;
}

export async function getMyRegistrations(username: string): Promise<MyRegistrationRow[]> {
  const rows = await prisma.registration.findMany({
    where: { username, status: { not: RegistrationStatus.CANCELLED } },
    include: { activity: { select: { title: true, startTime: true } } },
    orderBy: { activity: { startTime: 'desc' } },
  });

  return rows.map((r) => ({
    registrationId: r.id,
    activityId: r.activityId,
    activityTitle: r.activity.title,
    status: r.status,
    queueNumber: r.queueNumber,
    startTime: r.activity.startTime,
    creditedCoopHours: r.creditedCoopHours,
    creditedVolunteerHours: r.creditedVolunteerHours,
    creditedMajorHours: r.creditedMajorHours,
  }));
}

/** Convenience map for pages that need registrationId by activityId. */
export function toRegistrationIdMap(rows: MyRegistrationRow[]): Map<string, string> {
  return new Map(rows.map((r) => [r.activityId, r.registrationId]));
}

export async function getHourSummary(username: string) {
  const summary = await prisma.userHourSummary.findUnique({ where: { username } });
  return {
    coopHours: summary?.coopHours ?? 0,
    volunteerHours: summary?.volunteerHours ?? 0,
    majorHours: summary?.majorHours ?? 0,
  };
}

export async function getActivitiesForAdmin() {
  const activities = await prisma.activity.findMany({
    orderBy: { startTime: 'desc' },
    include: {
      _count: {
        select: {
          registrations: true,
        },
      },
      registrations: {
        where: { status: { in: [RegistrationStatus.REGISTERED, RegistrationStatus.WAITING] } },
        select: { status: true },
      },
    },
  });

  return activities.map((a) => ({
    id: a.id,
    title: a.title,
    startTime: a.startTime,
    location: a.location,
    status: a.status,
    capacity: a.capacity,
    registeredCount: a.registrations.filter((r) => r.status === RegistrationStatus.REGISTERED).length,
    waitingCount: a.registrations.filter((r) => r.status === RegistrationStatus.WAITING).length,
  }));
}

export interface AttendanceRow {
  registrationId: string;
  username: string;
  displayName: string | null;
  major: string | null;
  yearLevel: number | null;
  status: RegistrationStatus;
  queueNumber: number | null;
}

export async function getAttendanceRoster(activityId: string) {
  const activity = await prisma.activity.findUnique({ where: { id: activityId } });
  if (!activity) return null;

  const registrations = await prisma.registration.findMany({
    where: { activityId, status: { not: RegistrationStatus.CANCELLED } },
    include: { userProfile: { select: { displayName: true, major: true, yearLevel: true } } },
    orderBy: [{ status: 'asc' }, { queueNumber: 'asc' }, { registeredAt: 'asc' }],
  });

  const roster: AttendanceRow[] = registrations.map((r) => ({
    registrationId: r.id,
    username: r.username,
    displayName: r.userProfile.displayName,
    major: r.userProfile.major,
    yearLevel: r.userProfile.yearLevel,
    status: r.status,
    queueNumber: r.queueNumber,
  }));

  const seated = roster.filter((r) =>
    ([
      RegistrationStatus.REGISTERED,
      RegistrationStatus.ATTENDED,
      RegistrationStatus.ABSENT,
    ] as RegistrationStatus[]).includes(r.status)
  );
  const waiting = roster.filter((r) => r.status === RegistrationStatus.WAITING);

  return { activity, seated, waiting };
}

export async function getPrintRoster(activityId: string) {
  return getAttendanceRoster(activityId);

}
// ---------------------------------------------------------------------------
// สรุปรายชื่อนักศึกษา (Admin) — hour totals per student for the summary page
// ---------------------------------------------------------------------------

export interface StudentSummaryRow {
  username: string;
  displayName: string | null;
  major: string | null;
  yearLevel: number | null;
  coopHours: number;
  volunteerHours: number;
  majorHours: number;
  eligible: boolean;
}

export async function getAllStudentsSummary(): Promise<StudentSummaryRow[]> {
  const profiles = await prisma.userProfile.findMany({
    where: { layer2Role: 'student' },
    include: { hourSummary: true },
    orderBy: { username: 'asc' },
  });

  return profiles.map((p) => {
    const coopHours = p.hourSummary?.coopHours ?? 0;
    return {
      username: p.username,
      displayName: p.displayName,
      major: p.major,
      yearLevel: p.yearLevel,
      coopHours,
      volunteerHours: p.hourSummary?.volunteerHours ?? 0,
      majorHours: p.hourSummary?.majorHours ?? 0,
      eligible: coopHours >= 15,
    };
  });
}