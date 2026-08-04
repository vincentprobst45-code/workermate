/*
  Warnings:

  - You are about to drop the column `projectAddress` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectCity` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `projectPostalCode` on the `Quote` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Quote" DROP COLUMN "projectAddress",
DROP COLUMN "projectCity",
DROP COLUMN "projectPostalCode",
ADD COLUMN     "projectaddressId" TEXT;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_projectaddressId_fkey" FOREIGN KEY ("projectaddressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;
