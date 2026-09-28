/*
  Warnings:

  - A unique constraint covering the columns `[dedupeKey]` on the table `EmailDelivery` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "EmailDeliveryKind" AS ENUM ('MANUAL', 'REMINDER');

-- AlterTable
ALTER TABLE "EmailDelivery" ADD COLUMN     "dedupeKey" TEXT,
ADD COLUMN     "kind" "EmailDeliveryKind" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "reminderStage" INTEGER;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "emailReminderDelayDays" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "emailReminderMaxAttempts" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "emailReminderRepeatDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "emailRemindersEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "EmailDelivery_dedupeKey_key" ON "EmailDelivery"("dedupeKey");
