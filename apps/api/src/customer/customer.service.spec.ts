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
    const dto: CreateCustomerDto = { firstname: 'Jane' };

    await expect(service.create('', dto)).rejects.toThrow('tenantId is required');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('create passes tenant filter into prisma payload', async () => {
    createMock.mockResolvedValue({ id: 'customer-1' });
    const dto: CreateCustomerDto = { firstname: 'Jane', company: 'Acme' };

    await service.create('tenant-1', dto);

    expect(createMock).toHaveBeenCalledWith({
      data: {
        firstname: 'Jane',
        company: 'Acme',
        tenantId: 'tenant-1',
      },
    });
  });

  it('findAll scopes query by tenant and orders by recency', async () => {
    findManyMock.mockResolvedValue([]);

    await service.findAll('tenant-2');

    expect(findManyMock).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-2' },
      orderBy: { createdAt: 'desc' },
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
