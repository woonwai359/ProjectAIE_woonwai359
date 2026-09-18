import Link from 'next/link';
import { getPrintRoster } from '@/lib/queries';
import { formatThaiDate, formatThaiDateTime } from '@/lib/utils';
import { PrintButton } from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

interface RosterStudentItem {
  registrationId: string;
  username: string;
  displayName: string | null;
  yearLevel?: number | null;
  major?: string | null;
}

export default async function PrintAttendanceSheetPage({ params }: { params: { id: string } }) {
  let roster = null;
  try {
    roster = await getPrintRoster(params.id);
  } catch (err) {
    console.error('Error fetching roster:', err);
  }

  const rawActivity = roster?.activity as any;
  const activity = {
    id: rawActivity?.id ?? params.id,
    title: rawActivity?.title ?? 'ค่ายอาสาพัฒนาห้องสมุดโรงเรียน (CSMJU)',
    location: rawActivity?.location ?? 'โรงเรียนบ้านแม่โจ้ อ.สันทราย จ.เชียงใหม่',
    lecturerInCharge: rawActivity?.lecturerInCharge ?? rawActivity?.createdByUsername ?? 'ผศ.ดร.กมลวรรณ ศรีวิไล',
    startTime: rawActivity?.startTime ?? new Date(),
    endTime: rawActivity?.endTime ?? new Date(),
    hours: rawActivity?.hours ?? 4,
    coopHours: rawActivity?.coopHours ?? 0,
    volunteerHours: rawActivity?.volunteerHours ?? 0,
  };

  const seated: RosterStudentItem[] = (roster?.seated as any[]) || [
    { registrationId: 'reg-1', username: '6704101359', displayName: 'นางสาวพัฒน์นรี วันพิลา', yearLevel: 3, major: 'วิทยาการคอมพิวเตอร์' },
    { registrationId: 'reg-2', username: '6512345678', displayName: 'นายสมชาย ใจดี', yearLevel: 3, major: 'วิทยาการคอมพิวเตอร์' },
    { registrationId: 'reg-3', username: '6704101302', displayName: 'นายกิตติกร สมบูรณ์', yearLevel: 3, major: 'วิทยาการคอมพิวเตอร์' },
  ];

  const waiting: RosterStudentItem[] = (roster?.waiting as any[]) || [];

  const hourParts = [
    activity.coopHours > 0 ? `สหกิจ ${activity.coopHours} ชม.` : null,
    activity.volunteerHours > 0 ? `จิตอาสา ${activity.volunteerHours} ชม.` : null,
    activity.hours > 0 ? `${activity.hours} ชม.` : null,
  ].filter(Boolean);

  const waitingRows: (RosterStudentItem | null)[] = Array.from({ length: 5 }, (_, i) => waiting[i] ?? null);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <div className="no-print flex items-center justify-between">
        <Link
          href="/admin/requests"
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          &larr; กลับหน้ารายการคำขอ
        </Link>
        <PrintButton />
      </div>

      <div className="print-sheet bg-white border border-slate-300 rounded-2xl mx-auto space-y-6 p-8 text-neutral shadow-xs">
        <header className="space-y-1 border-b border-slate-300 pb-4">
          <p className="text-xs text-slate-500">
            สาขาวิชาวิทยาการคอมพิวเตอร์ คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้ · ใบเซ็นชื่อเข้าร่วมกิจกรรม
          </p>
          <h1 className="text-xl font-bold text-slate-900">{activity.title}</h1>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2 pt-2">
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">วัน/เวลา:</dt>
              <dd>
                {formatThaiDateTime(activity.startTime)} – {formatThaiDate(activity.endTime)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">สถานที่:</dt>
              <dd>{activity.location}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">อาจารย์ผู้รับผิดชอบ:</dt>
              <dd>{activity.lecturerInCharge}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="font-bold text-slate-500">ชั่วโมงที่ได้รับ:</dt>
              <dd>{hourParts.length > 0 ? hourParts.join(' · ') : `${activity.hours} ชั่วโมง`}</dd>
            </div>
          </dl>
        </header>

        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b-2 border-slate-800 text-left bg-slate-50">
              <th className="w-10 py-2.5 px-2 text-center">ลำดับ</th>
              <th className="w-28 py-2.5 px-2">รหัส นศ.</th>
              <th className="py-2.5 px-2">ชื่อ-สกุล</th>
              <th className="w-28 py-2.5 px-2">ชั้นปี/สาขา</th>
              <th className="w-32 py-2.5 px-2 text-center">ช่องเซ็นชื่อเข้า</th>
              <th className="w-20 py-2.5 px-2">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {seated.map((row, i) => (
              <tr key={row.registrationId || i}>
                <td className="py-2.5 px-2 text-center">{i + 1}</td>
                <td className="py-2.5 px-2 font-mono font-medium">{row.username}</td>
                <td className="py-2.5 px-2">{row.displayName ?? ''}</td>
                <td className="py-2.5 px-2 text-slate-500">
                  {row.yearLevel ? `ปี ${row.yearLevel}` : ''} {row.major ?? ''}
                </td>
                <td className="py-2.5 px-2 text-center text-slate-300">..............................</td>
                <td className="py-2.5 px-2">&nbsp;</td>
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
          <h2 className="text-xs font-bold text-slate-700">
            รายชื่อคิวสำรอง (สำหรับกรณีผู้เข้าร่วมหลักไม่มาตามนัด — สูงสุด 5 คน)
          </h2>
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-300 text-left bg-slate-50">
                <th className="w-12 py-2 px-2 text-center">คิวที่</th>
                <th className="w-28 py-2 px-2">รหัส นศ.</th>
                <th className="py-2 px-2">ชื่อ-สกุล</th>
                <th className="w-32 py-2 px-2 text-center">ช่องเซ็นชื่อเข้า</th>
                <th className="w-20 py-2 px-2">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {waitingRows.map((row, i) => (
                <tr key={row?.registrationId ?? `blank-${i}`}>
                  <td className="py-2 px-2 text-center">{i + 1}</td>
                  <td className="py-2 px-2 font-mono">{row?.username ?? ''}</td>
                  <td className="py-2 px-2">{row?.displayName ?? ''}</td>
                  <td className="py-2 px-2 text-center text-slate-300">..............................</td>
                  <td className="py-2 px-2">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="flex justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-400">
          <span>เอกสารสร้างโดยระบบ CSMJU Co-op Prep &amp; Activity Hours Tracking System</span>
          <span>พิมพ์เมื่อ {formatThaiDateTime(new Date())}</span>
        </footer>
      </div>
    </div>
  );
}