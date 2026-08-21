/*
  Warnings:

  - You are about to drop the column `subtotal` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `tenantName` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `workOrderaddressId` on the `Quote` table. All the data in the column will be lost.
  - You are about to alter the column `depositAmount` on the `Quote` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(19,2)`.
  - You are about to drop the column `total` on the `QuoteItem` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `QuoteItem` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,number]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[quoteId,position]` on the table `QuoteItem` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `type` on the `CatalogItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `DocumentItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `InvoiceItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `customerName` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lineNetTotal` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxExclusiveAmount` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxInclusiveAmount` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantLegalName` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantSirenNumber` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitCode` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vatCategory` to the `QuoteItem` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `QuoteItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `WorkOrderItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "LineItemType" AS ENUM ('LABOR', 'MATERIAL', 'EQUIPMENT', 'TRAVEL', 'SERVICE', 'OTHER');

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_workOrderaddressId_fkey";

-- DropIndex
DROP INDEX "Quote_number_key";

-- AlterTable
ALTER TABLE "CatalogItem" DROP COLUMN "type",
ADD COLUMN     "type" "LineItemType" NOT NULL;

-- AlterTable
ALTER TABLE "DocumentItem" DROP COLUMN "type",
ADD COLUMN     "type" "LineItemType" NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "type",
ADD COLUMN     "type" "LineItemType" NOT NULL;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "subtotal",
DROP COLUMN "tenantName",
DROP COLUMN "total",
DROP COLUMN "workOrderaddressId",
ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "allowanceTotal" DECIMAL(19,2) NOT NULL DEFAULT 0,
ADD COLUMN     "chargeTotal" DECIMAL(19,2) NOT NULL DEFAULT 0,
ADD COLUMN     "customerCompany" TEXT,
ADD COLUMN     "customerCountryCode" TEXT NOT NULL DEFAULT 'FR',
ADD COLUMN     "customerKeepsReplacedParts" BOOLEAN,
ADD COLUMN     "customerName" TEXT NOT NULL,
ADD COLUMN     "customerSirenNumber" TEXT,
ADD COLUMN     "customerSiretNumber" TEXT,
ADD COLUMN     "depositRate" DECIMAL(7,4),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "lineNetTotal" DECIMAL(19,2) NOT NULL,
ADD COLUMN     "projectReference" TEXT,
ADD COLUMN     "projectTitle" TEXT,
ADD COLUMN     "quotePreparationFee" DECIMAL(19,2) NOT NULL DEFAULT 0,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "taxExclusiveAmount" DECIMAL(19,2) NOT NULL,
ADD COLUMN     "taxInclusiveAmount" DECIMAL(19,2) NOT NULL,
ADD COLUMN     "tenantCountryCode" TEXT NOT NULL DEFAULT 'FR',
ADD COLUMN     "tenantInsuranceGeographicCoverage" TEXT,
ADD COLUMN     "tenantInsurancePolicyNumber" TEXT,
ADD COLUMN     "tenantInsurerAddress" TEXT,
ADD COLUMN     "tenantInsurerName" TEXT,
ADD COLUMN     "tenantLegalForm" TEXT,
ADD COLUMN     "tenantLegalName" TEXT NOT NULL,
ADD COLUMN     "tenantRegistrationMention" TEXT,
ADD COLUMN     "tenantShareCapital" DECIMAL(19,2),
ADD COLUMN     "tenantSirenNumber" TEXT NOT NULL,
ADD COLUMN     "tenantTradingName" TEXT,
ADD COLUMN     "termsAndConditions" TEXT,
ADD COLUMN     "workOrderAddressId" TEXT,
ADD COLUMN     "workOrderCity" TEXT,
ADD COLUMN     "workOrderCountryCode" TEXT,
ADD COLUMN     "workOrderPostalCode" TEXT,
ADD COLUMN     "workOrderStreet1" TEXT,
ADD COLUMN     "workOrderStreet2" TEXT,
ALTER COLUMN "tenantSiretNumber" DROP NOT NULL,
ALTER COLUMN "tenantVatNumber" DROP NOT NULL,
ALTER COLUMN "tenantEmail" DROP NOT NULL,
ALTER COLUMN "tenantPhoneNumber" DROP NOT NULL,
ALTER COLUMN "customerFirstName" DROP NOT NULL,
ALTER COLUMN "customerLastName" DROP NOT NULL,
ALTER COLUMN "vatAmount" SET DATA TYPE DECIMAL(19,2),
ALTER COLUMN "depositAmount" SET DATA TYPE DECIMAL(19,2);

-- AlterTable
ALTER TABLE "QuoteItem" DROP COLUMN "total",
DROP COLUMN "unit",
ADD COLUMN     "baseQuantity" DECIMAL(19,6) NOT NULL DEFAULT 1,
ADD COLUMN     "baseQuantityUnitCode" TEXT,
ADD COLUMN     "sellerItemIdentifier" TEXT,
ADD COLUMN     "subtotal" DECIMAL(19,2) NOT NULL,
ADD COLUMN     "unitCode" TEXT NOT NULL,
ADD COLUMN     "unitLabel" TEXT,
ADD COLUMN     "vatCategory" "VatCategory" NOT NULL,
ALTER COLUMN "description" DROP NOT NULL,
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(19,6),
ALTER COLUMN "vatRate" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "LineItemType" NOT NULL;

-- AlterTable
ALTER TABLE "WorkOrderItem" DROP COLUMN "type",
ADD COLUMN     "type" "LineItemType" NOT NULL;

-- DropEnum
DROP TYPE "WorkOrderItemType";

-- CreateTable
CREATE TABLE "QuoteItemAdjustment" (
    "id" TEXT NOT NULL,
    "quoteItemId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "InvoiceAdjustmentType" NOT NULL,
    "amount" DECIMAL(19,2) NOT NULL,
    "baseAmount" DECIMAL(19,2),
    "percentage" DECIMAL(9,6),
    "reason" TEXT,
    "reasonCode" TEXT,

    CONSTRAINT "QuoteItemAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteAdjustment" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "type" "InvoiceAdjustmentType" NOT NULL,
    "amount" DECIMAL(19,2) NOT NULL,
    "baseAmount" DECIMAL(19,2),
    "percentage" DECIMAL(9,6),
    "vatCategory" "VatCategory" NOT NULL,
    "vatRate" DECIMAL(5,2),
    "reason" TEXT,
    "reasonCode" TEXT,

    CONSTRAINT "QuoteAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVatBreakdown" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "taxableAmount" DECIMAL(19,2) NOT NULL,
    "vatAmount" DECIMAL(19,2) NOT NULL,
    "vatCategory" "VatCategory" NOT NULL,
    "vatRate" DECIMAL(5,2),
    "exemptionReason" TEXT,
    "exemptionReasonCode" TEXT,

    CONSTRAINT "QuoteVatBreakdown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuoteItemAdjustment_quoteItemId_idx" ON "QuoteItemAdjustment"("quoteItemId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItemAdjustment_quoteItemId_position_key" ON "QuoteItemAdjustment"("quoteItemId", "position");

-- CreateIndex
CREATE INDEX "QuoteAdjustment_quoteId_idx" ON "QuoteAdjustment"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteAdjustment_quoteId_position_key" ON "QuoteAdjustment"("quoteId", "position");

-- CreateIndex
CREATE INDEX "QuoteVatBreakdown_quoteId_idx" ON "QuoteVatBreakdown"("quoteId");

-- CreateIndex
CREATE INDEX "Quote_tenantId_issueDate_idx" ON "Quote"("tenantId", "issueDate");

-- CreateIndex
CREATE INDEX "Quote_tenantId_status_idx" ON "Quote"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Quote_customerId_issueDate_idx" ON "Quote"("customerId", "issueDate");

-- CreateIndex
CREATE INDEX "Quote_projectId_idx" ON "Quote"("projectId");

-- CreateIndex
CREATE INDEX "Quote_workOrderId_idx" ON "Quote"("workOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_tenantId_number_key" ON "Quote"("tenantId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteItem_quoteId_position_key" ON "QuoteItem"("quoteId", "position");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_workOrderAddressId_fkey" FOREIGN KEY ("workOrderAddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteItemAdjustment" ADD CONSTRAINT "QuoteItemAdjustment_quoteItemId_fkey" FOREIGN KEY ("quoteItemId") REFERENCES "QuoteItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteAdjustment" ADD CONSTRAINT "QuoteAdjustment_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVatBreakdown" ADD CONSTRAINT "QuoteVatBreakdown_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;
