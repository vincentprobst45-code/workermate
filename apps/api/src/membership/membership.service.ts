import { ConflictException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { NotificationActionType, NotificationType, TenantRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';

@Injectable()
export class MembershipService {
  constructor(private prisma: PrismaService) {}

  async findForUser(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      select: {
        tenantId: true,
        role: true,
        tenant: { select: { name: true } },
      },
      orderBy: { tenant: { name: 'asc' } },
    });

    return memberships.map((membership) => ({
      tenantId: membership.tenantId,
      tenantName: membership.tenant.name,
      role: membership.role,
    }));
  }

  async createInvitation(tenantId: string, invitedById: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingInvitation = await this.prisma.membershipInvitation.findFirst({
      where: { tenantId, email: normalizedEmail, status: 'PENDING' },
      select: { id: true },
    });
    if (existingInvitation) {
      throw new ConflictException('Une invitation est déjà en attente pour cet email.');
    }

    const invitedUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    const tokenHash = createHash('sha256').update(randomBytes(32)).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.membershipInvitation.create({
        data: {
          tenantId,
          invitedById,
          invitedUserId: invitedUser?.id,
          email: normalizedEmail,
          role: TenantRole.MEMBER,
          tokenHash,
          expiresAt,
        },
        select: {
          id: true,
          tenantId: true,
          email: true,
          role: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
      });

      if (invitedUser) {
        await tx.notification.create({
          data: {
            tenantId,
            recipientId: invitedUser.id,
            senderId: invitedById,
            type: NotificationType.SYSTEM,
            title: 'Invitation à rejoindre une entreprise',
            message: 'Vous avez reçu une invitation à rejoindre une entreprise.',
            actions: {
              create: [
                {
                  label: 'Accepter l’invitation',
                  type: NotificationActionType.ACCEPT_MEMBERSHIP_INVITATION,
                  targetId: invitation.id,
                },
                {
                  label: 'Refuser l’invitation',
                  type: NotificationActionType.REJECT_MEMBERSHIP_INVITATION,
                  targetId: invitation.id,
                },
              ],
            },
          },
        });
      }

      return invitation;
    });
  }
}
