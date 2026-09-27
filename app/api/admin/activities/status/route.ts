import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ActivityStatus } from '@prisma/client';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing id or status' },
        { status: 400 }
      );
    }

    const updated = await prisma.activity.update({
      where: { id },
      data: {
        status: status as ActivityStatus,
      },
    });

    return NextResponse.json({ success: true, activity: updated });
  } catch (error: any) {
    console.error('Update activity status error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}