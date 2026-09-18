import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // ค้นหาจากรหัสนักศึกษา หรือดึงจากโปรไฟล์แรกในระบบชั่วคราวเพื่อให้แสดงผลได้ทันที
    const studentProfile = await prisma.userProfile.findFirst({
      include: { HourRequest: true },
    });

    if (!studentProfile) {
      return NextResponse.json({ success: true, activities: [], publishedList: [], registeredIds: [] });
    }

    // ดึงรายการกิจกรรมที่เปิดรับสมัคร
    const activitiesFromDb = await prisma.activity.findMany({
      where: { status: { in: ['OPEN', 'PUBLISHED'] } },
      orderBy: { date: 'desc' },
    });

    // แปลงข้อมูลคำร้องและส่งค่า approvedHours / status กลับไป
    const formattedActivities = (studentProfile.HourRequest || []).map((req) => ({
      id: req.id,
      dateStr: req.dateStr,
      timeStr: req.timeStr || '09:00 - 16:00',
      title: req.title,
      categoryTarget: req.typeCategory === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
      typeDetail: req.type,
      status: req.status, // ต้องเป็น "APPROVED" ถึงจะนำไปบวกชั่วโมง
      statusText: req.statusText || (req.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'รอตรวจสอบ'),
      hours: req.hours,
      approvedHours: req.approvedHours ?? req.hours,
      approvedCategory: req.approvedCategory as 'COOP' | 'VOLUNTEER' | undefined,
      typeCategory: req.typeCategory,
      reason: req.rejectReason || undefined,
      imageProof: req.imageProof || undefined,
      note: req.note || undefined,
    }));

    const formattedPublishedList = activitiesFromDb.map((act) => ({
      id: act.id,
      title: act.title,
      category: act.activityType,
      dateStr: new Date(act.date).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' }),
      timeStr: '09:00 - 16:00',
      location: act.location || 'คณะวิทยาศาสตร์ มหาวิทยาลัยแม่โจ้',
      hours: act.hours,
      capacity: act.capacity,
      registeredCount: 0,
      status: act.status === 'OPEN' || act.status === 'PUBLISHED' ? 'OPEN' : 'CLOSED',
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities,
      publishedList: formattedPublishedList,
      registeredIds: [],
    });
  } catch (error) {
    console.error('API Dashboard Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}