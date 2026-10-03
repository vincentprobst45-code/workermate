import type { Request } from 'express';
import { NotificationController } from './notification.controller';

describe('NotificationController', () => {
  const request = {
    user: { id: 'user-1' },
    membership: { role: 'MEMBER' },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  function createController() {
    const notificationService = {
      findReceived: jest.fn(),
      findRecipients: jest.fn(),
      create: jest.fn(),
      markAsRead: jest.fn(),
    };
    return { controller: new NotificationController(notificationService as never), notificationService };
  }

  it('forwards user context for received notifications and read status', async () => {
    const { controller, notificationService } = createController();
    notificationService.findReceived.mockResolvedValue([]);
    notificationService.markAsRead.mockResolvedValue({ success: true });

    await controller.findReceived(request as never);
    await controller.markAsRead(request as never, 'notification-1');

    expect(notificationService.findReceived).toHaveBeenCalledWith('user-1');
    expect(notificationService.markAsRead).toHaveBeenCalledWith('user-1', 'notification-1');
  });

  it('forwards tenant and user context for recipients and creation', async () => {
    const { controller, notificationService } = createController();
    const dto = { recipientIds: ['user-2'], type: 'SYSTEM', message: 'Bonjour' };
    notificationService.findRecipients.mockResolvedValue([]);
    notificationService.create.mockResolvedValue([]);

    await controller.findRecipients(request as never);
    await controller.create(request as never, dto as never);

    expect(notificationService.findRecipients).toHaveBeenCalledWith('tenant-1', 'user-1');
    expect(notificationService.create).toHaveBeenCalledWith('tenant-1', 'user-1', dto);
  });

  it('rejects missing tenant or user context before calling the service', async () => {
    const { controller, notificationService } = createController();

    await expect(controller.findRecipients({ user: { id: 'user-1' } } as never)).rejects.toMatchObject({ status: 401 });
    await expect(controller.findReceived({ tenant: { id: 'tenant-1' } } as never)).rejects.toMatchObject({ status: 401 });
    expect(notificationService.findRecipients).not.toHaveBeenCalled();
    expect(notificationService.findReceived).not.toHaveBeenCalled();
  });
});
