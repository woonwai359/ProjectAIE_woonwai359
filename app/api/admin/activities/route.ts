import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, hours, dateStr, timeStr, location, capacity } = body;

    const activityDate = dateStr ? new Date(dateStr) : new Date();

    const newActivity = await prisma.activity.create({
      data: {
        title,
        description: description || '',
        activityType: category,
        hours: Number(hours) || 1,
        date: activityDate,
        location: location || 'คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
        capacity: Number(capacity) || 30,
        status: 'OPEN',
        // เพิ่มฟิลด์บังคับตามที่ Schema ของคุณต้องการ (ปรับค่าตามจริงได้เลยครับ)
        startTime: '09:00',
        endTime: '16:00',
        registrationOpen: new Date(),
        registrationClose: activityDate,
        createdByUsername: '6704101359', // หรือรหัสอาจารย์ผู้ใช้งานปัจจุบัน
      },
    });

    return NextResponse.json({ success: true, data: newActivity });
  } catch (error) {
    console.error('Create Activity API Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}