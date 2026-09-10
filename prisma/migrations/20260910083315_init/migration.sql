-- CreateEnum
CREATE TYPE "HourRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HourRequestCategory" AS ENUM ('COOP', 'VOLUNTEER', 'MAJOR');

-- CreateTable
CREATE TABLE "HourRequest" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "HourRequestCategory" NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "proofUrl" TEXT,
    "description" TEXT,
    "status" "HourRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HourRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HourRequest_studentId_idx" ON "HourRequest"("studentId");

-- CreateIndex
CREATE INDEX "HourRequest_status_idx" ON "HourRequest"("status");
