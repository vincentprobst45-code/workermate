-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('STANDARD', 'TRANSFER', 'FEE', 'INTEREST', 'REFUND', 'CASH_WITHDRAWAL');

-- CreateEnum
CREATE TYPE "TreasuryReconciliationStatus" AS ENUM ('COMPLETED', 'DISCREPANCY');

-- CreateEnum
CREATE TYPE "TreasuryAlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- AlterTable
ALTER TABLE "BankTransaction" ADD COLUMN     "reconciliationId" TEXT,
ADD COLUMN     "transactionType" "BankTransactionType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "transferId" TEXT;

-- AlterTable
ALTER TABLE "PaymentAccount" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "closedBalance" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "TreasuryReconciliation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentAccountId" TEXT NOT NULL,
    "openingBalance" DECIMAL(12,2) NOT NULL,
    "calculatedBalance" DECIMAL(12,2) NOT NULL,
    "actualBalance" DECIMAL(12,2) NOT NULL,
    "difference" DECIMAL(12,2) NOT NULL,
    "reconciledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "previousReconciliationDate" TIMESTAMP(3),
    "status" "TreasuryReconciliationStatus" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryTransfer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromAccountId" TEXT NOT NULL,
    "toAccountId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryAlert" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "paymentAccountId" TEXT,
    "severity" "TreasuryAlertSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TreasuryReconciliation_tenantId_paymentAccountId_reconciled_idx" ON "TreasuryReconciliation"("tenantId", "paymentAccountId", "reconciledAt");

-- CreateIndex
CREATE INDEX "TreasuryTransfer_tenantId_transferDate_idx" ON "TreasuryTransfer"("tenantId", "transferDate");

-- CreateIndex
CREATE INDEX "TreasuryAlert_tenantId_resolvedAt_createdAt_idx" ON "TreasuryAlert"("tenantId", "resolvedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_transferId_fkey" FOREIGN KEY ("transferId") REFERENCES "TreasuryTransfer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_reconciliationId_fkey" FOREIGN KEY ("reconciliationId") REFERENCES "TreasuryReconciliation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryReconciliation" ADD CONSTRAINT "TreasuryReconciliation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryReconciliation" ADD CONSTRAINT "TreasuryReconciliation_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryTransfer" ADD CONSTRAINT "TreasuryTransfer_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "PaymentAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryAlert" ADD CONSTRAINT "TreasuryAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryAlert" ADD CONSTRAINT "TreasuryAlert_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
