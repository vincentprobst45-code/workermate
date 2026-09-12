/*
  Warnings:

  - The values [SIMPLIFIED] on the enum `VatReturnFrequency` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "VatLiabilityRegime" AS ENUM ('FRANCHISE_BASE', 'LIABLE');

-- AlterEnum
BEGIN;
CREATE TYPE "VatReturnFrequency_new" AS ENUM ('MONTHLY', 'QUARTERLY');
ALTER TABLE "public"."Tenant" ALTER COLUMN "vatReturnFrequency" DROP DEFAULT;
ALTER TABLE "Tenant" ALTER COLUMN "vatReturnFrequency" TYPE "VatReturnFrequency_new" USING ("vatReturnFrequency"::text::"VatReturnFrequency_new");
ALTER TYPE "VatReturnFrequency" RENAME TO "VatReturnFrequency_old";
ALTER TYPE "VatReturnFrequency_new" RENAME TO "VatReturnFrequency";
DROP TYPE "public"."VatReturnFrequency_old";
ALTER TABLE "Tenant" ALTER COLUMN "vatReturnFrequency" SET DEFAULT 'MONTHLY';
COMMIT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "VatLiabilityRegime" "VatLiabilityRegime" NOT NULL DEFAULT 'LIABLE';
