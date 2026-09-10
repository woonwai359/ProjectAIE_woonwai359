import Link from 'next/link';
import { getIdentityOrNull } from '@/lib/auth';

export function NavBar() {
  const identity = getIdentityOrNull();
  const isAdmin = identity?.subsystemRole === 'admin';

  return (
    <header className="no-print border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href={isAdmin ? '/admin/requests' : '/dashboard'} className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">
            CS
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-primary-dark">ชั่วโมงสหกิจ &amp; กิจกรรม</p>
            <p className="text-xs text-slate-500">CSMJU2030 · วิทยาการคอมพิวเตอร์</p>
          </div>
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {isAdmin ? (
            <>
              <Link href="/admin/requests" className="text-neutral hover:text-primary">
                รายการรออนุมัติ
              </Link>
              <Link href="/admin/activities" className="text-neutral hover:text-primary">
                จัดการกิจกรรม
              </Link>
              <Link href="/admin/students" className="text-neutral hover:text-primary">
                สรุปรายชื่อนักศึกษา
              </Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-neutral hover:text-primary">
                หน้าหลักนักศึกษา
              </Link>
              <Link href="/requests" className="text-neutral hover:text-primary">
                ประวัติคำร้อง
              </Link>
            </>
          )}

          {identity ? (
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary-dark">
              {identity.userId} · {isAdmin ? 'เจ้าหน้าที่/อาจารย์' : 'นักศึกษา'}
            </span>
          ) : (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-danger">
              ไม่พบข้อมูลผู้ใช้
            </span>
          )}
        </nav>
      </div>
    </header>
  );
}