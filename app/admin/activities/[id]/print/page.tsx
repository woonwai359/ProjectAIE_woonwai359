import { notFound } from 'next/navigation';
import { getIdentity, requireAdmin } from '@/lib/auth';
import { getPrintRoster } from '@/lib/queries';
import { formatHours, formatThaiDate, formatThaiDateTime } from '@/lib/utils';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function PrintAttendanceSheetPage({ params }: { params: { id: string } }) {
  const identity = getIdentity();
  requireAdmin(identity);

  const roster = await getPrintRoster(params.id);
  if (!roster) notFound();

  const { activity, seated, waiting } = roster;

  const hourParts = [
    activity.coopHours > 0 ? `สหกิจ ${formatHours(activity.coopHours)} ชม.` : null,
    activity.volunteerHours > 0 ? `จิตอาสา ${formatHours(activity.volunteerHours)} ชม.` : null,
    activity.majorHours > 0 ? `สาขา ${formatHours(activity.majorHours)} ชม.` : null,
  ].filter(Boolean);

  // Fixed-length blank rows so the printed sheet always has 5 waiting-list
  // lines available, even if fewer students are currently queued.
  const waitingRows = Array.from({ length: 5 }, (_, i) => waiting[i] ?? null);

  return (
    <div className="space-y-4">
      <div className="no-print flex justify-end">
        <PrintButton />
      </div>

      <div className="print-sheet card mx-auto max-w-3xl space-y-6 p-8 text-neutral">
        <header className="space-y-1 border-b border-slate-300 pb-4">
          <p className="text-xs text-slate-500">
            สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้ · ใบเซ็นชื่อเข้าร่วมกิจกรรม
          </p>
          <h1 className="text-xl font-bold text-primary-dark">{activity.title}</h1>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex gap-2">
              <dt className="font-medium text-slate-500">วัน/เวลา:</dt>
              <dd>
                {formatThaiDateTime(activity.startTime)} – {formatThaiDate(activity.endTime)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-slate-500">สถานที่:</dt>
              <dd>{activity.location}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-slate-500">อาจารย์ผู้รับผิดชอบ:</dt>
              <dd>{activity.lecturerInCharge}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-medium text-slate-500">ชั่วโมงที่ได้รับ:</dt>
              <dd>{hourParts.length > 0 ? hourParts.join(' · ') : '—'}</dd>
            </div>
          </dl>
        </header>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-neutral text-left">
              <th className="w-10 py-2 pr-2">ลำดับ</th>
              <th className="w-28 py-2 pr-2">รหัส นศ.</th>
              <th className="py-2 pr-2">ชื่อ-สกุล</th>
              <th className="w-24 py-2 pr-2">ชั้นปี/สาขา</th>
              <th className="w-32 py-2 pr-2">ช่องเซ็นชื่อเข้า</th>
              <th className="w-20 py-2">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {seated.map((row, i) => (
              <tr key={row.registrationId} className="border-b border-slate-200">
                <td className="py-2 pr-2 align-top">{i + 1}</td>
                <td className="py-2 pr-2 align-top">{row.username}</td>
                <td className="py-2 pr-2 align-top">{row.displayName ?? ''}</td>
                <td className="py-2 pr-2 align-top">
                  {row.yearLevel ? `ปี ${row.yearLevel}` : ''} {row.major ?? ''}
                </td>
                <td className="py-2 pr-2 align-top">&nbsp;</td>
                <td className="py-2 align-top">&nbsp;</td>
              </tr>
            ))}
            {seated.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-400">
                  ไม่มีผู้ลงทะเบียนที่ได้ที่นั่ง
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <section className="space-y-2 border-t-2 border-dashed border-slate-300 pt-4">
          <h2 className="text-sm font-semibold text-primary-dark">
            รายชื่อคิวสำรอง (สำหรับกรณีผู้เข้าร่วมหลักไม่มาตามนัด — สูงสุด 5 คน)
          </h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-neutral text-left">
                <th className="w-10 py-2 pr-2">คิวที่</th>
                <th className="w-28 py-2 pr-2">รหัส นศ.</th>
                <th className="py-2 pr-2">ชื่อ-สกุล</th>
                <th className="w-32 py-2 pr-2">ช่องเซ็นชื่อเข้า</th>
                <th className="w-20 py-2">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {waitingRows.map((row, i) => (
                <tr key={row?.registrationId ?? `blank-${i}`} className="border-b border-slate-200">
                  <td className="py-2 pr-2">{i + 1}</td>
                  <td className="py-2 pr-2">{row?.username ?? ''}</td>
                  <td className="py-2 pr-2">{row?.displayName ?? ''}</td>
                  <td className="py-2 pr-2">&nbsp;</td>
                  <td className="py-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="flex justify-between border-t border-slate-300 pt-4 text-xs text-slate-400">
          <span>เอกสารสร้างโดยระบบ CSMJU Co-op Prep &amp; Activity Hours Tracking System</span>
          <span>พิมพ์เมื่อ {formatThaiDateTime(new Date())}</span>
        </footer>
      </div>
    </div>
  );
}
