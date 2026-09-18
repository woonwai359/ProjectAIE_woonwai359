import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, dateStr, timeStr, categoryTarget, typeDetail, hours, imageProof, note } = body;

    if (!title || !hours) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    // สมมติรหัสประจำตัวนักศึกษาปัจจุบัน (หรือดึงจาก Session/JWT ในระบบของคุณ)
    const studentCode = '6704101359';

    // ค้นหา ID ของนักศึกษาจาก UserProfile
    let userProfile = await prisma.userProfile.findUnique({
      where: { studentCode },
    });

    // หากยังไม่มีโปรไฟล์ในระบบ ให้สร้างให้อัตโนมัติ
    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          studentCode,
          fullName: 'นางสาวพัฒน์นรี วันพิลา',
          email: 'phatnaree@cmu.ac.th',
          major: 'วิทยาการคอมพิวเตอร์',
          faculty: 'วิทยาศาสตร์',
        },
      });
    }

    // บันทึกคำร้องขอชั่วโมงลงตาราง HourRequest ใน PostgreSQL
    const newRequest = await prisma.hourRequest.create({
      data: {
        userId: userProfile.id,
        title,
        dateStr: dateStr || 'วันนี้',
        timeStr: timeStr || '09:00 - 16:00',
        type: typeDetail || 'กิจกรรมภายนอก',
        typeCategory: categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
        hours: Number(hours),
        status: 'PENDING_APPROVAL',
        statusText: 'รอตรวจสอบ',
        imageProof: imageProof || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error) {
    console.error('API Hour Request Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}