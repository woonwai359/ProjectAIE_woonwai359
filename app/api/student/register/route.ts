import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId, action } = body; // action: 'REGISTER' หรือ 'CANCEL'

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'Missing activityId' }, { status: 400 });
    }

    const studentUsername = '6704101359';

    // ค้นหาโปรไฟล์นักศึกษา
    let userProfile = await prisma.userProfile.findFirst({
      where: { studentCode: studentUsername },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          studentCode: studentUsername,
          fullName: 'นางสาวพัฒน์นรี วันพิลา',
          email: 'phatnaree@cmu.ac.th',
          major: 'วิทยาการคอมพิวเตอร์',
          faculty: 'วิทยาศาสตร์',
        },
      });
    }

    if (action === 'CANCEL') {
      // กรณียกเลิกการลงทะเบียน
      await prisma.participation.deleteMany({
        where: { activityId, studentUsername },
      });
      // ลบคำร้องที่ผูกกับกิจกรรมนี้ออกด้วยเพื่อให้ชั่วโมงถูกดึงกลับ
      await prisma.hourRequest.deleteMany({
        where: { userId: userProfile.id, note: { contains: activityId } },
      });
      return NextResponse.json({ success: true, message: 'Cancelled successfully' });
    }

    // กรณีลงทะเบียนปกติ
    const existing = await prisma.participation.findUnique({
      where: {
        activityId_studentUsername: { activityId, studentUsername },
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Already registered' }, { status: 400 });
    }

    const participation = await prisma.participation.create({
      data: {
        id: `reg-${Date.now()}`,
        activityId,
        studentUsername,
      },
    });

    // ดึงข้อมูลกิจกรรมเพื่อสร้าง HourRequest รอการอนุมัติจากอาจารย์
    const activityInfo = await prisma.activity.findUnique({ where: { id: activityId } });
    if (activityInfo) {
      const isCoop = activityInfo.activityType.includes('สหกิจ');
      await prisma.hourRequest.create({
        data: {
          userId: userProfile.id,
          title: activityInfo.title,
          dateStr: new Date(activityInfo.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
          timeStr: '09:00 - 16:00',
          type: 'กิจกรรมของหลักสูตร',
          typeCategory: isCoop ? 'COOP' : 'VOLUNTEER',
          hours: activityInfo.hours,
          status: 'PENDING_APPROVAL',
          statusText: 'ลงทะเบียนแล้ว (รอเช็คชื่อ)',
          note: `กิจกรรมหลักสูตร [ID: ${activityId}] สถานที่: ${activityInfo.location}`,
        },
      });
    }

    return NextResponse.json({ success: true, data: participation });
  } catch (error) {
    console.error('API Register Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}