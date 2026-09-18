'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Activity {
  id: string;
  title: string;
  category: string;
  dateStr: string;
  location: string;
  hours: number;
  capacity: number;
  status: 'OPEN' | 'CLOSED';
}

const DEFAULT_ADMIN_ACTIVITIES: Activity[] = [
  {
    id: 'seed-activity-1',
    title: 'ค่ายอาสาพัฒนาห้องสมุดโรงเรียน (CSMJU)',
    category: 'ชั่วโมงจิตอาสา',
    dateStr: '25 ก.ย. 2569',
    location: 'โรงเรียนบ้านแม่โจ้ อ.สันทราย',
    hours: 4,
    capacity: 30,
    status: 'OPEN',
  },
  {
    id: 'act-2',
    title: 'อบรมเชิงปฏิบัติการ Docker & Cloud Deployment',
    category: 'ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)',
    dateStr: '30 ก.ย. 2569',
    location: 'ห้องปฏิบัติการคอมพิวเตอร์ 2',
    hours: 6,
    capacity: 40,
    status: 'OPEN',
  },
];

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('csmju_published_activities');
    if (saved) {
      try {
        setActivities(JSON.parse(saved));
      } catch (e) {
        setActivities(DEFAULT_ADMIN_ACTIVITIES);
      }
    } else {
      setActivities(DEFAULT_ADMIN_ACTIVITIES);
      localStorage.setItem('csmju_published_activities', JSON.stringify(DEFAULT_ADMIN_ACTIVITIES));
    }
  }, []);

  const toggleStatus = (id: string) => {
    const updated = activities.map((act) => {
      if (act.id === id) {
        const nextStatus: 'OPEN' | 'CLOSED' = act.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        return { ...act, status: nextStatus };
      }
      return act;
    });

    setActivities(updated);
    localStorage.setItem('csmju_published_activities', JSON.stringify(updated));
    window.dispatchEvent(new Event('csmju_activity_updated'));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* ส่วนหัวหน้า */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">การจัดการกิจกรรมของหลักสูตร</h1>
          <p className="text-xs text-slate-500 mt-1">
            รายการกิจกรรมทั้งหมดที่เปิดให้นักศึกษาลงทะเบียน พร้อมระบบพิมพ์ใบเซ็นชื่อ
          </p>
        </div>
        <Link
          href="/admin/activities/new"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>+ ประกาศกิจกรรมใหม่</span>
        </Link>
      </div>

      {/* ตารางกิจกรรม */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
              <th className="py-3.5 px-4">ชื่องานกิจกรรม</th>
              <th className="py-3.5 px-4">หมวดหมู่</th>
              <th className="py-3.5 px-4 text-center">ชั่วโมง</th>
              <th className="py-3.5 px-4">วันที่ / สถานที่</th>
              <th className="py-3.5 px-4 text-center">สถานะรับสมัคร</th>
              <th className="py-3.5 px-4 text-center">การจัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activities.map((act) => (
              <tr key={act.id} className="hover:bg-slate-50/80 transition">
                <td className="py-4 px-4">
                  <p className="font-bold text-slate-800 text-sm">{act.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">รหัสอ้างอิง: {act.id}</p>
                </td>
                <td className="py-4 px-4 text-slate-600">
                  <span className={`inline-block px-2.5 py-1 rounded-lg font-semibold ${
                    act.category.includes('จิตอาสา')
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {act.category}
                  </span>
                </td>
                <td className="py-4 px-4 text-center font-bold text-blue-700">{act.hours} ชม.</td>
                <td className="py-4 px-4 text-slate-500">
                  <p className="font-medium text-slate-700">{act.dateStr}</p>
                  <p className="text-[11px]">{act.location}</p>
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    type="button"
                    onClick={() => toggleStatus(act.id)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition border cursor-pointer ${
                      act.status === 'OPEN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    }`}
                  >
                    {act.status === 'OPEN' ? '🟢 กำลังเปิดรับ' : '🔴 ปิดรับสมัครแล้ว'}
                  </button>
                </td>
                <td className="py-4 px-4 text-center whitespace-nowrap">
                  <div className="inline-flex items-center gap-2">
                    {/* ปุ่มพิมพ์ใบเซ็นชื่อ */}
                    <Link
                      href={`/admin/activities/${act.id}/print`}
                      target="_blank"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <span>🖨️</span> พิมพ์ใบเซ็นชื่อ
                    </Link>

                    {/* ปุ่มเช็คชื่อเข้าร่วม */}
                    <Link
                      href={`/admin/activities/${act.id}/attendance`}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white active:scale-95 text-blue-700 rounded-xl text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>📋</span> เช็คชื่อ
                    </Link>

                    {/* ปุ่มสลับเปิด/ปิด */}
                    <button
                      type="button"
                      onClick={() => toggleStatus(act.id)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition cursor-pointer"
                    >
                      {act.status === 'OPEN' ? 'ปิดรับ' : 'เปิดรับ'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {activities.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  ยังไม่มีกิจกรรมที่ประกาศ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}