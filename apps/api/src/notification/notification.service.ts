import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateNotificationDto } from './create-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async findReceived(recipientId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId },
      include: {
        sender: { select: { id: true, firstname: true, lastname: true, email: true } },
        actions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecipients(tenantId: string, currentUserId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { tenantId, userId: { not: currentUserId } },
      select: {
        user: { select: { id: true, firstname: true, lastname: true, email: true } },
      },
      orderBy: { user: { lastname: 'asc' } },
    });

    return memberships.map(({ user }) => user);
  }

  async create(tenantId: string, senderId: string, dto: CreateNotificationDto) {
    const recipientIds = [...new Set(dto.recipientIds)].filter((id) => id !== senderId);
    if (!recipientIds.length) {
      throw new BadRequestException('Sélectionnez au moins un autre utilisateur.');
    }

    const memberships = await this.prisma.membership.findMany({
      where: { tenantId, userId: { in: recipientIds } },
      select: { userId: true },
    });
    const validRecipientIds = new Set(memberships.map((membership) => membership.userId));
    if (recipientIds.some((id) => !validRecipientIds.has(id))) {
      throw new BadRequestException('Un ou plusieurs destinataires ne sont pas membres de ce tenant.');
    }

    return this.prisma.$transaction(async (tx) => {
      const notifications: Array<Prisma.NotificationGetPayload<{ include: { actions: true } }>> = [];
      for (const recipientId of recipientIds) {
        const notification = await tx.notification.create({
          data: {
            tenantId,
            recipientId,
            senderId,
            type: dto.type,
            title: dto.title?.trim() || undefined,
            message: dto.message.trim(),
            actions: dto.actions?.length ? { create: dto.actions.map((action) => ({ ...action, label: action.label.trim(), targetId: action.targetId?.trim() || undefined })) } : undefined,
          },
          include: { actions: true },
        });
        notifications.push(notification);
      }
      return notifications;
    });
  }

  async markAsRead(recipientId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, recipientId, readAt: null },
      data: { readAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Notification introuvable.');
    return { success: true };
  }
}
