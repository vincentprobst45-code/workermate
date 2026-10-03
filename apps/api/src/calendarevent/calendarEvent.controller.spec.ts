import type { Request } from 'express';
import { CalendarEventController } from './calendarEvent.controller';

describe('CalendarEventController', () => {
  const request = {
    user: { id: 'user-1' },
    membership: { role: 'OWNER' },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  function createController() {
    const calendarEventService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    return { controller: new CalendarEventController(calendarEventService as never), calendarEventService };
  }

  it('forwards tenant and user context when creating an event', async () => {
    const { controller, calendarEventService } = createController();
    const dto = { title: 'Visite', startDate: new Date(), endDate: new Date() };
    calendarEventService.create.mockResolvedValue({ id: 'event-1' });

    await expect(controller.create(request as never, dto)).resolves.toEqual({ id: 'event-1' });
    expect(calendarEventService.create).toHaveBeenCalledWith('tenant-1', dto, request.user);
  });

  it('forwards filters and ids for event operations', async () => {
    const { controller, calendarEventService } = createController();
    calendarEventService.findAll.mockResolvedValue([]);
    calendarEventService.findOne.mockResolvedValue(null);
    calendarEventService.update.mockResolvedValue({ id: 'event-1' });
    calendarEventService.delete.mockResolvedValue({ count: 1 });

    await controller.findAll(request as never, 'project-1', '2026-10-01', '2026-10-31');
    await controller.findOne(request as never, 'event-1');
    await controller.update(request as never, 'event-1', { title: 'Visite modifiée' });
    await controller.delete(request as never, 'event-1');

    expect(calendarEventService.findAll).toHaveBeenCalledWith('tenant-1', '2026-10-01', '2026-10-31', 'project-1');
    expect(calendarEventService.findOne).toHaveBeenCalledWith('tenant-1', 'event-1');
    expect(calendarEventService.update).toHaveBeenCalledWith('tenant-1', 'event-1', { title: 'Visite modifiée' });
    expect(calendarEventService.delete).toHaveBeenCalledWith('tenant-1', 'event-1');
  });

  it('rejects requests without tenant context', async () => {
    const { controller, calendarEventService } = createController();

    await expect(controller.findAll({ user: { id: 'user-1' } } as never)).rejects.toMatchObject({ status: 401 });
    expect(calendarEventService.findAll).not.toHaveBeenCalled();
  });
});
