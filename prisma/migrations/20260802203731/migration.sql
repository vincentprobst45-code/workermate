/*
  Warnings:

  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Invoice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[number]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `customerCity` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerFirstName` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerLastName` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerPostalCode` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerStreet1` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issueDate` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectReference` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectTitle` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantCity` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantEmail` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantName` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantPhoneNumber` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantPostalCode` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantSiretNumber` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantStreet1` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantVatNumber` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vatAmount` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Made the column `customerId` on table `Invoice` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CARD', 'CASH', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoicePdpStatus" AS ENUM ('NOT_SENT', 'SENT', 'ACCEPTED', 'REJECTED');

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
DROP COLUMN "description",
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "customerCity" TEXT NOT NULL,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerFirstName" TEXT NOT NULL,
ADD COLUMN     "customerLastName" TEXT NOT NULL,
ADD COLUMN     "customerPhoneNumber" TEXT,
ADD COLUMN     "customerPostalCode" TEXT NOT NULL,
ADD COLUMN     "customerStreet1" TEXT NOT NULL,
ADD COLUMN     "customerStreet2" TEXT,
ADD COLUMN     "customerVatNumber" TEXT,
ADD COLUMN     "depositAmount" DECIMAL(65,30),
ADD COLUMN     "discountAmount" DECIMAL(65,30),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "issueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "legalMentions" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod",
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "pdfFileId" TEXT,
ADD COLUMN     "pdpMessageId" TEXT,
ADD COLUMN     "pdpStatus" "InvoicePdpStatus" NOT NULL DEFAULT 'NOT_SENT',
ADD COLUMN     "projectAddress" TEXT,
ADD COLUMN     "projectCity" TEXT,
ADD COLUMN     "projectEndDate" TIMESTAMP(3),
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "projectPostalCode" TEXT,
ADD COLUMN     "projectReference" TEXT NOT NULL,
ADD COLUMN     "projectStartDate" TIMESTAMP(3),
ADD COLUMN     "projectTitle" TEXT NOT NULL,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "quoteNumber" TEXT,
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "subtotal" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "tenantBic" TEXT,
ADD COLUMN     "tenantCity" TEXT NOT NULL,
ADD COLUMN     "tenantEmail" TEXT NOT NULL,
ADD COLUMN     "tenantIban" TEXT,
ADD COLUMN     "tenantName" TEXT NOT NULL,
ADD COLUMN     "tenantPhoneNumber" TEXT NOT NULL,
ADD COLUMN     "tenantPostalCode" TEXT NOT NULL,
ADD COLUMN     "tenantSiretNumber" TEXT NOT NULL,
ADD COLUMN     "tenantStreet1" TEXT NOT NULL,
ADD COLUMN     "tenantStreet2" TEXT,
ADD COLUMN     "tenantVatNumber" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "vatAmount" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "customerId" SET NOT NULL;

-- CreateTable
CREATE TABLE "InvoiceItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unit" TEXT,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "vatRate" DECIMAL(5,2) NOT NULL,
    "total" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "InvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_number_key" ON "Invoice"("number");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
