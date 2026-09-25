import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const studentUsername = '6704101359';

    const studentProfile = await prisma.userProfile.findFirst({
      where: { studentCode: studentUsername },
      include: { hourRequests: true },
    });

    // ดึงประวัติการลงทะเบียนจริงจากตาราง Participation ของนักศึกษา
    const participations = await prisma.participation.findMany({
      where: { studentUsername },
    });
    const registeredIds = participations.map((p) => p.activityId);

    // ดึงรายการกิจกรรมทั้งหมดที่เปิดรับ
    const activitiesFromDb = await prisma.activity.findMany({
      where: { status: { in: ['OPEN', 'PUBLISHED'] } },
      orderBy: { date: 'desc' },
    });

    // ดึงข้อมูลการลงทะเบียนทั้งหมดในระบบ เพื่อเอามานับจำนวนผู้สมัครแต่ละกิจกรรม
    const allParticipations = await prisma.participation.findMany();
    const countMap = new Map<string, number>();
    allParticipations.forEach((p: any) => {
      const count = countMap.get(p.activityId) || 0;
      countMap.set(p.activityId, count + 1);
    });

    const formattedActivities = (studentProfile?.hourRequests || []).map((req) => ({
      id: req.id,
      dateStr: req.dateStr,
      timeStr: req.timeStr || '09:00 - 16:00',
      title: req.title,
      categoryTarget: req.typeCategory === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
      typeDetail: req.type,
      status: req.status,
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
      registeredCount: countMap.get(act.id) || 0,
      status: act.status === 'OPEN' || act.status === 'PUBLISHED' ? 'OPEN' : 'CLOSED',
    }));

    return NextResponse.json({
      success: true,
      activities: formattedActivities,
      publishedList: formattedPublishedList,
      registeredIds,
    });
  } catch (error) {
    console.error('API Dashboard Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}