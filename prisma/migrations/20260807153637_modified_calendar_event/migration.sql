/*
  Warnings:

  - You are about to drop the column `addressName` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `createdByName` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `CalendarEvent` table. All the data in the column will be lost.
  - You are about to drop the column `workOrderName` on the `CalendarEvent` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CalendarEventStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_addressId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_customerId_fkey";

-- DropForeignKey
ALTER TABLE "CalendarEvent" DROP CONSTRAINT "CalendarEvent_workOrderId_fkey";

-- AlterTable
ALTER TABLE "CalendarEvent" DROP COLUMN "addressName",
DROP COLUMN "createdByName",
DROP COLUMN "customerName",
DROP COLUMN "workOrderName",
ADD COLUMN     "allDay" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "CalendarEventStatus" NOT NULL DEFAULT 'SCHEDULED';

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
