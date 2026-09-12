/*
  Warnings:

  - You are about to drop the column `amount` on the `CompanyExpense` table. All the data in the column will be lost.
  - You are about to drop the column `recurring` on the `CompanyExpense` table. All the data in the column will be lost.
  - You are about to drop the column `vatRate` on the `CompanyExpense` table. All the data in the column will be lost.
  - Added the required column `taxInclusiveAmount` to the `CompanyExpense` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CompanyExpense_tenantId_recurring_nextDueDate_idx";

-- AlterTable
ALTER TABLE "CompanyExpense" DROP COLUMN "amount",
DROP COLUMN "recurring",
DROP COLUMN "vatRate",
ADD COLUMN     "deductibleVatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxExclusiveAmount" DECIMAL(19,2),
ADD COLUMN     "taxInclusiveAmount" DECIMAL(19,2) NOT NULL,
ADD COLUMN     "vatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CompanyExpense_tenantId_nextDueDate_idx" ON "CompanyExpense"("tenantId", "nextDueDate");
