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

    let userProfile = await prisma.userProfile.findFirst({
      where: { studentCode },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          username: studentCode,
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
        coreUserId: userProfile.id,
        studentId: userProfile.username,
        studentName: userProfile.fullName || userProfile.displayName || studentCode,
        title,
        dateStr: dateStr || 'วันนี้',
        timeStr: timeStr || '09:00 - 16:00',
        type: typeDetail || 'กิจกรรมภายนอก',
        typeCategory: categoryTarget === 'VOLUNTEER' ? 'VOLUNTEER' : 'COOP',
        hours: Number(hours),
        status: 'PENDING_APPROVAL',
        statusText: 'รอตรวจสอบ',
        approvedHours: Number(hours),
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

// ฟังก์ชัน GET เพื่อให้หน้าเว็บดึงประวัติมาแสดงได้
export async function GET() {
  try {
    const studentCode = '6704101359';

    const userProfile = await prisma.userProfile.findFirst({
      where: { studentCode },
    });

    if (!userProfile) {
      return NextResponse.json({ success: true, data: [] });
    }

    const requests = await prisma.hourRequest.findMany({
      where: { coreUserId: userProfile.id },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('API Get Requests Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ฟังก์ชัน DELETE ลบคำร้อง
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