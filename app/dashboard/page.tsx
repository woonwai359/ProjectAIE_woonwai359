import Link from 'next/link';
import { getIdentity } from '@/lib/auth';
import { getActivitiesForStudent, getHourSummary, getMyRegistrations, toRegistrationIdMap } from '@/lib/queries';
import { listMyHourRequests } from '@/lib/services/hourRequest';
import { CoopProgress, HourSummaryCards } from '@/components/CoopProgress';
import { ActivityCard } from '@/components/ActivityCard';
import { RequestHistoryTable } from '@/components/RequestHistoryTable';

export const dynamic = 'force-dynamic'; // identity/registrations change per-request

export default async function DashboardPage() {
  const identity = getIdentity();

  const [summary, activities, myRegistrations, myRequests] = await Promise.all([
    getHourSummary(identity.userId),
    getActivitiesForStudent(identity.userId),
    getMyRegistrations(identity.userId),
    listMyHourRequests(identity.userId),
  ]);

  const registrationIdByActivity = toRegistrationIdMap(myRegistrations);

  const upcoming = activities.filter((a) => a.status !== 'COMPLETED');
  const past = activities.filter((a) => a.status === 'COMPLETED');
  const recentRequests = myRequests.slice(0, 3);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">สวัสดี, {identity.userId}</h1>
          <p className="text-sm text-slate-500">ภาพรวมชั่วโมงสหกิจและกิจกรรมของคุณ</p>
        </div>
        <Link href="/requests/new" className="btn-primary">
          + ยื่นขอชั่วโมงกิจกรรม
        </Link>
      </div>

      <CoopProgress coopHoursEarned={summary.coopHours} />
      <HourSummaryCards volunteerHours={summary.volunteerHours} majorHours={summary.majorHours} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-primary-dark">ประวัติคำร้องล่าสุด</h2>
          <Link href="/requests" className="text-sm text-primary hover:underline">
            ดูทั้งหมด →
          </Link>
        </div>
        <RequestHistoryTable requests={recentRequests} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-primary-dark">กิจกรรมที่เปิดรับสมัคร / ที่คุณลงทะเบียนไว้</h2>
        {upcoming.length === 0 ? (
          <p className="card p-6 text-sm text-slate-500">ยังไม่มีกิจกรรมในระบบขณะนี้</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                registrationId={registrationIdByActivity.get(activity.id)}
              />
            ))}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-primary-dark">กิจกรรมที่เสร็จสิ้นแล้ว</h2>
          <div className="space-y-3">
            {past.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                registrationId={registrationIdByActivity.get(activity.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}