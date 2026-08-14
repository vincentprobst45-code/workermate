-- AlterTable
ALTER TABLE "CatalogItem" ADD COLUMN     "purchaseVatRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "WorkLogItem" ADD COLUMN     "purchaseVatRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "WorkOrderItem" ADD COLUMN     "purchaseVatRate" DECIMAL(5,2);
