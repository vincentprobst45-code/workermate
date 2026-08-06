/*
  Warnings:

  - You are about to drop the column `projectId` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `projectName` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Document` table. All the data in the column will be lost.
  - You are about to drop the column `projectAddress` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectCity` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectEndDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectPostalCode` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectReference` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectStartDate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectTitle` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `projectEndDate` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectReference` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectStartDate` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectTitle` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectaddressId` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProjectItem` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `type` on the `CatalogItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `workOrderId` to the `Document` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `DocumentItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `workOrderReference` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workOrderTitle` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `InvoiceItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `type` on the `QuoteItem` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkOrderItemType" AS ENUM ('LABOR', 'MATERIAL', 'EQUIPMENT', 'TRAVEL', 'SERVICE', 'OTHER');

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_addressId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProjectItem" DROP CONSTRAINT "ProjectItem_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Quote" DROP CONSTRAINT "Quote_projectaddressId_fkey";

-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "projectId",
DROP COLUMN "projectName",
ADD COLUMN     "workOrderId" TEXT,
ADD COLUMN     "workOrderName" TEXT;

-- AlterTable
ALTER TABLE "CatalogItem" DROP COLUMN "type",
ADD COLUMN     "type" "WorkOrderItemType" NOT NULL;

-- AlterTable
ALTER TABLE "Document" DROP COLUMN "projectId",
ADD COLUMN     "workOrderId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DocumentItem" DROP COLUMN "type",
ADD COLUMN     "type" "WorkOrderItemType" NOT NULL;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "projectAddress",
DROP COLUMN "projectCity",
DROP COLUMN "projectEndDate",
DROP COLUMN "projectId",
DROP COLUMN "projectPostalCode",
DROP COLUMN "projectReference",
DROP COLUMN "projectStartDate",
DROP COLUMN "projectTitle",
ADD COLUMN     "workOrderAddress" TEXT,
ADD COLUMN     "workOrderCity" TEXT,
ADD COLUMN     "workOrderEndDate" TIMESTAMP(3),
ADD COLUMN     "workOrderId" TEXT,
ADD COLUMN     "workOrderPostalCode" TEXT,
ADD COLUMN     "workOrderReference" TEXT NOT NULL,
ADD COLUMN     "workOrderStartDate" TIMESTAMP(3),
ADD COLUMN     "workOrderTitle" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InvoiceItem" DROP COLUMN "type",
ADD COLUMN     "type" "WorkOrderItemType" NOT NULL;

-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "projectEndDate",
DROP COLUMN "projectId",
DROP COLUMN "projectReference",
DROP COLUMN "projectStartDate",
DROP COLUMN "projectTitle",
DROP COLUMN "projectaddressId",
ADD COLUMN     "workOrderEndDate" TIMESTAMP(3),
ADD COLUMN     "workOrderId" TEXT,
ADD COLUMN     "workOrderReference" TEXT,
ADD COLUMN     "workOrderStartDate" TIMESTAMP(3),
ADD COLUMN     "workOrderTitle" TEXT,
ADD COLUMN     "workOrderaddressId" TEXT;

-- AlterTable
ALTER TABLE "QuoteItem" DROP COLUMN "type",
ADD COLUMN     "type" "WorkOrderItemType" NOT NULL;

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "ProjectItem";

-- DropEnum
DROP TYPE "ProjectItemType";

-- DropEnum
DROP TYPE "ProjectStatus";

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdById" TEXT,
    "customerId" TEXT,
    "addressId" TEXT,
    "reference" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "estimatedDuration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderItem" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "type" "WorkOrderItemType" NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "vatRate" DECIMAL(4,2) NOT NULL,

    CONSTRAINT "WorkOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrder_reference_key" ON "WorkOrder"("reference");

-- CreateIndex
CREATE INDEX "WorkOrder_tenantId_idx" ON "WorkOrder"("tenantId");

-- CreateIndex
CREATE INDEX "WorkOrder_customerId_idx" ON "WorkOrder"("customerId");

-- CreateIndex
CREATE INDEX "WorkOrderItem_workOrderId_idx" ON "WorkOrderItem"("workOrderId");

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderItem" ADD CONSTRAINT "WorkOrderItem_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_workOrderaddressId_fkey" FOREIGN KEY ("workOrderaddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
