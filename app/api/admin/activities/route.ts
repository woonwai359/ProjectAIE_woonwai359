import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, hours, dateStr, timeStr, location, capacity } = body;

    // แปลงวันที่จัดกิจกรรมให้เป็น Date Object
    let activityDate = new Date();
    if (dateStr && dateStr.includes('-') && dateStr.length === 10) {
      activityDate = new Date(dateStr);
    }
    if (isNaN(activityDate.getTime())) {
      activityDate = new Date();
    }

    // แยกช่วงเวลาและแปลงให้เป็น DateTime ของ Prisma (ใช้วันที่เดียวกันแต่เปลี่ยนชั่วโมง/นาที)
    let startDateTime = new Date(activityDate);
    let endDateTime = new Date(activityDate);

    if (timeStr && timeStr.includes('-')) {
      const parts = timeStr.split('-');
      const startParts = parts[0].trim().replace(' น.', '').split(':');
      const endParts = parts[1].trim().replace(' น.', '').split(':');

      if (startParts.length === 2) {
        startDateTime.setHours(parseInt(startParts[0], 10), parseInt(startParts[1], 10), 0, 0);
      }
      if (endParts.length === 2) {
        endDateTime.setHours(parseInt(endParts[0], 10), parseInt(endParts[1], 10), 0, 0);
      }
    }

    // บันทึกลงฐานข้อมูลผ่าน Prisma
    const newActivity = await prisma.activity.create({
      data: {
        title: title || 'ไม่มีชื่อกิจกรรม',
        description: description || '',
        activityType: category || 'ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)',
        hours: Number(hours) || 1,
        date: activityDate,
        startTime: startDateTime, // ส่งเป็น DateTime ตามที่ schema บังคับ
        endTime: endDateTime,     // ส่งเป็น DateTime ตามที่ schema บังคับ
        location: location || 'คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
        capacity: Number(capacity) || 30,
        status: 'OPEN',
        registrationOpen: new Date(),
        registrationClose: activityDate,
        createdByUsername: '6704101359',
      },
    });

    return NextResponse.json({ success: true, data: newActivity });
  } catch (error: any) {
    console.error('=== CREATE ACTIVITY API ERROR ===', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: { date: 'desc' },
    });
    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error('Get Activities API Error:', error);
    return NextResponse.json({ success: false, activities: [] }, { status: 500 });
  }
}