import { NotificationActionType, NotificationType } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import { NotificationService } from './notification.service';
import type { CreateNotificationDto } from './create-notification.dto';

describe('NotificationService', () => {
  const findManyNotificationMock = jest.fn();
  const recipientMembershipsMock = jest.fn();
  const createNotificationMock = jest.fn();
  const updateManyMock = jest.fn();
  const transactionMock = jest.fn();

  const prisma = {
    notification: {
      findMany: findManyNotificationMock,
      updateMany: updateManyMock,
    },
    membership: {
      findMany: recipientMembershipsMock,
    },
    $transaction: transactionMock,
  } as unknown as PrismaService;

  let service: NotificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotificationService(prisma);
    transactionMock.mockImplementation(async (callback: (tx: { notification: { create: jest.Mock } }) => Promise<unknown>) => callback({ notification: { create: createNotificationMock } }));
  });

  it('lists received notifications with sender and actions ordered newest first', async () => {
    findManyNotificationMock.mockResolvedValue([{ id: 'notification-1' }]);

    await expect(service.findReceived('user-1')).resolves.toEqual([{ id: 'notification-1' }]);
    expect(findManyNotificationMock).toHaveBeenCalledWith({
      where: { recipientId: 'user-1' },
      include: {
        sender: { select: { id: true, firstname: true, lastname: true, email: true } },
        actions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('lists tenant recipients excluding the current user', async () => {
    recipientMembershipsMock.mockResolvedValue([{ user: { id: 'user-2', email: 'other@example.com' } }]);

    await expect(service.findRecipients('tenant-1', 'user-1')).resolves.toEqual([{ id: 'user-2', email: 'other@example.com' }]);
    expect(recipientMembershipsMock).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', userId: { not: 'user-1' } },
      select: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
      orderBy: { user: { lastname: 'asc' } },
    });
  });

  it('creates one trimmed notification per unique valid recipient with actions', async () => {
    recipientMembershipsMock.mockResolvedValue([{ userId: 'user-2' }, { userId: 'user-3' }]);
    createNotificationMock
      .mockResolvedValueOnce({ id: 'notification-1' })
      .mockResolvedValueOnce({ id: 'notification-2' });
    const dto: CreateNotificationDto = {
      recipientIds: ['user-2', 'user-2', 'user-1', 'user-3'],
      type: NotificationType.USER_MESSAGE,
      title: '  Invitation  ',
      message: '  Bonjour  ',
      actions: [{ label: ' Accepter ', type: NotificationActionType.ACCEPT_MEMBERSHIP_INVITATION, targetId: ' invitation-1 ' }],
    };

    await expect(service.create('tenant-1', 'user-1', dto)).resolves.toEqual([
      { id: 'notification-1' },
      { id: 'notification-2' },
    ]);
    expect(createNotificationMock).toHaveBeenNthCalledWith(1, {
      data: {
        tenantId: 'tenant-1',
        recipientId: 'user-2',
        senderId: 'user-1',
        type: NotificationType.USER_MESSAGE,
        title: 'Invitation',
        message: 'Bonjour',
        actions: { create: [{ label: 'Accepter', type: NotificationActionType.ACCEPT_MEMBERSHIP_INVITATION, targetId: 'invitation-1' }] },
      },
      include: { actions: true },
    });
    expect(createNotificationMock).toHaveBeenCalledTimes(2);
  });

  it('rejects when no other recipient is selected', async () => {
    await expect(service.create('tenant-1', 'user-1', {
      recipientIds: ['user-1', 'user-1'],
      type: NotificationType.SYSTEM,
      message: 'Bonjour',
    })).rejects.toThrow('Sélectionnez au moins un autre utilisateur.');
    expect(recipientMembershipsMock).not.toHaveBeenCalled();
  });

  it('rejects recipients who are not members of the tenant', async () => {
    recipientMembershipsMock.mockResolvedValue([{ userId: 'user-2' }]);

    await expect(service.create('tenant-1', 'user-1', {
      recipientIds: ['user-2', 'foreign-user'],
      type: NotificationType.SYSTEM,
      message: 'Bonjour',
    })).rejects.toThrow('destinataires ne sont pas membres');
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('marks an unread notification as read for the recipient', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });

    await expect(service.markAsRead('user-2', 'notification-1')).resolves.toEqual({ success: true });
    expect(updateManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'notification-1', recipientId: 'user-2', readAt: null },
    }));
  });

  it('rejects marking a missing or already-read notification', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    await expect(service.markAsRead('user-2', 'notification-1')).rejects.toThrow('Notification introuvable.');
  });
});
