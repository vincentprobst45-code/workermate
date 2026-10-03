import type { Request } from 'express';
import { AddressController } from './address.controller';

describe('AddressController', () => {
  const request = {
    user: { id: 'user-1' },
    membership: { role: 'OWNER' },
    tenant: { id: 'tenant-1' },
  } as unknown as Request;

  function createController() {
    const addressService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    return { controller: new AddressController(addressService as never), addressService };
  }

  it('forwards the tenant when creating an address', async () => {
    const { controller, addressService } = createController();
    const dto = { street1: '14 rue A', postalCode: '75001', city: 'Paris' };
    addressService.create.mockResolvedValue({ id: 'address-1' });

    await expect(controller.create(request as never, dto)).resolves.toEqual({ id: 'address-1' });
    expect(addressService.create).toHaveBeenCalledWith('tenant-1', dto);
  });

  it('forwards the tenant and id for all address operations', async () => {
    const { controller, addressService } = createController();
    addressService.findAll.mockResolvedValue([]);
    addressService.findOne.mockResolvedValue(null);
    addressService.update.mockResolvedValue({ count: 1 });
    addressService.delete.mockResolvedValue({ count: 1 });

    await controller.findAll(request as never);
    await controller.findOne(request as never, 'address-1');
    await controller.update(request as never, 'address-1', { city: 'Lyon' });
    await controller.delete(request as never, 'address-1');

    expect(addressService.findAll).toHaveBeenCalledWith('tenant-1');
    expect(addressService.findOne).toHaveBeenCalledWith('tenant-1', 'address-1');
    expect(addressService.update).toHaveBeenCalledWith('tenant-1', 'address-1', { city: 'Lyon' });
    expect(addressService.delete).toHaveBeenCalledWith('tenant-1', 'address-1');
  });

  it('rejects requests without tenant context', async () => {
    const { controller, addressService } = createController();

    await expect(controller.findAll({ user: { id: 'user-1' } } as never)).rejects.toMatchObject({ status: 401 });
    expect(addressService.findAll).not.toHaveBeenCalled();
  });
});
