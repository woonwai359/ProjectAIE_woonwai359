import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { HourRequestCategory, HourRequestStatus } from '@prisma/client';

// ฟังก์ชัน POST (บันทึกข้อมูล)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, categoryTarget, hours, proofUrl, description } = body;

    const studentCode = '6704101359';

    let userProfile = await prisma.userProfile.findFirst({
      where: { username: studentCode },
    });

    if (!userProfile) {
      userProfile = await prisma.userProfile.create({
        data: {
          username: studentCode,
          displayName: 'นางสาวพัฒน์นรี วันพิลา',
          major: 'วิทยาการคอมพิวเตอร์',
          layer2Role: 'student',
        },
      });
    }

    const categoryEnum: HourRequestCategory =
      categoryTarget === 'VOLUNTEER'
        ? HourRequestCategory.VOLUNTEER
        : categoryTarget === 'MAJOR'
        ? HourRequestCategory.MAJOR
        : HourRequestCategory.COOP;

    const newRequest = await prisma.hourRequest.create({
      data: {
        studentId: userProfile.username,
        studentName: userProfile.displayName || studentCode,
        title: title || 'ยื่นขอชั่วโมงกิจกรรม',
        category: categoryEnum,
        hours: Number(hours) || 1,
        proofUrl: proofUrl || null,
        description: description || null,
        status: HourRequestStatus.PENDING,
      },
    });

    return NextResponse.json({ success: true, data: newRequest });
  } catch (error: any) {
    console.error('API Hour Request Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ฟังก์ชัน GET (ดึงประวัติมาแสดง)
export async function GET() {
  try {
    const studentCode = '6704101359';

    const requests = await prisma.hourRequest.findMany({
      where: { studentId: studentCode },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error: any) {
    console.error('API Get Requests Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ฟังก์ชัน DELETE (ลบข้อมูล)
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