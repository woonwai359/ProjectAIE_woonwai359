'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavBar({
  userId,
  isAdmin,
}: {
  userId?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const isTeacherPage = isAdmin || pathname.startsWith('/admin');

  const displayName = isTeacherPage
    ? 'ผศ.ดร.กมลวรรณ ศรีวิไล'
    : (userId || 'นางสาวภัคศิรินทร์ จันทร์ดี');

  const roleText = isTeacherPage ? 'อาจารย์' : 'นักศึกษา';
  const badgeLetter = isTeacherPage ? 'T' : 'S';

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* โลโก้ CSMJU2030 */}
        <Link
          href={isTeacherPage ? '/admin/requests' : '/dashboard'}
          className="flex items-center gap-3.5"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white font-bold text-lg shadow-sm shadow-blue-500/20">
            CS
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-tight">CSMJU2030</p>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">Co-op Hours System</p>
          </div>
        </Link>

        {/* แถบเมนูตรงกลาง (เอารายงานออกทั้งหมด) */}
        <nav className="flex items-center gap-8 text-base font-semibold">
          {isTeacherPage ? (
            <>
              <Link
                href="/admin/requests"
                className={`flex items-center gap-2 py-2 transition ${
                  pathname.startsWith('/admin/requests')
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <span>📋</span> หน้าหลักคำขอ
              </Link>
              <Link
                href="/admin/activities"
                className={`flex items-center gap-2 py-2 transition ${
                  pathname.startsWith('/admin/activities')
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <span>👥</span> กิจกรรมทั้งหมด
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 py-2 transition ${
                  pathname === '/dashboard'
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <span>🏠</span> หน้าหลัก
              </Link>
              <Link
                href="/requests"
                className={`flex items-center gap-2 py-2 transition ${
                  pathname.startsWith('/requests')
                    ? 'text-blue-600 border-b-2 border-blue-600 font-bold'
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                <span>📝</span> กิจกรรมที่ยื่น
              </Link>
            </>
          )}
        </nav>

        {/* ข้อมูลโปรไฟล์ */}
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{displayName}</p>
            <p className="text-xs text-slate-500 font-medium">{roleText}</p>
          </div>
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-full font-bold text-sm ${
              isTeacherPage
                ? 'bg-amber-100 text-amber-800 border-2 border-amber-200'
                : 'bg-blue-100 text-blue-700 border-2 border-blue-200'
            }`}
          >
            {badgeLetter}
          </div>
        </div>
      </div>
    </header>
  );
}

export default NavBar;