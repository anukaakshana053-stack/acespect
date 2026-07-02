-- CreateEnum
CREATE TYPE "InspectionStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SectionStatus" AS ENUM ('COMPLETE', 'PARTIAL', 'PENDING');

-- CreateEnum
CREATE TYPE "SectionReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REVISION_REQUESTED');

-- AlterTable
ALTER TABLE "inspections" ADD COLUMN     "address" TEXT,
ADD COLUMN     "client" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "jobNo" TEXT,
ADD COLUMN     "notes" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "overallProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reviewerId" TEXT,
ADD COLUMN     "suburb" TEXT,
ALTER COLUMN "inspectionType" SET DEFAULT 'Dilapidation',
ALTER COLUMN "propertyType" SET DEFAULT 'Residential House',
DROP COLUMN "status",
ADD COLUMN     "status" "InspectionStatus" NOT NULL DEFAULT 'DRAFT',
ALTER COLUMN "payload" DROP NOT NULL,
ALTER COLUMN "submittedAt" DROP NOT NULL,
ALTER COLUMN "submittedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "sections" (
    "id" TEXT NOT NULL,
    "inspectionId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" "SectionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewStatus" "SectionReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewComment" TEXT NOT NULL DEFAULT '',
    "reportText" TEXT NOT NULL DEFAULT '',
    "fields" JSONB NOT NULL DEFAULT '{}',
    "photos" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "damages" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "direction" TEXT NOT NULL DEFAULT '',
    "widthMm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lengthMm" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT NOT NULL DEFAULT '',
    "photos" JSONB NOT NULL DEFAULT '[]',
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "damages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sections_inspectionId_idx" ON "sections"("inspectionId");

-- CreateIndex
CREATE INDEX "damages_sectionId_idx" ON "damages"("sectionId");

-- CreateIndex
CREATE INDEX "inspections_reviewerId_idx" ON "inspections"("reviewerId");

-- AddForeignKey
ALTER TABLE "inspections" ADD CONSTRAINT "inspections_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_inspectionId_fkey" FOREIGN KEY ("inspectionId") REFERENCES "inspections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "damages" ADD CONSTRAINT "damages_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

