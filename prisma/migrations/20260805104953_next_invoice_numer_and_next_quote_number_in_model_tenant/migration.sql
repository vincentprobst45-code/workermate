/*
  Warnings:

  - Made the column `nextInvoiceNumber` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "nextQuoteNumber" INTEGER,
ALTER COLUMN "nextInvoiceNumber" SET NOT NULL,
ALTER COLUMN "nextInvoiceNumber" SET DEFAULT 1;
