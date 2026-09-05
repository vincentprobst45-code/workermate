/*
  Warnings:

  - You are about to drop the column `depositAmount` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `depositRate` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "depositAmount",
DROP COLUMN "depositRate";
