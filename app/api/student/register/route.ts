import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { activityId, action } = body; // action: 'REGISTER' | 'CANCEL'
    const studentUsername = '6704101359'; // รหัสนักศึกษาปัจจุบัน

    if (!activityId) {
      return NextResponse.json({ success: false, error: 'Missing activityId' }, { status: 400 });
    }

    // 1. ค้นหาโปรไฟล์นักศึกษา
    let userProfile = await prisma.userProfile.findFirst({
      where: { studentCode: studentUsername },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          username: studentUsername,
          studentCode: studentUsername,
          fullName: 'นางสาวพัฒน์นรี วันพิลา',
          email: 'phatnaree@cmu.ac.th',
          major: 'วิทยาการคอมพิวเตอร์',
          faculty: 'วิทยาศาสตร์',
        },
      });
    }

    // 2. ค้นหากิจกรรม
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      return NextResponse.json({ success: false, error: 'Activity not found' }, { status: 404 });
    }

    if (action === 'REGISTER') {
      // 3. ตรวจสอบว่าเคยลงทะเบียนหรือยัง
      const existing = await prisma.participation.findFirst({
        where: { studentUsername, activityId },
      });

      if (!existing) {
        await prisma.participation.create({
          data: {
            id: `part-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            studentUsername,
            activityId,
          } as any,
        });
      }

      // 4. บันทึกชั่วโมงสะสมใน HourRequest ถ้ายังไม่มี
      const existingReq = await prisma.hourRequest.findFirst({
        where: { coreUserId: userProfile.id, title: activity.title },
      });

      if (!existingReq) {
        const isCoop = activity.activityType?.includes('สหกิจ');
        await prisma.hourRequest.create({
          data: {
            coreUserId: userProfile.id,
            studentId: userProfile.username,
            studentName: userProfile.fullName || userProfile.displayName || studentUsername,
            title: activity.title,
            dateStr: new Date(activity.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
            timeStr: `${activity.startTime ? new Date(activity.startTime).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '09:00'} - 16:00 น.`,
            type: 'กิจกรรมของหลักสูตร',
            typeCategory: isCoop ? 'COOP' : 'VOLUNTEER',
            hours: Number(activity.hours) || 1,
            status: 'APPROVED',
            statusText: 'อนุมัติแล้ว (กิจกรรมหลักสูตร)',
            approvedHours: Number(activity.hours) || 1,
            approvedCategory: isCoop ? 'COOP' : 'VOLUNTEER',
            note: `สถานที่: ${activity.location || 'มหาวิทยาลัยแม่โจ้'}`,
          },
        });
      }

    } else if (action === 'CANCEL') {
      // 5. ยกเลิกการลงทะเบียน
      await prisma.participation.deleteMany({
        where: { studentUsername, activityId },
      });

      // 6. ลบชั่วโมงออก
      await prisma.hourRequest.deleteMany({
        where: { coreUserId: userProfile.id, title: activity.title },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('=== API REGISTER ERROR ===', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}