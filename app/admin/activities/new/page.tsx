import { getIdentity, requireAdmin } from '@/lib/auth';
import { NewActivityForm } from '@/components/NewActivityForm';

export default function NewActivityPage() {
  const identity = getIdentity();
  requireAdmin(identity);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-dark">สร้างกิจกรรมใหม่</h1>
        <p className="text-sm text-slate-500">กำหนดโควตา ประเภทชั่วโมง และกำหนดเวลาต่างๆ</p>
      </div>
      <NewActivityForm />
    </div>
  );
}
