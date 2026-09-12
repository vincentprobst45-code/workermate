-- CreateEnum
CREATE TYPE "CompanyExpenseRecurrenceUnit" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "CompanyExpense" ADD COLUMN     "lastGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "nextDueDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceInterval" INTEGER,
ADD COLUMN     "recurrenceStartDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceUnit" "CompanyExpenseRecurrenceUnit";

-- CreateIndex
CREATE INDEX "CompanyExpense_tenantId_recurring_nextDueDate_idx" ON "CompanyExpense"("tenantId", "recurring", "nextDueDate");
