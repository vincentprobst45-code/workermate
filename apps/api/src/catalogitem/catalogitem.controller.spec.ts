import type { AuthenticatedRequest } from '../common/types/auth-request';
import type { CatalogItemService } from './catalogitem.service';
import { CatalogItemController } from './catalogitem.controller';

describe('CatalogItemController', () => {
  function createController() {
    const create = jest.fn().mockResolvedValue({});
    const findAll = jest.fn().mockResolvedValue([]);
    const findOne = jest.fn().mockResolvedValue({});
    const update = jest.fn().mockResolvedValue({});
    const deleteItem = jest.fn().mockResolvedValue({ count: 1 });
    const service = {
      create,
      findAll,
      findOne,
      update,
      delete: deleteItem,
    } as unknown as CatalogItemService;
    return { controller: new CatalogItemController(service), service, create, findAll, findOne, update, deleteItem };
  }

  const request = {
    user: { id: 'user-1' },
    tenant: { id: 'tenant-1' },
    membership: { role: 'OWNER' },
  } as AuthenticatedRequest;

  it('forwards tenant context and converts catalog filters', async () => {
    const { controller, create, findAll, findOne, update, deleteItem } = createController();
    const dto = { type: 'MATERIAL', title: 'Cable', unitPrice: 10 };

    await controller.create(request, dto as never);
    await controller.findAll(request, ' cable ', 'MATERIAL', 'false', 'true', '2', '25');
    await controller.findOne(request, 'item-1');
    await controller.update(request, 'item-1', { isActive: false });
    await controller.delete(request, 'item-1');

    expect(create).toHaveBeenCalledWith('tenant-1', dto);
    expect(findAll).toHaveBeenCalledWith('tenant-1', {
      search: ' cable ',
      type: 'MATERIAL',
      isActive: false,
      trackStock: true,
      page: 2,
      limit: 25,
    });
    expect(findOne).toHaveBeenCalledWith('tenant-1', 'item-1');
    expect(update).toHaveBeenCalledWith('tenant-1', 'item-1', { isActive: false });
    expect(deleteItem).toHaveBeenCalledWith('tenant-1', 'item-1');
  });

  it('rejects catalog routes without tenant context', async () => {
    const { controller, findAll } = createController();
    const requestWithoutTenant = { user: { id: 'user-1' } } as AuthenticatedRequest;

    await expect(controller.findAll(requestWithoutTenant)).rejects.toMatchObject({ status: 401 });
    await expect(controller.findOne(requestWithoutTenant, 'item-1')).rejects.toMatchObject({ status: 401 });
    await expect(controller.create(requestWithoutTenant, {} as never)).rejects.toMatchObject({ status: 401 });
    expect(findAll).not.toHaveBeenCalled();
  });
});
