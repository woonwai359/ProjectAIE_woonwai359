import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, dateStr, timeStr, categoryTarget, typeDetail, hours, imageProof, note } = body;

    if (!title || !hours) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const studentCode = '6704101359';

    let userProfile = await prisma.userProfile.findUnique({
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

// เพิ่มฟังก์ชัน DELETE สำหรับลบคำร้องออกจากฐานข้อมูลถาวร
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
  } catch (error) {
    console.error('API Delete Request Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}