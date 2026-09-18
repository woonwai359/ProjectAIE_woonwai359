import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId } = body;

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'Missing activityId' }, { status: 400 });
    }

    // สมมติใช้ studentCode หรือ username ของนักศึกษาคนปัจจุบัน
    const studentUsername = '6704101359';

    // ตรวจสอบว่าเคยลงทะเบียนไปแล้วหรือยัง
    const existing = await prisma.participation.findUnique({
      where: {
        activityId_studentUsername: {
          activityId,
          studentUsername,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Already registered' }, { status: 400 });
    }

    // บันทึกการลงทะเบียนลงฐานข้อมูลจริง
    const participation = await prisma.participation.create({
      data: {
        id: `reg-${Date.now()}`,
        activityId,
        studentUsername,
      },
    });

    return NextResponse.json({ success: true, data: participation });
  } catch (error) {
    console.error('API Register Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}