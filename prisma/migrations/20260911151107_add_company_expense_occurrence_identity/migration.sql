/*
  Warnings:

  - A unique constraint covering the columns `[recurrenceTemplateId,occurrenceDate]` on the table `CompanyExpense` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CompanyExpense" ADD COLUMN     "occurrenceDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceTemplateId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CompanyExpense_recurrenceTemplateId_occurrenceDate_key" ON "CompanyExpense"("recurrenceTemplateId", "occurrenceDate");

-- AddForeignKey
ALTER TABLE "CompanyExpense" ADD CONSTRAINT "CompanyExpense_recurrenceTemplateId_fkey" FOREIGN KEY ("recurrenceTemplateId") REFERENCES "CompanyExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
