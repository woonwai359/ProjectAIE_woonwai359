import type { HourRequestStatus } from '@prisma/client';

const STYLES: Record<HourRequestStatus, string> = {
  PENDING: 'bg-amber-100 text-warning',
  APPROVED: 'bg-success/10 text-success',
  REJECTED: 'bg-red-50 text-danger',
};

const LABELS: Record<HourRequestStatus, string> = {
  PENDING: 'รอตรวจสอบ',
  APPROVED: 'อนุมัติแล้ว',
  REJECTED: 'ถูกปฏิเสธ / ส่งกลับแก้ไข',
};

export function RequestStatusBadge({ status }: { status: HourRequestStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}