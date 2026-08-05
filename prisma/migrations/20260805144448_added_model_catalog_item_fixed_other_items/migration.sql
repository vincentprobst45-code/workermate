/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ProjectItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ProjectItem` table. All the data in the column will be lost.
  - Added the required column `type` to the `InvoiceItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "type" "ProjectItemType" NOT NULL;

-- AlterTable
ALTER TABLE "ProjectItem" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "QuoteItem" ADD COLUMN     "type" "ProjectItemType" NOT NULL;

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ProjectItemType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "defaultQuantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CatalogItem_tenantId_idx" ON "CatalogItem"("tenantId");

-- AddForeignKey
ALTER TABLE "CatalogItem" ADD CONSTRAINT "CatalogItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
