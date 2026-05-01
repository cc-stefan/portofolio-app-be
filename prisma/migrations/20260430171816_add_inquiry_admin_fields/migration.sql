-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('NEW', 'IN_REVIEW', 'RESOLVED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "InquiryStatus" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "inquiries_status_created_at_idx" ON "inquiries"("status", "created_at");
