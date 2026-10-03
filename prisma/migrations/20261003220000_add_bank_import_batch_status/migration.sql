-- AlterTable
ALTER TABLE "BankImportBatch"
ADD COLUMN "sourceFormat" TEXT NOT NULL DEFAULT 'CSV',
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "cancelledAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "BankImportBatch_tenantId_status_importedAt_idx"
ON "BankImportBatch"("tenantId", "status", "importedAt");