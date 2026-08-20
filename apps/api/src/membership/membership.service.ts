import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { NotificationActionType, NotificationType, TenantRole } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class MembershipService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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

  async findForTenant(tenantId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { tenantId },
      select: {
        userId: true,
        role: true,
        joinedAt: true,
        user: { select: { id: true, email: true, firstname: true, lastname: true } },
      },
      orderBy: [{ role: 'asc' }, { user: { lastname: 'asc' } }, { user: { firstname: 'asc' } }],
    });

    return memberships.map((membership) => ({
      userId: membership.userId,
      role: membership.role,
      joinedAt: membership.joinedAt,
      user: membership.user,
    }));
  }

  async updateRole(tenantId: string, actorUserId: string, targetUserId: string, role: TenantRole) {
    const [actorMembership, targetMembership] = await Promise.all([
      this.prisma.membership.findUnique({ where: { userId_tenantId: { userId: actorUserId, tenantId } } }),
      this.prisma.membership.findUnique({ where: { userId_tenantId: { userId: targetUserId, tenantId } } }),
    ]);

    if (!actorMembership || !targetMembership) {
      throw new NotFoundException('Membership introuvable.');
    }
    if (actorMembership.role === 'MEMBER') {
      throw new ForbiddenException('Seuls les OWNER et ADMIN peuvent modifier un rôle.');
    }
    if (actorMembership.role === 'ADMIN' && (targetMembership.role === 'OWNER' || role === 'OWNER')) {
      throw new ForbiddenException('Un ADMIN ne peut gérer que les MEMBER et ADMIN.');
    }

    return this.prisma.membership.update({
      where: { userId_tenantId: { userId: targetUserId, tenantId } },
      data: { role },
    });
  }

  async removeMembership(tenantId: string, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre membership.');
    }

    const [actorMembership, targetMembership] = await Promise.all([
      this.prisma.membership.findUnique({ where: { userId_tenantId: { userId: actorUserId, tenantId } } }),
      this.prisma.membership.findUnique({ where: { userId_tenantId: { userId: targetUserId, tenantId } } }),
    ]);

    if (!actorMembership || !targetMembership) {
      throw new NotFoundException('Membership introuvable.');
    }
    if (actorMembership.role === 'MEMBER') {
      throw new ForbiddenException('Seuls les OWNER et ADMIN peuvent supprimer un membership.');
    }
    if (actorMembership.role === 'ADMIN' && targetMembership.role === 'OWNER') {
      throw new ForbiddenException('Un ADMIN ne peut pas supprimer un OWNER.');
    }

    return this.prisma.membership.delete({
      where: { userId_tenantId: { userId: targetUserId, tenantId } },
    });
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
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    if (!tenant) {
      throw new NotFoundException('Entreprise introuvable.');
    }

    const invitation = await this.prisma.$transaction(async (tx) => {
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
            type: NotificationType.MEMBERSHIP_INVITE,
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

    if (!invitedUser) {
      const invitationUrl = `https://workermate.fr/register?invitation=${encodeURIComponent(rawToken)}`;
      await this.emailService.sendMembershipInvitation(
        normalizedEmail,
        tenant.name,
        invitationUrl,
      );
    }

    return invitation;
  }

  async acceptInvitation(userId: string, invitationId: string) {
    const invitation = await this.prisma.membershipInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.invitedUserId !== userId) {
      throw new NotFoundException('Invitation introuvable.');
    }
    if (invitation.status !== 'PENDING' || invitation.expiresAt <= new Date()) {
      throw new ConflictException('Cette invitation n’est plus valide.');
    }

    return this.prisma.$transaction(async (tx) => {
      const membership = await tx.membership.upsert({
        where: {
          userId_tenantId: {
            userId,
            tenantId: invitation.tenantId,
          },
        },
        create: {
          userId,
          tenantId: invitation.tenantId,
          role: invitation.role,
        },
        update: {},
      });

      await tx.membershipInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      return membership;
    });
  }

  async rejectInvitation(userId: string, invitationId: string) {
    const invitation = await this.prisma.membershipInvitation.findUnique({
      where: { id: invitationId },
      include: {
        invitedUser: { select: { firstname: true, lastname: true, email: true } },
        invitedBy: { select: { id: true } },
        tenant: { select: { name: true } },
      },
    });

    if (!invitation || invitation.invitedUserId !== userId) {
      throw new NotFoundException('Invitation introuvable.');
    }
    if (invitation.status !== 'PENDING' || invitation.expiresAt <= new Date()) {
      throw new ConflictException('Cette invitation n’est plus valide.');
    }

    const userName = [invitation.invitedUser?.firstname, invitation.invitedUser?.lastname]
      .filter(Boolean)
      .join(' ') || invitation.invitedUser?.email || 'Un utilisateur';

    return this.prisma.$transaction(async (tx) => {
      const updatedInvitation = await tx.membershipInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
        },
      });

      await tx.notification.create({
        data: {
          tenantId: invitation.tenantId,
          recipientId: invitation.invitedBy.id,
          type: NotificationType.MEMBERSHIP_INVITE,
          title: 'Invitation refusée',
          message: `${userName} a refusé votre invitation à rejoindre ${invitation.tenant.name}`,
        },
      });

      return updatedInvitation;
    });
  }
}
