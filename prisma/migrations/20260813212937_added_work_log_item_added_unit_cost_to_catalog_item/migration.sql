-- CreateEnum
CREATE TYPE "WorkLogItemType" AS ENUM ('MATERIAL', 'EQUIPMENT', 'OTHER');

-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "unitCost" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "WorkLogItem" (
    "id" TEXT NOT NULL,
    "workLogId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,
    "unitCost" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "type" "WorkLogItemType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLogItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "WorkLogItem" ADD CONSTRAINT "WorkLogItem_workLogId_fkey" FOREIGN KEY ("workLogId") REFERENCES "WorkLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
