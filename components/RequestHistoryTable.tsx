import Link from 'next/link';
import type { HourRequest } from '@prisma/client';
import { RequestStatusBadge } from '@/components/RequestStatusBadge';
import { formatHours, formatThaiDate } from '@/lib/utils';

const CATEGORY_LABEL: Record<string, string> = {
  COOP: 'สหกิจ',
  VOLUNTEER: 'จิตอาสา',
  MAJOR: 'สาขา',
};

export function RequestHistoryTable({ requests }: { requests: HourRequest[] }) {
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-secondary text-primary-dark">
          <tr>
            <th className="px-4 py-3 font-medium">กิจกรรม</th>
            <th className="px-4 py-3 font-medium">หมวดหมู่</th>
            <th className="px-4 py-3 font-medium">ชั่วโมง</th>
            <th className="px-4 py-3 font-medium">เบิกหลักฐาน</th>
            <th className="px-4 py-3 font-medium">สถานะ</th>
            <th className="px-4 py-3 font-medium">วันที่ยื่น</th>
            <th className="px-4 py-3 font-medium">การจัดการ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {requests.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-neutral">{r.title}</p>
                {r.description && <p className="text-xs text-slate-400 line-clamp-1">{r.description}</p>}
              </td>
              <td className="px-4 py-3 text-slate-600">{CATEGORY_LABEL[r.category] ?? r.category}</td>
              <td className="px-4 py-3 text-slate-600">{formatHours(r.hours)} ชม.</td>
              <td className="px-4 py-3 text-slate-600">
                {r.proofUrl ? (
                  <a href={r.proofUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    ดูหลักฐาน
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <RequestStatusBadge status={r.status} />
                {r.status === 'REJECTED' && r.rejectionReason && (
                  <p className="mt-1 max-w-xs text-xs text-danger line-clamp-2">{r.rejectionReason}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-500">{formatThaiDate(r.createdAt)}</td>
              <td className="px-4 py-3">
                {r.status === 'REJECTED' ? (
                  <Link
                    href={`/requests/${r.id}/edit`}
                    className="text-sm text-primary hover:underline"
                  >
                    แก้ไขและยื่นใหม่
                  </Link>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
          {requests.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                คุณยังไม่มีคำร้องขอชั่วโมงกิจกรรม
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
