'use server';

import { prisma } from '@/lib/prisma'; // ปรับ path ตามโปรเจกต์ของคุณ
import { revalidatePath } from 'next/cache';

// 1. ดึงรายการคำร้องทั้งหมดของนักศึกษา
export async function getStudentRequests(userId: string) {
  try {
    return await prisma.hourRequest.findMany({
      where: { userId },
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
  title: string;
  dateStr: string;
  type: string;
  hours: number;
  approvedCategory?: string;
  imageProof?: string;
  note?: string;
}) {
  try {
    const newReq = await prisma.hourRequest.create({
      data: {
        userId: data.userId,
        title: data.title,
        dateStr: data.dateStr,
        type: data.type,
        hours: data.hours,
        approvedCategory: data.approvedCategory || 'COOP',
        imageProof: data.imageProof,
        note: data.note,
        status: 'PENDING_APPROVAL',
        statusText: 'รอตรวจสอบ',
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
  approvedHours: number,
  approvedCategory: string,
  rejectReason?: string
) {
  try {
    const updated = await prisma.hourRequest.update({
      where: { id: requestId },
      data: {
        status: status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
        statusText: status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ',
        approvedHours,
        approvedCategory,
        rejectReason: status === 'REJECTED' ? rejectReason : null,
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