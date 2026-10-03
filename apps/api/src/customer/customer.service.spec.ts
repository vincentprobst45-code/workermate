import { CustomerService, type CreateCustomerDto } from './customer.service';
import { PrismaService } from '../prisma.service';

describe('CustomerService', () => {
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const updateManyMock = jest.fn();
  const deleteManyMock = jest.fn();

  const prisma = {
    customer: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },
  } as unknown as PrismaService;

  let service: CustomerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CustomerService(prisma);
  });

  it('create throws when tenantId is empty', async () => {
    const dto: CreateCustomerDto = { firstName: 'Jane' };

    await expect(service.create('', dto)).rejects.toThrow('tenantId is required');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('create passes tenant filter into prisma payload', async () => {
    createMock.mockResolvedValue({ id: 'customer-1' });
    const dto: CreateCustomerDto = { firstName: 'Jane', company: 'Acme' };

    await service.create('tenant-1', dto);

    const createCall = (createMock.mock.calls as unknown[][])[0]?.[0] as {
      data: { firstName: string; company: string; tenant: { connect: { id: string } } };
      include: { address: { select: Record<string, boolean> } };
    };
    expect(createCall.data).toEqual(expect.objectContaining({
      firstName: 'Jane',
      company: 'Acme',
      tenant: { connect: { id: 'tenant-1' } },
    }));
    expect(createCall.include.address.select).toEqual({
      id: true,
      street1: true,
      postalCode: true,
      city: true,
    });
  });

  it('create connects an existing address and records the creator', async () => {
    createMock.mockResolvedValue({ id: 'customer-1' });
    const dto: CreateCustomerDto = { firstName: 'Jane', addressId: 'address-1' };

    await service.create('tenant-1', dto, { id: 'user-1' } as never);

    const createCall = (createMock.mock.calls as unknown[][])[0]?.[0] as {
      data: {
        tenant: { connect: { id: string } };
        address: { connect: { id: string } };
        createdBy: { connect: { id: string } };
      };
    };
    expect(createCall.data).toEqual(expect.objectContaining({
      tenant: { connect: { id: 'tenant-1' } },
      address: { connect: { id: 'address-1' } },
      createdBy: { connect: { id: 'user-1' } },
    }));
  });

  it('create rejects mixing an existing address with a new address', async () => {
    const dto: CreateCustomerDto = {
      firstName: 'Jane',
      addressId: 'address-1',
      address: { street1: '1 rue A', postalCode: '75001', city: 'Paris' },
    };

    await expect(service.create('tenant-1', dto)).rejects.toThrow(
      'Vous devez fournir soit addressId, soit une nouvelle adresse.',
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it('create validates required fields when a new address is supplied', async () => {
    const dto: CreateCustomerDto = {
      firstName: 'Jane',
      address: { street1: '1 rue A', postalCode: '', city: 'Paris' },
    };

    await expect(service.create('tenant-1', dto)).rejects.toThrow(
      'Rue, code postal et ville obligatoires.',
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it('create nests a trimmed new address under the tenant', async () => {
    createMock.mockResolvedValue({ id: 'customer-1' });
    const dto: CreateCustomerDto = {
      firstName: 'Jane',
      address: { street1: ' 1 rue A ', street2: ' Apt 2 ', postalCode: ' 75001 ', city: ' Paris ' },
    };

    await service.create('tenant-1', dto);

    const createCall = (createMock.mock.calls as unknown[][])[0]?.[0] as {
      data: { address: { create: Record<string, unknown> } };
    };
    expect(createCall.data.address.create).toEqual(expect.objectContaining({
      street1: '1 rue A',
      street2: 'Apt 2',
      postalCode: '75001',
      city: 'Paris',
      tenant: { connect: { id: 'tenant-1' } },
    }));
  });

  it('findAll scopes query by tenant and orders by recency', async () => {
    findManyMock.mockResolvedValue([]);

    await service.findAll('tenant-2');

    const findManyCall = (findManyMock.mock.calls as unknown[][])[0]?.[0] as {
      where: { tenantId: string };
      orderBy: { createdAt: string };
      select: Record<string, unknown>;
    };
    expect(findManyCall.where).toEqual({ tenantId: 'tenant-2' });
    expect(findManyCall.orderBy).toEqual({ createdAt: 'desc' });
    expect(findManyCall.select).toEqual(expect.objectContaining({
      id: true,
      firstName: true,
      lastName: true,
      address: {
        select: {
          street1: true,
          postalCode: true,
          city: true,
        },
      },
    }));
  });

  it('findOne scopes the lookup by tenant and returns the result', async () => {
    const customer = { id: 'customer-1' };
    findFirstMock.mockResolvedValue(customer);

    await expect(service.findOne('tenant-2', 'customer-1')).resolves.toBe(customer);
    expect(findFirstMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'customer-1', tenantId: 'tenant-2' },
    }));
  });

  it('update scopes the mutation by tenant', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });

    await expect(service.update('tenant-2', 'customer-1', { phone: '0102030405' })).resolves.toEqual({ count: 1 });
    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: 'customer-1', tenantId: 'tenant-2' },
      data: { phone: '0102030405' },
    });
  });

  it('delete uses tenant-scoped condition', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    await service.delete('tenant-3', 'customer-9');

    expect(deleteManyMock).toHaveBeenCalledWith({
      where: {
        id: 'customer-9',
        tenantId: 'tenant-3',
      },
    });
  });
});
