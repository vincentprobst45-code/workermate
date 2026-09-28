-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('RECORDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "status" "PaymentStatus" NOT NULL DEFAULT 'RECORDED';
