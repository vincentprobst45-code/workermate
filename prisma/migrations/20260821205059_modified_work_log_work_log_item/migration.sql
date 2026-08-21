/*
  Warnings:

  - You are about to drop the column `unit` on the `WorkLogItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workLogId,position]` on the table `WorkLogItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `position` to the `WorkLogItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCode` to the `WorkLogItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `WorkLogItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `WorkLogItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "WorkLog" ADD COLUMN     "calendarEventId" TEXT,
ADD COLUMN     "createdById" TEXT,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "WorkLogItem" DROP COLUMN "unit",
ADD COLUMN     "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
ADD COLUMN     "baseQuantityUnitCode" TEXT,
ADD COLUMN     "position" INTEGER NOT NULL,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "unitCode" TEXT NOT NULL,
ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workOrderItemId" TEXT,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "totalCost" SET DATA TYPE DECIMAL(19,2),
DROP COLUMN "type",
ADD COLUMN     "type" "LineItemType" NOT NULL;

-- DropEnum
DROP TYPE "WorkLogItemType";

-- CreateIndex
CREATE INDEX "WorkLogItem_workLogId_idx" ON "WorkLogItem"("workLogId");

-- CreateIndex
CREATE INDEX "WorkLogItem_workOrderItemId_idx" ON "WorkLogItem"("workOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkLogItem_workLogId_position_key" ON "WorkLogItem"("workLogId", "position");

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLog" ADD CONSTRAINT "WorkLog_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLogItem" ADD CONSTRAINT "WorkLogItem_workOrderItemId_fkey" FOREIGN KEY ("workOrderItemId") REFERENCES "WorkOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
