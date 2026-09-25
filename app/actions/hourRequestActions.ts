'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { HourRequestCategory, HourRequestStatus } from '@prisma/client';

// 1. ดึงรายการคำร้องทั้งหมดของนักศึกษา
export async function getStudentRequests(userId: string) {
  try {
    return await prisma.hourRequest.findMany({
      where: { studentId: userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
}

// 2. นักศึกษายื่นคำร้องขอชั่วโมงใหม่
export async function createHourRequest(data: {
  userId: string;
  studentName?: string;
  title: string;
  category?: HourRequestCategory;
  hours: number;
  proofUrl?: string;
  description?: string;
}) {
  try {
    const newReq = await prisma.hourRequest.create({
      data: {
        studentId: data.userId,
        studentName: data.studentName || data.userId,
        title: data.title,
        category: data.category || HourRequestCategory.COOP,
        hours: data.hours,
        proofUrl: data.proofUrl,
        description: data.description,
        status: HourRequestStatus.PENDING,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin/requests');
    return { success: true, data: newReq };
  } catch (error) {
    console.error('Error creating request:', error);
    return { success: false, error: 'ไม่สามารถบันทึกข้อมูลลงฐานข้อมูลได้' };
  }
}

// 3. อาจารย์ตรวจสอบ อนุมัติ / ไม่อนุมัติ
export async function reviewHourRequest(
  requestId: string,
  status: 'APPROVED' | 'REJECTED',
  reviewedBy?: string,
  rejectReason?: string
) {
  try {
    const updated = await prisma.hourRequest.update({
      where: { id: requestId },
      data: {
        status: status === 'APPROVED' ? HourRequestStatus.APPROVED : HourRequestStatus.REJECTED,
        rejectionReason: status === 'REJECTED' ? rejectReason : null,
        reviewedBy: reviewedBy || 'admin',
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin/requests');
    return { success: true, data: updated };
  } catch (error) {
    console.error('Error reviewing request:', error);
    return { success: false, error: 'ไม่สามารถอัปเดตสถานะในฐานข้อมูลได้' };
  }
}