-- CreateEnum
CREATE TYPE "VatReturnFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'SIMPLIFIED');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "vatReturnFrequency" "VatReturnFrequency" NOT NULL DEFAULT 'MONTHLY';
