/*
  Warnings:

  - The values [PURCHASE] on the enum `CompanyExpenseCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CompanyExpenseCategory_new" AS ENUM ('SOCIAL_COST', 'RENT', 'INSURANCE', 'SUBSCRIPTION', 'VAT_DUE', 'TAXES', 'LOAN_REPAYMENT');
ALTER TABLE "CompanyExpense" ALTER COLUMN "category" TYPE "CompanyExpenseCategory_new" USING ("category"::text::"CompanyExpenseCategory_new");
ALTER TYPE "CompanyExpenseCategory" RENAME TO "CompanyExpenseCategory_old";
ALTER TYPE "CompanyExpenseCategory_new" RENAME TO "CompanyExpenseCategory";
DROP TYPE "public"."CompanyExpenseCategory_old";
COMMIT;

-- CreateTable
CREATE TABLE "SupplierInvoiceVatBreakdown" (
    "id" TEXT NOT NULL,
    "supplierInvoiceId" TEXT NOT NULL,
    "vatCategory" "VatCategory" NOT NULL DEFAULT 'STANDARD',
    "vatRate" DECIMAL(5,2),
    "taxableAmount" DECIMAL(19,2) NOT NULL,
    "vatAmount" DECIMAL(19,2) NOT NULL,
    "deductibleVatAmount" DECIMAL(19,2) NOT NULL DEFAULT 0,

    CONSTRAINT "SupplierInvoiceVatBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierInvoiceVatBreakdown_supplierInvoiceId_idx" ON "SupplierInvoiceVatBreakdown"("supplierInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoiceVatBreakdown_supplierInvoiceId_vatCategory_v_key" ON "SupplierInvoiceVatBreakdown"("supplierInvoiceId", "vatCategory", "vatRate");

-- AddForeignKey
ALTER TABLE "SupplierInvoiceVatBreakdown" ADD CONSTRAINT "SupplierInvoiceVatBreakdown_supplierInvoiceId_fkey" FOREIGN KEY ("supplierInvoiceId") REFERENCES "SupplierInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
