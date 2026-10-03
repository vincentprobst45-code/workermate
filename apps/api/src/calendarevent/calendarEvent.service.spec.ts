import { CalendarEventType } from '@prisma/client';
import type { PrismaService } from '../prisma.service';
import { CalendarEventService } from './calendarEvent.service';
import type { CreateCalendarEventDto } from './create-calendarEvent.dto';

describe('CalendarEventService', () => {
  const createMock = jest.fn();
  const findManyMock = jest.fn();
  const findFirstMock = jest.fn();
  const updateMock = jest.fn();
  const deleteManyMock = jest.fn();
  const workOrderFindFirstMock = jest.fn();
  const customerFindFirstMock = jest.fn();
  const projectFindFirstMock = jest.fn();
  const addressFindFirstMock = jest.fn();

  const prisma = {
    calendarEvent: {
      create: createMock,
      findMany: findManyMock,
      findFirst: findFirstMock,
      update: updateMock,
      deleteMany: deleteManyMock,
    },
    workOrder: { findFirst: workOrderFindFirstMock },
    customer: { findFirst: customerFindFirstMock },
    project: { findFirst: projectFindFirstMock },
    address: { findFirst: addressFindFirstMock },
  } as unknown as PrismaService;

  let service: CalendarEventService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CalendarEventService(prisma);
  });

  function dto(overrides: Partial<CreateCalendarEventDto> = {}): CreateCalendarEventDto {
    return {
      title: 'Visite client',
      startDate: new Date('2026-10-10T09:00:00.000Z'),
      endDate: new Date('2026-10-10T10:00:00.000Z'),
      type: CalendarEventType.CUSTOMER_APPOINTMENT,
      ...overrides,
    };
  }

  it('creates an event with dates, tenant, creator and valid associations', async () => {
    workOrderFindFirstMock.mockResolvedValue({
      id: 'workorder-1',
      title: 'Cuisine',
      customerId: 'customer-1',
      customer: { firstName: 'Jane', lastName: 'Doe', company: null },
    });
    customerFindFirstMock.mockResolvedValue({ id: 'customer-1' });
    projectFindFirstMock.mockResolvedValue({ id: 'project-1' });
    addressFindFirstMock.mockResolvedValue({ id: 'address-1' });
    createMock.mockResolvedValue({ id: 'event-1' });

    await service.create('tenant-1', dto({
      workOrderId: 'workorder-1',
      customerId: 'customer-1',
      projectId: 'project-1',
      addressId: 'address-1',
    }), { id: 'user-1' } as never);

    const createCall = (createMock.mock.calls as unknown[][])[0]?.[0] as {
      data: {
        startDate: Date;
        endDate: Date;
        tenant: { connect: { id: string } };
        createdBy: { connect: { id: string } };
        workOrder: { connect: { id: string } };
        customer: { connect: { id: string } };
        project: { connect: { id: string } };
        address: { connect: { id: string } };
      };
    };
    expect(createCall.data.startDate).toEqual(new Date('2026-10-10T09:00:00.000Z'));
    expect(createCall.data.endDate).toEqual(new Date('2026-10-10T10:00:00.000Z'));
    expect(createCall.data.tenant).toEqual({ connect: { id: 'tenant-1' } });
    expect(createCall.data.createdBy).toEqual({ connect: { id: 'user-1' } });
    expect(createCall.data.workOrder).toEqual({ connect: { id: 'workorder-1' } });
    expect(createCall.data.customer).toEqual({ connect: { id: 'customer-1' } });
    expect(createCall.data.project).toEqual({ connect: { id: 'project-1' } });
    expect(createCall.data.address).toEqual({ connect: { id: 'address-1' } });
  });

  it('rejects an empty tenant and conflicting address inputs', async () => {
    await expect(service.create('', dto())).rejects.toThrow('tenantId is required');
    await expect(service.create('tenant-1', dto({
      addressId: 'address-1',
      address: { street1: '1 rue A', postalCode: '75001', city: 'Paris' },
    }))).rejects.toThrow('soit addressId, soit une nouvelle adresse');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects associations that do not belong to the tenant', async () => {
    workOrderFindFirstMock.mockResolvedValue(null);
    await expect(service.create('tenant-1', dto({ workOrderId: 'foreign-workorder' }))).rejects.toThrow('Chantier introuvable');

    workOrderFindFirstMock.mockResolvedValue(undefined);
    customerFindFirstMock.mockResolvedValue(null);
    await expect(service.create('tenant-1', dto({ customerId: 'foreign-customer' }))).rejects.toThrow('Client introuvable');

    customerFindFirstMock.mockResolvedValue(undefined);
    projectFindFirstMock.mockResolvedValue(null);
    await expect(service.create('tenant-1', dto({ projectId: 'foreign-project' }))).rejects.toThrow('Projet introuvable');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects an incomplete new address', async () => {
    await expect(service.create('tenant-1', dto({
      address: { street1: '1 rue A', postalCode: '', city: 'Paris' },
    }))).rejects.toThrow('Rue, code postal et ville obligatoires.');
  });

  it('rejects an existing address that does not belong to the tenant', async () => {
    addressFindFirstMock.mockResolvedValue(null);

    await expect(service.create('tenant-1', dto({ addressId: 'foreign-address' })))
      .rejects.toThrow('Adresse introuvable pour ce tenant.');
    expect(createMock).not.toHaveBeenCalled();
  });

  it('builds date overlap filters and rejects invalid ranges', async () => {
    findManyMock.mockResolvedValue([]);
    await service.findAll('tenant-1', '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z', 'project-1');

    expect(findManyMock).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        tenantId: 'tenant-1',
        projectId: 'project-1',
        endDate: { gt: new Date('2026-10-01T00:00:00.000Z') },
        startDate: { lt: new Date('2026-10-31T00:00:00.000Z') },
      },
      orderBy: { startDate: 'asc' },
    }));

    await expect(service.findAll('tenant-1', 'invalid-date')).rejects.toThrow('start must be a valid date');
    await expect(service.findAll('tenant-1', '2026-11-01', '2026-10-01')).rejects.toThrow('start must be before end');
  });

  it('updates associations and disconnects them when empty', async () => {
    addressFindFirstMock.mockResolvedValue({ id: 'address-1' });
    updateMock.mockResolvedValue({ id: 'event-1' });

    await service.update('tenant-1', 'event-1', {
      customerId: '',
      workOrderId: '',
      addressId: 'address-1',
      startDate: '2026-10-11T09:00:00.000Z',
    });

    const updateCall = (updateMock.mock.calls as unknown[][])[0]?.[0] as {
      where: { id: string; tenantId: string };
      data: { customer: { disconnect: boolean }; workOrder: { disconnect: boolean }; address: { connect: { id: string } }; startDate: Date };
    };
    expect(updateCall.where).toEqual({ id: 'event-1', tenantId: 'tenant-1' });
    expect(updateCall.data.customer).toEqual({ disconnect: true });
    expect(updateCall.data.workOrder).toEqual({ disconnect: true });
    expect(updateCall.data.address).toEqual({ connect: { id: 'address-1' } });
    expect(updateCall.data.startDate).toEqual(new Date('2026-10-11T09:00:00.000Z'));
  });

  it('deletes only the requested event within the tenant', async () => {
    deleteManyMock.mockResolvedValue({ count: 1 });

    await expect(service.delete('tenant-1', 'event-1')).resolves.toEqual({ count: 1 });
    expect(deleteManyMock).toHaveBeenCalledWith({ where: { id: 'event-1', tenantId: 'tenant-1' } });
  });
});
