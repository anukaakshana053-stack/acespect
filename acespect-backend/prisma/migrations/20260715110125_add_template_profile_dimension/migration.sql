/*
  Warnings:

  - Added the required column `inspectionType` to the `inspection_templates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyType` to the `inspection_templates` table without a default value. This is not possible if the table is not empty.

*/
-- Clear the pilot's throwaway rows (pre-profile-dimension, pre-launch) so the
-- new NOT NULL columns below can be added without a default.
DELETE FROM "inspection_templates";

-- DropIndex
DROP INDEX "inspection_templates_sectionKey_status_idx";

-- AlterTable
ALTER TABLE "inspection_templates" ADD COLUMN     "inspectionType" TEXT NOT NULL,
ADD COLUMN     "propertyType" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "inspection_templates_inspectionType_propertyType_sectionKey_idx" ON "inspection_templates"("inspectionType", "propertyType", "sectionKey", "status");
