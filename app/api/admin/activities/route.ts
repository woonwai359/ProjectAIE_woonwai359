import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, category, hours, dateStr, timeStr, location, capacity } = body;

    let activityDate = new Date();
    if (dateStr && dateStr.includes('-') && dateStr.length === 10) {
      activityDate = new Date(dateStr);
    }
    if (isNaN(activityDate.getTime())) {
      activityDate = new Date();
    }

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

    const newActivity = await prisma.activity.create({
      data: {
        title: title || 'ไม่มีชื่อกิจกรรม',
        description: description || '',
        activityType: category || 'ชั่วโมงวิชาชีพ / สหกิจศึกษา (สาขา)',
        hours: Number(hours) || 1,
        date: activityDate,
        startTime: startDateTime,
        endTime: endDateTime,
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

// เพิ่มฟังก์ชัน DELETE เพื่อให้ลบกิจกรรมแล้วเคลียร์ข้อมูลลูกไม่ให้ติด Error ฐานข้อมูล
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing activity ID' }, { status: 400 });
    }

    const activity = await prisma.activity.findUnique({
      where: { id },
    });

    if (activity) {
      // 1. เคลียร์ข้อมูลการลงทะเบียนใน Participation ออกก่อน
      await prisma.participation.deleteMany({
        where: { activityId: id },
      });

      // 2. เคลียร์ชั่วโมงสะสมใน HourRequest ของกิจกรรมนี้ออก
      await prisma.hourRequest.deleteMany({
        where: { title: activity.title },
      });
    }

    // 3. ลบตัวกิจกรรมหลักสำเร็จ
    await prisma.activity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Activity deleted successfully' });
  } catch (error: any) {
    console.error('=== DELETE ACTIVITY API ERROR ===', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}