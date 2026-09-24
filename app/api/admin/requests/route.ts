import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const requests = await prisma.hourRequest.findMany({
      include: {
        UserProfile: true, // ใช้ U ใหญ่ตาม schema.prisma
      },
      orderBy: { createdAt: 'desc' },
    });

    // ต้องใช้ key เป็น requests เพื่อให้ตรงกับหน้าเว็บของอาจารย์
    return NextResponse.json({ success: true, requests });
  } catch (error: any) {
    console.error('Admin Get Requests Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, status, approvedHours, approvedCategory, rejectReason } = body;

    const updatedRequest = await prisma.hourRequest.update({
      where: { id: requestId },
      data: {
        status: status,
        statusText: status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ',
        approvedHours: approvedHours !== undefined ? Number(approvedHours) : undefined,
        approvedCategory: approvedCategory || undefined,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
      },
    });

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error: any) {
    console.error('Admin Approve Request Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}