/*
  Warnings:

  - You are about to drop the column `unit` on the `CatalogItem` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDuration` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `WorkOrderItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,reference]` on the table `CatalogItem` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,reference]` on the table `WorkOrder` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[workOrderId,position]` on the table `WorkOrderItem` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `unitCode` to the `CatalogItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `WorkOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCode` to the `WorkOrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CatalogItem" DROP CONSTRAINT "CatalogItem_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_customerId_fkey";

-- DropIndex
DROP INDEX "WorkOrder_reference_key";

-- DropIndex
DROP INDEX "WorkOrder_tenantId_idx";

-- AlterTable
ALTER TABLE "CatalogItem" DROP COLUMN "unit",
ADD COLUMN     "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
ADD COLUMN     "baseQuantityUnitCode" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "unitCode" TEXT NOT NULL,
ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "vatCategory" "VatCategory" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "defaultQuantity" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "vatRate" DROP NOT NULL,
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(19,6);

-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "endDate",
DROP COLUMN "estimatedDuration",
DROP COLUMN "notes",
DROP COLUMN "startDate",
ADD COLUMN     "addressCity" TEXT,
ADD COLUMN     "addressCountryCode" TEXT,
ADD COLUMN     "addressPostalCode" TEXT,
ADD COLUMN     "addressStreet1" TEXT,
ADD COLUMN     "addressStreet2" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "plannedDurationMinutes" INTEGER,
ADD COLUMN     "plannedEndDate" TIMESTAMP(3),
ADD COLUMN     "plannedStartDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkOrderItem" DROP COLUMN "unit",
ADD COLUMN     "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
ADD COLUMN     "baseQuantityUnitCode" TEXT,
ADD COLUMN     "sellerItemIdentifier" TEXT,
ADD COLUMN     "subtotal" DECIMAL(19,2) NOT NULL,
ADD COLUMN     "unitCode" TEXT NOT NULL,
ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "vatCategory" "VatCategory" NOT NULL DEFAULT 'STANDARD',
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "vatRate" DROP NOT NULL,
ALTER COLUMN "vatRate" SET DATA TYPE DECIMAL(5,2),
ALTER COLUMN "unitCost" SET DATA TYPE DECIMAL(19,6);

-- CreateIndex
CREATE INDEX "CatalogItem_tenantId_isActive_idx" ON "CatalogItem"("tenantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CatalogItem_tenantId_reference_key" ON "CatalogItem"("tenantId", "reference");

-- CreateIndex
CREATE INDEX "WorkOrder_tenantId_status_idx" ON "WorkOrder"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WorkOrder_projectId_idx" ON "WorkOrder"("projectId");

-- CreateIndex
CREATE INDEX "WorkOrder_plannedStartDate_idx" ON "WorkOrder"("plannedStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_tenantId_reference_key" ON "WorkOrder"("tenantId", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderItem_workOrderId_position_key" ON "WorkOrderItem"("workOrderId", "position");

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
