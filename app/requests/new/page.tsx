import { getIdentity } from '@/lib/auth';
import { HourRequestForm } from '@/components/HourRequestForm';

export const dynamic = 'force-dynamic';

export default function NewRequestPage() {
  const identity = getIdentity();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">ยื่นขอชั่วโมงกิจกรรม</h1>
        <p className="text-sm text-slate-500">กรอกรายละเอียดการทำกิจกรรมหรืองานอาสาที่เกี่ยวข้อง</p>
      </div>

      <HourRequestForm />
    </div>
  );
}
