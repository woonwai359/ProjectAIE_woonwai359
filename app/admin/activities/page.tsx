import Link from 'next/link';
import { getIdentity, requireAdmin } from '@/lib/auth';
import { getActivitiesForAdmin } from '@/lib/queries';
import { formatThaiDateTime } from '@/lib/utils';
import { StatusToggle } from '@/components/StatusToggle';

export const dynamic = 'force-dynamic';

export default async function AdminActivitiesPage() {
  const identity = getIdentity();
  requireAdmin(identity);

  const activities = await getActivitiesForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">จัดการกิจกรรม</h1>
          <p className="text-sm text-slate-500">สร้าง แก้ไขสถานะ พิมพ์ใบเซ็นชื่อ และยืนยันการเข้าร่วม</p>
        </div>
        <Link href="/admin/activities/new" className="btn-primary">
          + สร้างกิจกรรมใหม่
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary text-primary-dark">
            <tr>
              <th className="px-4 py-3 font-medium">กิจกรรม</th>
              <th className="px-4 py-3 font-medium">วันเวลา</th>
              <th className="px-4 py-3 font-medium">ที่นั่ง</th>
              <th className="px-4 py-3 font-medium">คิวสำรอง</th>
              <th className="px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3 font-medium">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.location}</p>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatThaiDateTime(a.startTime)}</td>
                <td className="px-4 py-3 text-slate-600">
                  {a.registeredCount}/{a.capacity}
                </td>
                <td className="px-4 py-3 text-slate-600">{a.waitingCount}/5</td>
                <td className="px-4 py-3">
                  <StatusToggle activityId={a.id} currentStatus={a.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-3">
                    <Link href={`/admin/activities/${a.id}/attendance`} className="text-primary hover:underline">
                      ยืนยันการเข้าร่วม
                    </Link>
                    <Link href={`/admin/activities/${a.id}/print`} className="text-primary hover:underline">
                      ใบเซ็นชื่อ (A4)
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  ยังไม่มีกิจกรรมในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
