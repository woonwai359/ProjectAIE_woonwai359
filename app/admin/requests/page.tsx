import { getIdentity, requireAdmin } from '@/lib/auth';
import { listPendingHourRequests } from '@/lib/services/hourRequest';
import { AdminRequestsTable } from '@/components/AdminRequestsTable';

export const dynamic = 'force-dynamic';

export default async function AdminRequestsPage() {
  const identity = getIdentity();
  requireAdmin(identity);

  const requests = await listPendingHourRequests();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">คำร้องขอชั่วโมงรอตรวจสอบ</h1>
        <p className="text-sm text-slate-500">รายการที่นักศึกษายื่นมาและยังไม่ถูกตอบรับหรือปฏิเสธ</p>
      </div>

      <AdminRequestsTable requests={requests} />
    </div>
  );
}
