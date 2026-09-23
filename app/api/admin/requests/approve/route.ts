import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId, status } = body; // status ควรเป็น 'APPROVED' หรือ 'REJECTED'

    // อัปเดตสถานะในตาราง HourRequest
    const updatedRequest = await prisma.hourRequest.update({
      where: { id: requestId },
      data: { status: status },
    });

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error) {
    console.error('Approve Request Error:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}