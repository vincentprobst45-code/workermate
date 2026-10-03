-- CreateTable
CREATE TABLE "BankImportBatch" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentAccountId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "rowCount" INTEGER NOT NULL,
    "importedCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankImportBatch_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "BankTransaction" ADD COLUMN "importBatchId" TEXT;

-- CreateIndex
CREATE INDEX "BankImportBatch_tenantId_importedAt_idx" ON "BankImportBatch"("tenantId", "importedAt");
CREATE INDEX "BankImportBatch_paymentAccountId_importedAt_idx" ON "BankImportBatch"("paymentAccountId", "importedAt");

-- AddForeignKey
ALTER TABLE "BankImportBatch" ADD CONSTRAINT "BankImportBatch_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankImportBatch" ADD CONSTRAINT "BankImportBatch_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "BankImportBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
