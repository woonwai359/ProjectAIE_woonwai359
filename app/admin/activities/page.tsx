'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export interface PublishedActivity {
  id: string;
  title: string;
  category: string;
  dateStr: string;
  timeStr?: string;
  location: string;
  hours: number;
  capacity: number;
  registeredCount?: number;
  status: 'OPEN' | 'CLOSED';
}

const DEFAULT_PUBLISHED: PublishedActivity[] = [
  {
    id: 'seed-activity-1',
    title: 'ค่ายอาสาพัฒนาห้องสมุดโรงเรียน (CSMJU)',
    category: 'ชั่วโมงจิตอาสา',
    dateStr: '25 ก.ย. 2569',
    location: 'โรงเรียนบ้านแม่โจ้ อ.สันทราย',
    hours: 4,
    capacity: 30,
    registeredCount: 12,
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
    registeredCount: 35,
    status: 'OPEN',
  },
];

export default function AdminActivitiesPage() {
  const [publishedList, setPublishedList] = useState<PublishedActivity[]>([]);

  const loadActivities = () => {
    const saved = localStorage.getItem('csmju_published_activities');
    if (saved) {
      try {
        setPublishedList(JSON.parse(saved));
      } catch (e) {
        setPublishedList(DEFAULT_PUBLISHED);
      }
    } else {
      setPublishedList(DEFAULT_PUBLISHED);
      localStorage.setItem('csmju_published_activities', JSON.stringify(DEFAULT_PUBLISHED));
    }
  };

  useEffect(() => {
    loadActivities();
    window.addEventListener('csmju_activity_updated', loadActivities);
    return () => window.removeEventListener('csmju_activity_updated', loadActivities);
  }, []);

  const handleToggleStatus = (id: string) => {
    const updated = publishedList.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          status: (item.status === 'OPEN' ? 'CLOSED' : 'OPEN') as 'OPEN' | 'CLOSED',
        };
      }
      return item;
    });
    setPublishedList(updated);
    localStorage.setItem('csmju_published_activities', JSON.stringify(updated));
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">การจัดการกิจกรรมของหลักสูตร</h1>
          <p className="text-xs text-slate-500 mt-1">
            รายการกิจกรรมทั้งหมดที่เปิดให้นักศึกษาลงทะเบียน พร้อมระบบพิมพ์ใบเซ็นชื่อ
          </p>
        </div>
        <Link
          href="/admin/activities/new"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-2xl text-xs font-bold shadow-md transition cursor-pointer"
        >
          + ประกาศกิจกรรมใหม่
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-bold">ชื่องานกิจกรรม</th>
                <th className="p-4 font-bold">หมวดหมู่</th>
                <th className="p-4 font-bold">ชั่วโมง</th>
                <th className="p-4 font-bold">วันที่ / สถานที่</th>
                <th className="p-4 font-bold">สถานะรับสมัคร</th>
                <th className="p-4 font-bold text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {publishedList.map((act) => {
                const isOpen = act.status === 'OPEN';
                return (
                  <tr key={act.id} className="hover:bg-slate-50/50 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-800 leading-snug">{act.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">รหัสอ้างอิง: {act.id}</p>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {act.category}
                      </span>
                    </td>
                    <td className="p-4 font-extrabold text-blue-600">{act.hours} ชม.</td>
                    <td className="p-4 text-slate-600">
                      <p className="font-bold">{act.dateStr}</p>
                      <p className="text-[11px] text-slate-400">{act.location}</p>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                          isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                        {isOpen ? 'กำลังเปิดรับ' : 'ปิดรับแล้ว'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/admin/activities/${act.id}/print`}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-bold transition shadow-xs inline-flex items-center gap-1.5"
                        >
                          🖨️ พิมพ์ใบเซ็นชื่อ
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(act.id)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                            isOpen
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOpen ? 'ปิดรับ' : 'เปิดรับ'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {publishedList.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    ยังไม่มีกิจกรรมที่ประกาศในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}