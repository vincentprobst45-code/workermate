/*
  Warnings:

  - You are about to drop the column `link` on the `Notification` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "NotificationActionType" AS ENUM ('OPEN_LINK', 'ACCEPT_MEMBERSHIP_REQUEST', 'REJECT_MEMBERSHIP_REQUEST', 'ACCEPT_MEMBERSHIP_INVITATION', 'REJECT_MEMBERSHIP_INVITATION');

-- CreateEnum
CREATE TYPE "MembershipInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "link";

-- CreateTable
CREATE TABLE "NotificationAction" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "NotificationActionType" NOT NULL,
    "targetId" TEXT,

    CONSTRAINT "NotificationAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipInvitation" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "invitedUserId" TEXT,
    "email" TEXT NOT NULL,
    "role" "TenantRole" NOT NULL,
    "status" "MembershipInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NotificationAction_notificationId_idx" ON "NotificationAction"("notificationId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipInvitation_tokenHash_key" ON "MembershipInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "MembershipInvitation_tenantId_status_idx" ON "MembershipInvitation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "MembershipInvitation_email_status_idx" ON "MembershipInvitation"("email", "status");

-- AddForeignKey
ALTER TABLE "NotificationAction" ADD CONSTRAINT "NotificationAction_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipInvitation" ADD CONSTRAINT "MembershipInvitation_invitedUserId_fkey" FOREIGN KEY ("invitedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
