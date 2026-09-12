-- CreateEnum
CREATE TYPE "BankTransactionDirection" AS ENUM ('CREDIT', 'DEBIT');

-- AlterTable
ALTER TABLE "BankTransaction" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "direction" "BankTransactionDirection" NOT NULL DEFAULT 'CREDIT';

-- AlterTable
ALTER TABLE "CompanyExpense" ADD COLUMN     "bankTransactionId" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "paymentAccountId" TEXT;

-- CreateIndex
CREATE INDEX "CompanyExpense_paymentAccountId_idx" ON "CompanyExpense"("paymentAccountId");

-- CreateIndex
CREATE INDEX "CompanyExpense_bankTransactionId_idx" ON "CompanyExpense"("bankTransactionId");

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_bankTransactionId_fkey" FOREIGN KEY ("bankTransactionId") REFERENCES "BankTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
