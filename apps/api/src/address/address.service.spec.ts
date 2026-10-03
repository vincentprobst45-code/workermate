import type { PrismaService } from '../prisma.service';
import { AddressService } from './address.service';
import type { CreateAddressDto } from './create-address.dto';

describe('AddressService', () => {
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const updateManyMock = jest.fn();
  const deleteManyMock = jest.fn();

  const prisma = {
    address: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      updateMany: updateManyMock,
      deleteMany: deleteManyMock,
    },
  } as unknown as PrismaService;

  let service: AddressService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AddressService(prisma);
  });

  it('creates a tenant-scoped address with trimmed optional fields and a default country', async () => {
    createMock.mockResolvedValue({ id: 'address-1' });
    const dto: CreateAddressDto = {
      street1: ' 14 rue des Acacias ',
      street2: ' Bâtiment A ',
      postalCode: ' 75001 ',
      city: ' Paris ',
      region: ' Île-de-France ',
      countryCode: ' ',
      latitude: ' 48.8566 ',
      longitude: ' 2.3522 ',
      accessCode: ' A42# ',
      floor: ' 3 ',
      apartment: ' B12 ',
      note: ' Sonner ',
    };

    await expect(service.create('tenant-1', dto)).resolves.toEqual({ id: 'address-1' });

    expect(createMock).toHaveBeenCalledWith({
      data: {
        street1: '14 rue des Acacias',
        street2: 'Bâtiment A',
        postalCode: '75001',
        city: 'Paris',
        region: 'Île-de-France',
        countryCode: 'FR',
        latitude: '48.8566',
        longitude: '2.3522',
        accessCode: 'A42#',
        floor: '3',
        apartment: 'B12',
        note: 'Sonner',
        tenant: { connect: { id: 'tenant-1' } },
      },
    });
  });

  it('lists and finds addresses scoped to the tenant', async () => {
    findManyMock.mockResolvedValue([{ id: 'address-1' }]);
    findFirstMock.mockResolvedValue({ id: 'address-1' });

    await expect(service.findAll('tenant-1')).resolves.toEqual([{ id: 'address-1' }]);
    await expect(service.findOne('tenant-1', 'address-1')).resolves.toEqual({ id: 'address-1' });

    expect(findManyMock).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      orderBy: { updatedAt: 'desc' },
    });
    expect(findFirstMock).toHaveBeenCalledWith({
      where: { id: 'address-1', tenantId: 'tenant-1' },
    });
  });

  it('updates a tenant-scoped address and trims supplied values', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });

    await expect(service.update('tenant-1', 'address-1', {
      street1: ' 20 avenue des Lilas ',
      city: ' Lyon ',
      note: '  Digicode  ',
    })).resolves.toEqual({ count: 1 });

    expect(updateManyMock).toHaveBeenCalledWith({
      where: { id: 'address-1', tenantId: 'tenant-1' },
      data: {
        street1: '20 avenue des Lilas',
        street2: undefined,
        postalCode: undefined,
        city: 'Lyon',
        region: undefined,
        countryCode: undefined,
        latitude: undefined,
        longitude: undefined,
        accessCode: undefined,
        floor: undefined,
        apartment: undefined,
        note: 'Digicode',
      },
    });
  });

  it('deletes only the requested address within the tenant', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    await expect(service.delete('tenant-1', 'address-1')).resolves.toEqual({ count: 1 });
    expect(deleteManyMock).toHaveBeenCalledWith({
      where: { id: 'address-1', tenantId: 'tenant-1' },
    });
  });
});
