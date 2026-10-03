import { NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import type { CreateCatalogItemDto } from './create-catalog-item.dto';
import { CatalogItemService } from './catalogitem.service';

describe('CatalogItemService', () => {
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const updateManyMock = jest.fn();
  const deleteManyMock = jest.fn();

  const prisma = {
    catalogItem: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },
  } as unknown as PrismaService;

  let service: CatalogItemService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CatalogItemService(prisma);
  });

  it('creates a normalized catalog item with defaults', async () => {
    createMock.mockResolvedValue({ id: 'item-1' });
    const dto = {
      type: 'MATERIAL',
      title: '  Cable cuivre  ',
      reference: '  CAB-001  ',
      description: '  3G2.5  ',
      unit: ' m ',
      unitPrice: 12.5,
      trackStock: true,
    } as CreateCatalogItemDto;

    await expect(service.create('tenant-1', dto)).resolves.toEqual({ id: 'item-1' });
    expect(createMock).toHaveBeenCalledWith({
      data: {
        tenant: { connect: { id: 'tenant-1' } },
        type: 'MATERIAL',
        reference: 'CAB-001',
        title: 'Cable cuivre',
        description: '3G2.5',
        isActive: true,
        defaultQuantity: 1,
        unitCode: 'C62',
        unitLabel: 'm',
        baseQuantity: 1,
        baseQuantityUnitCode: undefined,
        unitPrice: 12.5,
        unitCost: undefined,
        purchaseVatRate: undefined,
        vatRate: undefined,
        vatCategory: 'STANDARD',
        trackStock: true,
      },
    });
  });

  it('finds catalog items with tenant filters, search and bounded pagination', async () => {
    findManyMock.mockResolvedValue([]);

    await service.findAll('tenant-1', {
      search: '  cable ',
      type: 'MATERIAL',
      isActive: false,
      trackStock: true,
      page: 0,
      limit: 500,
    });

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        type: 'MATERIAL',
        isActive: false,
        trackStock: true,
        OR: [
          { title: { contains: 'cable', mode: 'insensitive' } },
          { reference: { contains: 'cable', mode: 'insensitive' } },
          { description: { contains: 'cable', mode: 'insensitive' } },
        ],
      },
      include: { stockItem: true },
      orderBy: { createdAt: 'desc' },
      skip: 0,
      take: 100,
    });
  });

  it('finds one item only inside the requested tenant', async () => {
    const item = { id: 'item-1', tenantId: 'tenant-1', stockItem: null };
    findFirstMock.mockResolvedValue(item);

    await expect(service.findOne('tenant-1', 'item-1')).resolves.toBe(item);
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 'item-1', tenantId: 'tenant-1' },
      include: { stockItem: true },
    });
  });

  it('rejects reading an item from another tenant', async () => {
    findFirstMock.mockResolvedValue(null);

    await expect(service.findOne('tenant-1', 'foreign-item')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates only the requested tenant item and returns the updated item', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    findFirstMock.mockResolvedValue({ id: 'item-1', tenantId: 'tenant-1' });

    await expect(service.update('tenant-1', 'item-1', {
      title: '  Nouveau titre ',
      reference: '   ',
      unit: 'unité',
      unitPrice: 15,
      isActive: false,
    })).resolves.toEqual({ id: 'item-1', tenantId: 'tenant-1' });
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: 'item-1', tenantId: 'tenant-1' },
      data: {
        type: undefined,
        reference: undefined,
        title: 'Nouveau titre',
        description: undefined,
        isActive: false,
        trackStock: undefined,
        defaultQuantity: undefined,
        unitCode: 'C62',
        unitLabel: 'unité',
        baseQuantity: undefined,
        baseQuantityUnitCode: undefined,
        unitPrice: 15,
        unitCost: undefined,
        purchaseVatRate: undefined,
        vatRate: undefined,
        vatCategory: undefined,
      },
    });
  });

  it('rejects updating an item outside the tenant', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });

    await expect(service.update('tenant-1', 'foreign-item', { isActive: false }))
      .rejects.toBeInstanceOf(NotFoundException);
    expect(findFirstMock).not.toHaveBeenCalled();
  });

  it('deletes only the requested tenant item', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    await expect(service.delete('tenant-1', 'item-1')).resolves.toEqual({ count: 1 });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: 'item-1', tenantId: 'tenant-1' },
    });
  });
});
