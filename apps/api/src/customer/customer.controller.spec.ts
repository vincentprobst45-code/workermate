import type { Request } from 'express';
import { CustomerController } from './customer.controller';

describe('CustomerController', () => {
  const request = {
    user: { id: 'user-1' },
    membership: { role: 'OWNER' },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  function createController() {
    const customerService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    return { controller: new CustomerController(customerService as never), customerService };
  }

  it('forwards tenant and user context when creating a customer', async () => {
    const { controller, customerService } = createController();
    const dto = { firstName: 'Jane' };
    customerService.create.mockResolvedValue({ id: 'customer-1' });

    await expect(controller.create(request as never, dto)).resolves.toEqual({ id: 'customer-1' });
    expect(customerService.create).toHaveBeenCalledWith('tenant-1', dto, request.user);
  });

  it('scopes reads and writes to the request tenant', async () => {
    const { controller, customerService } = createController();
    customerService.findAll.mockResolvedValue([]);
    customerService.findOne.mockResolvedValue(null);
    customerService.update.mockResolvedValue({ count: 1 });
    customerService.delete.mockResolvedValue({ count: 1 });

    await controller.findAll(request as never);
    await controller.findOne(request as never, 'customer-1');
    await controller.update(request as never, 'customer-1', { phone: '0102030405' });
    await controller.delete(request as never, 'customer-1');

    expect(customerService.findAll).toHaveBeenCalledWith('tenant-1');
    expect(customerService.findOne).toHaveBeenCalledWith('tenant-1', 'customer-1');
    expect(customerService.update).toHaveBeenCalledWith('tenant-1', 'customer-1', { phone: '0102030405' });
    expect(customerService.delete).toHaveBeenCalledWith('tenant-1', 'customer-1');
  });

  it('rejects requests without tenant context', async () => {
    const { controller, customerService } = createController();

    await expect(controller.findAll({ user: { id: 'user-1' } } as never)).rejects.toMatchObject({ status: 401 });
    expect(customerService.findAll).not.toHaveBeenCalled();
  });
});