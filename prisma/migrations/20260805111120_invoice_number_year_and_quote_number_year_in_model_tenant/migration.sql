/*
  Warnings:

  - Added the required column `invoiceNumberYear` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quoteNumberYear` to the `Tenant` table without a default value. This is not possible if the table is not empty.
  - Made the column `invoiceNumberPrefix` on table `Tenant` required. This step will fail if there are existing NULL values in that column.
  - Made the column `nextQuoteNumber` on table `Tenant` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "invoiceNumberYear" INTEGER NOT NULL,
ADD COLUMN     "quoteNumberPrefix" TEXT NOT NULL DEFAULT 'DEV',
ADD COLUMN     "quoteNumberYear" INTEGER NOT NULL,
ALTER COLUMN "invoiceNumberPrefix" SET NOT NULL,
ALTER COLUMN "invoiceNumberPrefix" SET DEFAULT 'FAC',
ALTER COLUMN "nextQuoteNumber" SET NOT NULL,
ALTER COLUMN "nextQuoteNumber" SET DEFAULT 1;
