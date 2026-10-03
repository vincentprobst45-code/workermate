import { LineItemType, VatCategory } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import { WorkOrderService } from './workorder.service';
import type { CreateWorkOrderDto } from './create-workorder.dto';

describe('WorkOrderService', () => {
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const updateManyMock = jest.fn();
  const deleteManyMock = jest.fn();
  const itemDeleteManyMock = jest.fn();
  const itemCreateManyMock = jest.fn();
  const transactionMock = jest.fn();

  const prisma = {
    workOrder: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },
    workOrderItem: {
      deleteMany: itemDeleteManyMock,
      createMany: itemCreateManyMock,
    },
    $transaction: transactionMock,
  } as unknown as PrismaService;

  let service: WorkOrderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkOrderService(prisma);
    transactionMock.mockImplementation(async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma));
  });

  it('creates a tenant-scoped work order with customer, address and normalized items', async () => {
    createMock.mockResolvedValue({ id: 'workorder-1' });
    const dto: CreateWorkOrderDto = {
      reference: ' WO-001 ',
      title: 'Salle de bain',
      customerId: 'customer-1',
      address: { street1: ' 1 rue A ', postalCode: ' 75001 ', city: ' Paris ' },
      items: [{
        type: LineItemType.LABOR,
        position: 0,
        title: 'Pose',
        quantity: 2,
        unit: 'heure',
        unitPrice: 50,
        vatCategory: VatCategory.STANDARD,
      }],
    };

    await service.create('tenant-1', dto);

    const createCall = (createMock.mock.calls as unknown[][])[0]?.[0] as {
      data: {
        reference: string;
        tenant: { connect: { id: string } };
        customer: { connect: { id: string } };
        address: { create: { street1: string; postalCode: string; city: string; tenant: { connect: { id: string } } } };
        items: { create: Array<{ position: number; unitCode: string; unitLabel: string; subtotal: number; vatRate: number }> };
      };
    };
    expect(createCall.data.reference).toBe('WO-001');
    expect(createCall.data.tenant).toEqual({ connect: { id: 'tenant-1' } });
    expect(createCall.data.customer).toEqual({ connect: { id: 'customer-1' } });
    expect(createCall.data.address.create).toEqual(expect.objectContaining({
      street1: '1 rue A',
      postalCode: '75001',
      city: 'Paris',
      tenant: { connect: { id: 'tenant-1' } },
    }));
    expect(createCall.data.items.create[0]).toEqual(expect.objectContaining({
      position: 0,
      unitCode: 'C62',
      unitLabel: 'heure',
      subtotal: 100,
      vatRate: 0,
    }));
  });

  it('generates a reference when one is not provided', async () => {
    createMock.mockResolvedValue({ id: 'workorder-1' });

    await service.create('tenant-1', { reference: '', title: 'Dépannage' });

    const createCall = (createMock.mock.calls as unknown[][])[0]?.[0] as { data: { reference: string } };
    expect(createCall.data.reference).toBe(`CH-${new Date().getFullYear()}-Dépannage`);
  });

  it('rejects incomplete new intervention addresses', async () => {
    await expect(service.create('tenant-1', {
      reference: 'WO-001',
      title: 'Salle de bain',
      address: { street1: '1 rue A', postalCode: '', city: 'Paris' },
    })).rejects.toThrow('Rue, code postal et ville obligatoires.');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('lists and finds work orders within the tenant', async () => {
    findManyMock.mockResolvedValue([]);
    findFirstMock.mockResolvedValue({ id: 'workorder-1' });

    await service.findAll('tenant-1');
    await expect(service.findOne('tenant-1', 'workorder-1')).resolves.toEqual({ id: 'workorder-1' });

    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { tenantId: 'tenant-1' },
      orderBy: { createdAt: 'desc' },
    }));
    expect(findFirstMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'workorder-1', tenantId: 'tenant-1' },
    }));
  });

  it('updates the work order and replaces its items in one transaction', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    findFirstMock.mockResolvedValue({ id: 'workorder-1', items: [] });

    const result = await service.update('tenant-1', 'workorder-1', {
      title: 'Salle de bain rénovée',
      startDate: '2026-10-10T09:00:00.000Z',
      items: [{ type: LineItemType.MATERIAL, position: 0, title: 'Carrelage', unitPrice: 20 }],
    });

    expect(result).toEqual({ id: 'workorder-1', items: [] });
    expect(updateManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'workorder-1', tenantId: 'tenant-1' },
    }));
    expect(itemDeleteManyMock).toHaveBeenCalledWith({ where: { workOrderId: 'workorder-1' } });
    expect(itemCreateManyMock).toHaveBeenCalledWith(expect.objectContaining({
      data: [expect.objectContaining({ title: 'Carrelage', position: 0, unitCode: 'C62', subtotal: 20 })],
    }));
  });

  it('returns null instead of updating a work order from another tenant', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    await expect(service.update('tenant-2', 'workorder-1', { title: 'Intrusion' })).resolves.toBeNull();
    expect(itemDeleteManyMock).not.toHaveBeenCalled();
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it('deletes only the requested work order within the tenant', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    await expect(service.delete('tenant-1', 'workorder-1')).resolves.toEqual({ count: 1 });
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { id: 'workorder-1', tenantId: 'tenant-1' } });
  });
});
