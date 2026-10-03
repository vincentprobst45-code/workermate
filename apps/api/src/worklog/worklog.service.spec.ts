import { BadRequestException } from '@nestjs/common';
import { LineItemType } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import type { CreateWorkLogDto } from './create-worklog.dto';
import type { CreateWorkLogItemDto } from './create-worklog-item.dto';
import { WorkLogService } from './worklog.service';

describe('WorkLogService', () => {
  const projectFindFirstMock = jest.fn();
  const workOrderFindFirstMock = jest.fn();
  const workLogCreateMock = jest.fn();
  const workLogFindManyMock = jest.fn();
  const workLogUpdateManyMock = jest.fn();
  const workLogFindFirstMock = jest.fn();
  const workLogItemFindFirstMock = jest.fn();
  const transactionMock = jest.fn();

  const prisma = {
    project: { findFirst: projectFindFirstMock },
    workOrder: { findFirst: workOrderFindFirstMock },
    workLog: {
      create: workLogCreateMock,
      findMany: workLogFindManyMock,
      updateMany: workLogUpdateManyMock,
      findFirst: workLogFindFirstMock,
    },
    workLogItem: { findFirst: workLogItemFindFirstMock },
    $transaction: transactionMock,
  } as unknown as PrismaService;

  let service: WorkLogService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new WorkLogService(prisma);
  });

  it('creates a tracking sheet only for a tenant project and its chantier', async () => {
    projectFindFirstMock.mockResolvedValue({ id: 'project-1' });
    workOrderFindFirstMock.mockResolvedValue({ id: 'work-order-1', projectId: 'project-1' });
    workLogCreateMock.mockResolvedValue({ id: 'worklog-1' });
    const dto = {
      projectId: 'project-1',
      workOrderId: 'work-order-1',
      date: '2026-10-01T08:30:00.000Z',
      title: '  Pose du tableau  ',
      description: '  Contrôle effectué  ',
      timePlannedMinutes: 120,
      timeSpentMinutes: 135,
    } as CreateWorkLogDto;

    await expect(service.create('tenant-1', dto)).resolves.toEqual({ id: 'worklog-1' });
    expect(projectFindFirstMock).toHaveBeenCalledWith({
      where: { id: 'project-1', tenantId: 'tenant-1' },
      select: { id: true },
    });
    expect(workOrderFindFirstMock).toHaveBeenCalledWith({
      where: { id: 'work-order-1', tenantId: 'tenant-1' },
      select: { id: true, projectId: true },
    });
    expect(workLogCreateMock).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-1',
        projectId: 'project-1',
        workOrderId: 'work-order-1',
        date: new Date('2026-10-01T08:30:00.000Z'),
        title: 'Pose du tableau',
        description: 'Contrôle effectué',
        timePlannedMinutes: 120,
        timeSpentMinutes: 135,
      },
    });
  });

  it('rejects a chantier from another project or tenant', async () => {
    projectFindFirstMock.mockResolvedValue({ id: 'project-1' });
    workOrderFindFirstMock.mockResolvedValue({ id: 'work-order-1', projectId: 'other-project' });

    const dto: CreateWorkLogDto = {
      projectId: 'project-1',
      workOrderId: 'work-order-1',
      date: '2026-10-01T08:30:00.000Z',
    };

    await expect(service.create('tenant-1', dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(workLogCreateMock).not.toHaveBeenCalled();
  });

  it('lists sheets tenant-scoped and ordered with their consumption lines', async () => {
    workLogFindManyMock.mockResolvedValue([]);

    await service.findAll('tenant-1', 'work-order-1');

    expect(workLogFindManyMock).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', workOrderId: 'work-order-1' },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: { items: { orderBy: { position: 'asc' } } },
    });
  });

  it('creates a consumption line and records tracked-stock consumption', async () => {
    workLogFindFirstMock.mockResolvedValue({
      id: 'worklog-1',
      workOrderId: 'work-order-1',
      items: [{ position: 0 }],
    });
    const txWorkLogItemCreateMock = jest.fn().mockResolvedValue({ id: 'item-1', totalCost: 25 });
    const txCatalogItemFindFirstMock = jest.fn().mockResolvedValue({ id: 'catalog-1', trackStock: true, unitCode: 'MTR' });
    const txStockItemFindUniqueMock = jest.fn().mockResolvedValue({ id: 'stock-1', averageUnitCost: 4 });
    const txStockItemUpdateMock = jest.fn();
    const txStockMovementCreateMock = jest.fn();
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      workLogItem: { create: txWorkLogItemCreateMock },
      workOrderItem: { findFirst: jest.fn() },
      catalogItem: { findFirst: txCatalogItemFindFirstMock },
      stockItem: { findUnique: txStockItemFindUniqueMock, update: txStockItemUpdateMock },
      stockMovement: { create: txStockMovementCreateMock },
    }));

    const dto: CreateWorkLogItemDto = {
      title: 'Câble posé',
      quantity: 2.5,
      baseQuantity: 1,
      unitCode: 'MTR',
      reference: 'CAB-1',
      unitCost: 10,
      type: LineItemType.MATERIAL,
    };

    await expect(service.createItem('tenant-1', 'worklog-1', dto)).resolves.toEqual({ id: 'item-1', totalCost: 25 });
    expect(txWorkLogItemCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workLogId: 'worklog-1',
        position: 1,
        title: 'Câble posé',
        quantity: 2.5,
        totalCost: 25,
      }) as Record<string, unknown>,
    });
    expect(txStockItemUpdateMock).toHaveBeenCalledWith({
      where: { id: 'stock-1' },
      data: { quantityOnHand: { decrement: 2.5 } },
    });
    expect(txStockMovementCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        stockItemId: 'stock-1',
        direction: 'OUT',
        reason: 'CONSUMPTION',
        quantity: 2.5,
        totalCost: 10,
        workLogItemId: 'item-1',
      }) as Record<string, unknown>,
    });
  });

  it('rejects invalid consumption quantities before opening a transaction', async () => {
    workLogFindFirstMock.mockResolvedValue({ id: 'worklog-1', workOrderId: 'work-order-1', items: [] });

    const dto: CreateWorkLogItemDto = {
      title: 'Invalid', quantity: 1, baseQuantity: 0, unitCost: 10, type: LineItemType.MATERIAL,
    };

    await expect(service.createItem('tenant-1', 'worklog-1', dto)).rejects.toBeInstanceOf(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('reverses tracked-stock consumption when deleting a line', async () => {
    const txStockItemUpdateMock = jest.fn();
    const txStockMovementCreateMock = jest.fn();
    workLogItemFindFirstMock.mockResolvedValue({
      id: 'item-1',
      stockMovements: [{
        id: 'movement-1', stockItemId: 'stock-1', direction: 'OUT', reason: 'CONSUMPTION',
        quantity: 2, unitCode: 'MTR', unitCost: 4, totalCost: 8,
      }],
    });
    const txWorkLogItemDeleteMock = jest.fn().mockResolvedValue({ id: 'item-1' });
    transactionMock.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
      stockItem: { update: txStockItemUpdateMock },
      stockMovement: { create: txStockMovementCreateMock },
      workLogItem: { delete: txWorkLogItemDeleteMock },
    }));

    await service.deleteItem('tenant-1', 'worklog-1', 'item-1');

    expect(txStockItemUpdateMock).toHaveBeenCalledWith({ where: { id: 'stock-1' }, data: { quantityOnHand: { increment: 2 } } });
    expect(txStockMovementCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1', direction: 'IN', reason: 'REVERSAL', quantity: 2,
        reversedMovementId: 'movement-1', workLogItemId: 'item-1',
      }) as Record<string, unknown>,
    });
    expect(txWorkLogItemDeleteMock).toHaveBeenCalledWith({ where: { id: 'item-1' } });
  });
});
