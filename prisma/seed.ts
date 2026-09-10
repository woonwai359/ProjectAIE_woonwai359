import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.userProfile.upsert({
    where: { username: '6512345678' },
    update: {},
    create: {
      username: '6512345678',
      displayName: 'สมชาย ใจดี',
      major: 'วิทยาการคอมพิวเตอร์',
      yearLevel: 3,
      layer2Role: 'student',
    },
  });

  await prisma.userHourSummary.upsert({
    where: { username: student.username },
    update: {},
    create: { username: student.username, coopHours: 6, volunteerHours: 3, majorHours: 1.5 },
  });

  await prisma.activity.upsert({
    where: { id: 'seed-activity-1' },
    update: {},
    create: {
      id: 'seed-activity-1',
      title: 'ค่ายอาสาพัฒนาห้องสมุดโรงเรียน',
      description: 'กิจกรรมจิตอาสาปรับปรุงและจัดระเบียบห้องสมุดโรงเรียนบ้านแม่โจ้ ร่วมกับชุมนุมอาสา',
      location: 'โรงเรียนบ้านแม่โจ้ อ.สันทราย',
      startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      registrationDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      capacity: 3,
      lecturerInCharge: 'อาจารย์วิภาวี ศรีสุข',
      coopHours: 4,
      volunteerHours: 4,
      majorHours: 0,
      status: 'OPEN',
      createdByUsername: 'staff-somchai',
    },
  });

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
