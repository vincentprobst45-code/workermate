/*
  Warnings:

  - You are about to drop the column `bic` on the `Tenant` table. All the data in the column will be lost.
  - You are about to drop the column `iban` on the `Tenant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[recurringInvoiceId,recurrenceDate]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RecurringInvoiceStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "RecurrenceUnit" AS ENUM ('DAY', 'WEEK', 'MONTH', 'YEAR');

-- CreateEnum
CREATE TYPE "RecurringInvoiceGenerationMode" AS ENUM ('DRAFT', 'AUTO_ISSUE');

-- CreateEnum
CREATE TYPE "RecurringInvoiceBillingPeriodMode" AS ENUM ('NONE', 'CURRENT_PERIOD', 'PREVIOUS_PERIOD');

-- CreateEnum
CREATE TYPE "RecurringInvoiceSupplyDateMode" AS ENUM ('NONE', 'OCCURRENCE_DATE', 'PERIOD_START', 'PERIOD_END');

-- CreateEnum
CREATE TYPE "RecurringInvoiceItemBillingPeriodMode" AS ENUM ('INHERIT', 'NONE', 'CURRENT_PERIOD', 'PREVIOUS_PERIOD');

-- CreateEnum
CREATE TYPE "RecurringAdjustmentCalculationMode" AS ENUM ('FIXED_AMOUNT', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "RecurringInvoiceAdjustmentVatMode" AS ENUM ('AUTO', 'SPECIFIC');

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "recurrenceDate" DATE,
ADD COLUMN     "recurringInvoiceId" TEXT;

-- AlterTable
ALTER TABLE "Tenant" DROP COLUMN "bic",
DROP COLUMN "iban",
ADD COLUMN     "defaultPaymentAccountId" TEXT;

-- CreateTable
CREATE TABLE "PaymentAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bankName" TEXT,
    "accountHolderName" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "bic" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoice" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT,
    "customerId" TEXT NOT NULL,
    "projectId" TEXT,
    "workOrderId" TEXT,
    "name" TEXT NOT NULL,
    "status" "RecurringInvoiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "recurrenceUnit" "RecurrenceUnit" NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "startDate" DATE NOT NULL,
    "nextOccurrenceDate" DATE,
    "lastOccurrenceDate" DATE,
    "endDate" DATE,
    "maxOccurrences" INTEGER,
    "generatedCount" INTEGER NOT NULL DEFAULT 0,
    "generationMode" "RecurringInvoiceGenerationMode" NOT NULL DEFAULT 'DRAFT',
    "operationCategory" "InvoiceOperationCategory" NOT NULL,
    "vatAccountingMode" "VatAccountingMode",
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "accountingCurrency" TEXT,
    "buyerReference" TEXT,
    "projectReference" TEXT,
    "contractReference" TEXT,
    "purchaseOrderReference" TEXT,
    "salesOrderReference" TEXT,
    "billingPeriodMode" "RecurringInvoiceBillingPeriodMode" NOT NULL DEFAULT 'NONE',
    "supplyDateMode" "RecurringInvoiceSupplyDateMode" NOT NULL DEFAULT 'NONE',
    "dueInDays" INTEGER,
    "paymentTerms" TEXT,
    "paymentMeansCode" TEXT,
    "paymentMeansText" TEXT,
    "paymentAccountId" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoiceItem" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "notes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "objectIdentifier" TEXT,
    "type" "LineItemType" NOT NULL,
    "quantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
    "unitCode" TEXT NOT NULL,
    "unitLabel" TEXT,
    "purchaseOrderLineReference" TEXT,
    "buyerAccountingReference" TEXT,
    "billingPeriodMode" "RecurringInvoiceItemBillingPeriodMode" NOT NULL DEFAULT 'INHERIT',
    "unitPrice" DECIMAL(19,6) NOT NULL,
    "unitPriceDiscountAmount" DECIMAL(19,6),
    "grossUnitPrice" DECIMAL(19,6),
    "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
    "baseQuantityUnitCode" TEXT,
    "vatCategory" "VatCategory" NOT NULL,
    "vatRate" DECIMAL(5,2),
    "vatExemptionReason" TEXT,
    "vatExemptionReasonCode" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sellerItemIdentifier" TEXT,
    "buyerItemIdentifier" TEXT,
    "standardItemIdentifier" TEXT,
    "standardItemIdentifierScheme" TEXT,
    "countryOfOriginCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoiceAdjustment" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "InvoiceAdjustmentType" NOT NULL,
    "calculationMode" "RecurringAdjustmentCalculationMode" NOT NULL,
    "amount" DECIMAL(19,2),
    "percentage" DECIMAL(9,6),
    "vatMode" "RecurringInvoiceAdjustmentVatMode" NOT NULL DEFAULT 'AUTO',
    "vatCategory" "VatCategory",
    "vatRate" DECIMAL(5,2),
    "reason" TEXT,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoiceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoiceItemAdjustment" (
    "id" TEXT NOT NULL,
    "recurringInvoiceItemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "InvoiceAdjustmentType" NOT NULL,
    "calculationMode" "RecurringAdjustmentCalculationMode" NOT NULL,
    "amount" DECIMAL(19,2),
    "percentage" DECIMAL(9,6),
    "reason" TEXT,
    "reasonCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoiceItemAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecurringInvoiceNote" (
    "id" TEXT NOT NULL,
    "recurringInvoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "subjectCode" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecurringInvoiceNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentAccount_tenantId_idx" ON "PaymentAccount"("tenantId");

-- CreateIndex
CREATE INDEX "PaymentAccount_tenantId_archivedAt_idx" ON "PaymentAccount"("tenantId", "archivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentAccount_tenantId_iban_key" ON "PaymentAccount"("tenantId", "iban");

-- CreateIndex
CREATE INDEX "RecurringInvoice_tenantId_status_nextOccurrenceDate_idx" ON "RecurringInvoice"("tenantId", "status", "nextOccurrenceDate");

-- CreateIndex
CREATE INDEX "RecurringInvoice_customerId_idx" ON "RecurringInvoice"("customerId");

-- CreateIndex
CREATE INDEX "RecurringInvoice_projectId_idx" ON "RecurringInvoice"("projectId");

-- CreateIndex
CREATE INDEX "RecurringInvoice_workOrderId_idx" ON "RecurringInvoice"("workOrderId");

-- CreateIndex
CREATE INDEX "RecurringInvoice_paymentAccountId_idx" ON "RecurringInvoice"("paymentAccountId");

-- CreateIndex
CREATE INDEX "RecurringInvoiceItem_recurringInvoiceId_idx" ON "RecurringInvoiceItem"("recurringInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringInvoiceItem_recurringInvoiceId_position_key" ON "RecurringInvoiceItem"("recurringInvoiceId", "position");

-- CreateIndex
CREATE INDEX "RecurringInvoiceAdjustment_recurringInvoiceId_idx" ON "RecurringInvoiceAdjustment"("recurringInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringInvoiceAdjustment_recurringInvoiceId_position_key" ON "RecurringInvoiceAdjustment"("recurringInvoiceId", "position");

-- CreateIndex
CREATE INDEX "RecurringInvoiceItemAdjustment_recurringInvoiceItemId_idx" ON "RecurringInvoiceItemAdjustment"("recurringInvoiceItemId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringInvoiceItemAdjustment_recurringInvoiceItemId_posit_key" ON "RecurringInvoiceItemAdjustment"("recurringInvoiceItemId", "position");

-- CreateIndex
CREATE INDEX "RecurringInvoiceNote_recurringInvoiceId_idx" ON "RecurringInvoiceNote"("recurringInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringInvoiceNote_recurringInvoiceId_position_key" ON "RecurringInvoiceNote"("recurringInvoiceId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_recurringInvoiceId_recurrenceDate_key" ON "Invoice"("recurringInvoiceId", "recurrenceDate");

-- CreateIndex
CREATE INDEX "Tenant_defaultPaymentAccountId_idx" ON "Tenant"("defaultPaymentAccountId");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_defaultPaymentAccountId_fkey" FOREIGN KEY ("defaultPaymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentAccount" ADD CONSTRAINT "PaymentAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoice" ADD CONSTRAINT "RecurringInvoice_paymentAccountId_fkey" FOREIGN KEY ("paymentAccountId") REFERENCES "PaymentAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoiceItem" ADD CONSTRAINT "RecurringInvoiceItem_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoiceAdjustment" ADD CONSTRAINT "RecurringInvoiceAdjustment_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoiceItemAdjustment" ADD CONSTRAINT "RecurringInvoiceItemAdjustment_recurringInvoiceItemId_fkey" FOREIGN KEY ("recurringInvoiceItemId") REFERENCES "RecurringInvoiceItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringInvoiceNote" ADD CONSTRAINT "RecurringInvoiceNote_recurringInvoiceId_fkey" FOREIGN KEY ("recurringInvoiceId") REFERENCES "RecurringInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
