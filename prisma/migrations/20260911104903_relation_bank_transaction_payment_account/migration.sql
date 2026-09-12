/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,externalId]` on the table `BankTransaction` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentAccountId` to the `BankTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BankTransaction" ADD COLUMN     "paymentAccountId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BankTransaction_paymentAccountId_transactionDate_idx" ON "BankTransaction"("paymentAccountId", "transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_tenantId_externalId_key" ON "BankTransaction"("tenantId", "externalId");

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
