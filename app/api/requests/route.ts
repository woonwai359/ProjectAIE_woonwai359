import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ฟังก์ชัน POST (บันทึกข้อมูล - ที่เราทำไปแล้ว)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, dateStr, timeStr, categoryTarget, typeDetail, hours, imageProof, note } = body;

    const studentCode = '6704101359';

    let userProfile = await prisma.userProfile.findFirst({
      where: { studentCode },
    });

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

    const newRequest = await prisma.hourRequest.create({
      data: {
        id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: userProfile.id,
        title: title || 'ยื่นขอชั่วโมงกิจกรรม',
        dateStr: dateStr || 'วันนี้',
        timeStr: timeStr || '09:00 - 16:00',
        type: typeDetail || 'กิจกรรมภายนอก',
        typeCategory: categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
        hours: Number(hours) || 1,
        status: 'PENDING_APPROVAL',
        statusText: 'รอตรวจสอบ',
        approvedHours: Number(hours) || 1,
        approvedCategory: categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
        imageProof: imageProof || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error: any) {
    console.error('API Hour Request Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// **เพิ่มฟังก์ชัน GET ตรงนี้ เพื่อให้หน้าเว็บดึงประวัติมาแสดงได้**
export async function GET(request: Request) {
  try {
    const studentCode = '6704101359';

    const userProfile = await prisma.userProfile.findFirst({
      where: { studentCode },
    });

    if (!userProfile) {
      return NextResponse.json({ success: true, data: [] });
    }

    // ดึงรายการคำร้องทั้งหมดของนักศึกษาคนนี้จากฐานข้อมูล
    const requests = await prisma.hourRequest.findMany({
      where: { userId: userProfile.id },
      orderBy: { id: 'desc' }, // เรียงจากล่าสุดไปเก่าสุด
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('API Get Requests Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ฟังก์ชัน DELETE (ลบข้อมูล - อันเดิมที่มีอยู่แล้ว)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing request ID' }, { status: 400 });
    }

    await prisma.hourRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Deleted successfully' });
  } catch (error: any) {
    console.error('API Delete Request Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}