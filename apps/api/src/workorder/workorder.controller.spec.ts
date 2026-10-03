import type { Request } from 'express';
import { WorkOrderController } from './workorder.controller';

describe('WorkOrderController', () => {
  const request = {
    user: { id: 'user-1' },
    membership: { role: 'OWNER' },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  function createController() {
    const workOrderService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    return { controller: new WorkOrderController(workOrderService as never), workOrderService };
  }

  it('forwards the tenant when creating a work order', async () => {
    const { controller, workOrderService } = createController();
    const dto = { reference: 'WO-001', title: 'Cuisine' };
    workOrderService.create.mockResolvedValue({ id: 'workorder-1' });

    await expect(controller.create(request as never, dto)).resolves.toEqual({ id: 'workorder-1' });
    expect(workOrderService.create).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('forwards the tenant and id for all work order operations', async () => {
    const { controller, workOrderService } = createController();
    workOrderService.findAll.mockResolvedValue([]);
    workOrderService.findOne.mockResolvedValue(null);
    workOrderService.update.mockResolvedValue({ id: 'workorder-1' });
    workOrderService.delete.mockResolvedValue({ count: 1 });

    await controller.findAll(request as never);
    await controller.findOne(request as never, 'workorder-1');
    await controller.update(request as never, 'workorder-1', { title: 'Cuisine rénovée' });
    await controller.delete(request as never, 'workorder-1');

    expect(workOrderService.findAll).toHaveBeenCalledWith('tenant-1');
    expect(workOrderService.findOne).toHaveBeenCalledWith('tenant-1', 'workorder-1');
    expect(workOrderService.update).toHaveBeenCalledWith('tenant-1', 'workorder-1', { title: 'Cuisine rénovée' });
    expect(workOrderService.delete).toHaveBeenCalledWith('tenant-1', 'workorder-1');
  });

  it('rejects requests without tenant context', async () => {
    const { controller, workOrderService } = createController();

    await expect(controller.findAll({ user: { id: 'user-1' } } as never)).rejects.toMatchObject({ status: 401 });
    expect(workOrderService.findAll).not.toHaveBeenCalled();
  });
});
