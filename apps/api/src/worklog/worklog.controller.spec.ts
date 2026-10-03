import type { AuthenticatedRequest } from '../common/types/auth-request';
import type { CreateWorkLogDto } from './create-worklog.dto';
import type { CreateWorkLogItemDto } from './create-worklog-item.dto';
import type { WorkLogService } from './worklog.service';
import { WorkLogController } from './worklog.controller';

describe('WorkLogController', () => {
  function createController() {
    const create = jest.fn().mockResolvedValue({});
    const createItem = jest.fn().mockResolvedValue({});
    const update = jest.fn().mockResolvedValue({});
    const remove = jest.fn().mockResolvedValue({});
    const updateItem = jest.fn().mockResolvedValue({});
    const deleteItem = jest.fn().mockResolvedValue({});
    const findAll = jest.fn().mockResolvedValue([]);
    const service = { create, createItem, update, delete: remove, updateItem, deleteItem, findAll } as unknown as WorkLogService;
    return { controller: new WorkLogController(service), create, createItem, update, remove, updateItem, deleteItem, findAll };
  }

  const request = {
    user: { id: 'user-1' },
    tenant: { id: 'tenant-1' },
    membership: { role: 'OWNER' },
  } as AuthenticatedRequest;

  it('forwards tenant context and route parameters for sheet and item operations', async () => {
    const { controller, create, createItem, update, remove, updateItem, deleteItem, findAll } = createController();
    const workLogDto: CreateWorkLogDto = { projectId: 'project-1', workOrderId: 'work-order-1', date: '2026-10-01T08:00:00.000Z' };
    const itemDto: CreateWorkLogItemDto = { title: 'Câble', quantity: 2, unitCost: 4, type: 'MATERIAL' };

    await controller.create(request, workLogDto);
    await controller.createItem(request, 'worklog-1', itemDto);
    await controller.update(request, 'worklog-1', { title: 'Modifiée' });
    await controller.remove(request, 'worklog-1');
    await controller.updateItem(request, 'worklog-1', 'item-1', { quantity: 3 });
    await controller.deleteItem(request, 'worklog-1', 'item-1');
    await controller.findAll(request, 'work-order-1');

    expect(create).toHaveBeenCalledWith('tenant-1', workLogDto);
    expect(createItem).toHaveBeenCalledWith('tenant-1', 'worklog-1', itemDto);
    expect(update).toHaveBeenCalledWith('tenant-1', 'worklog-1', { title: 'Modifiée' });
    expect(remove).toHaveBeenCalledWith('tenant-1', 'worklog-1');
    expect(updateItem).toHaveBeenCalledWith('tenant-1', 'worklog-1', 'item-1', { quantity: 3 });
    expect(deleteItem).toHaveBeenCalledWith('tenant-1', 'worklog-1', 'item-1');
    expect(findAll).toHaveBeenCalledWith('tenant-1', 'work-order-1');
  });

  it('rejects routes without tenant context', () => {
    const { controller, findAll } = createController();
    const requestWithoutTenant = { user: { id: 'user-1' } } as AuthenticatedRequest;

    expect(() => controller.findAll(requestWithoutTenant)).toThrow('Missing authentication or tenant context on request');
    expect(findAll).not.toHaveBeenCalled();
  });
});
