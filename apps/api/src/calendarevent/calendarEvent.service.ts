import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCalendarEventDto } from './create-calendarEvent.dto'
import { CreateAddressDto } from 'src/address/create-address.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class CalendarEventService {
  private readonly logger = new Logger(CalendarEventService.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production';

  constructor(private prisma: PrismaService) {}

  private debug(message: string) {
    if (this.isDebugEnabled) {
      this.logger.debug(message);
    }
  }

  private hasAddress(address?: CreateAddressDto ): boolean {
    if (!address) {
      return false;
    }

    return Object.values(address).some(
      (value) => typeof value === 'string' && value.trim() !== '',
    );
  }

  private formatCustomerName(customer: { firstName?: string | null; lastName?: string | null; company?: string | null }): string {
    const personName = [customer.firstName, customer.lastName]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim())
      .join(' ');

    return personName || customer.company?.trim() || '';
  }

  private formatAddressName(address: { street1?: string | null; postalCode?: string | null; city?: string | null }): string {
    return [address.street1, address.postalCode, address.city]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim())
      .join(' - ');
  }

  private tenantScopedAddressWhere(tenantId: string, id: string): Prisma.AddressWhereInput {
    return {
      id,
      tenantId,
    };
  }

  async create(tenantId: string, dto: CreateCalendarEventDto, user?: User) {
    this.debug(`create() tenantId=${tenantId}`);
    if (!tenantId) {
      this.logger.warn('create() called without tenantId');
      throw new Error('tenantId is required');
    }
  const { addressId, address, workOrderId, customerId, projectId, ...calendarEventData } = dto;
  
  if (addressId && this.hasAddress(address)) {
    throw new BadRequestException(
      'Vous devez fournir soit addressId, soit une nouvelle adresse.',
    );
  }

  const data: Prisma.CalendarEventCreateInput = {
    title: calendarEventData.title,
    description: calendarEventData.description,
    startDate: new Date(calendarEventData.startDate),
    endDate: new Date(calendarEventData.endDate),
    type: calendarEventData.type,
    color: calendarEventData.color,
    notes: calendarEventData.notes,
    tenant: {
      connect: {
        id: tenantId,
      },
    },
  };

  if (workOrderId) {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: { id: workOrderId, tenantId },
      select: {
        id: true,
        title: true,
        customerId: true,
        customer: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new BadRequestException('Chantier introuvable pour ce tenant.');
    }

    data.workOrder = { connect: { id: workOrder.id } };

    if (!customerId && workOrder.customerId && workOrder.customer) {
      data.customer = { connect: { id: workOrder.customerId } };
    }
  }

  if (customerId) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
      },
    });

    if (!customer) {
      throw new BadRequestException('Client introuvable pour ce tenant.');
    }

    data.customer = { connect: { id: customer.id } };
  }

  if (projectId) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true },
    });

    if (!project) {
      throw new BadRequestException('Projet introuvable pour ce tenant.');
    }

    data.project = { connect: { id: project.id } };
  }

  if (user?.id) {
    // const fullName = [user.firstname, user.lastname]
    //   .filter((value): value is string => Boolean(value && value.trim()))
    //   .map((value) => value.trim())
    //   .join(' ');

    data.createdBy = {
      connect: {
        id: user.id,
      },
    };
    // data.createdByName = fullName || user.email;
  }

  // const data: Prisma.CalendarEventCreateInput = {
  //   ...calendarEventData,
  //   tenant: {
  //     connect: {
  //       id: tenantId,
  //     },
  //   },
  // // };

  // if(addressMode === 'existing') {
  //   if(addressId == undefined || addressId == null) {
  //     throw new BadRequestException(
  //       "Id d'adresse existante invalide.",
  //     );
  //   } else if(addressId) {
  //     const existingAddress = await this.prisma.address.findFirst({
  //       where: this.tenantScopedAddressWhere(tenantId, addressId),
  //       select: {
  //         id: true,
  //         street1: true,
  //         postalCode: true,
  //         city: true,
  //       },
  //     });

  //     if (!existingAddress) {
  //       throw new BadRequestException('Adresse introuvable pour ce tenant.');
  //     }

  //     data.address = {
  //       connect: {
  //         id: existingAddress.id,
  //       },
  //     };
  //   }
  // } else if (addressMode === 'new') {
  //     if(address == undefined || address == null) {
  //       throw new BadRequestException(
  //         'Nouvelle addresse invalide.',
  //       );
  //     }
  if (addressId) {
    data.address = {
      connect: {
        id: addressId,
      },
    };
  } else if (this.hasAddress(address)) {
    if (!address?.street1?.trim() || !address?.postalCode?.trim() || !address?.city?.trim()) {
      throw new BadRequestException("Rue, code postal et ville obligatoires.");
    }
    data.address = {
      create: {
        street1: address.street1?.trim(),
        street2: address.street2?.trim(),
        postalCode: address.postalCode?.trim(),
        city: address.city?.trim(),
        countryCode: address.countryCode?.trim(),
        tenant: {
          connect: {
            id: tenantId,
          },
        },
      },
    };
  }

    // const result = await this.prisma.calendarEvent.create({ data });
    const result = await this.prisma.calendarEvent.create({
      data,
      include: {
        address: {
          select: {
            id: true,
            street1: true,
            postalCode: true,
            city: true,
          },
        },
      },
    });
    this.debug(`CalendarEvent created id=${result.id}`);
    return result;
  }

  async findAll(tenantId: string, start?: string, end?: string, projectId?: string) {
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new BadRequestException('start must be a valid date.');
    }

    if (endDate && Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('end must be a valid date.');
    }

    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('start must be before end.');
    }

    const dateFilter = startDate || endDate
      ? {
          ...(startDate ? { endDate: { gt: startDate } } : {}),
          ...(endDate ? { startDate: { lt: endDate } } : {}),
        }
      : {};

    const results = await this.prisma.calendarEvent.findMany({
      where: { tenantId, ...(projectId ? { projectId } : {}), ...dateFilter },
      orderBy: { startDate: 'asc' },
    });

    return results;
  }

  async findOne(tenantId: string, id: string) {
    this.debug(`findOne() tenantId=${tenantId} id=${id}`);
    const result = await this.prisma.calendarEvent.findFirst({
      where: { id, tenantId },
    });
    if (!result) {
      this.logger.warn(`CalendarEvent not found id=${id} tenantId=${tenantId}`);
    } else {
      this.debug(`CalendarEvent found id=${id}`);
    }
    return result;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateCalendarEventDto>) {
    this.debug(`update() tenantId=${tenantId} id=${id}`);

    const { addressId, address, workOrderId, customerId, ...calendarEventData } = dto;

    if (addressId && this.hasAddress(address)) {
      throw new BadRequestException(
        'Vous devez fournir soit addressId, soit une nouvelle adresse.',
      );
    }

    const data: Prisma.CalendarEventUpdateInput = {
      title: calendarEventData.title,
      description: calendarEventData.description,
      color: calendarEventData.color,
      notes: calendarEventData.notes,
      startDate:
        calendarEventData.startDate !== undefined
          ? new Date(calendarEventData.startDate)
          : undefined,
      endDate:
        calendarEventData.endDate !== undefined
          ? new Date(calendarEventData.endDate)
          : undefined,
      type: calendarEventData.type,
    };

    if (workOrderId !== undefined) {
      if (!workOrderId) {
        data.workOrder = { disconnect: true };
      } else {
        const workOrder = await this.prisma.workOrder.findFirst({
          where: { id: workOrderId, tenantId },
          select: {
            id: true,
            title: true,
            customerId: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
                company: true,
              },
            },
          },
        });

        if (!workOrder) {
          throw new BadRequestException('Chantier introuvable pour ce tenant.');
        }

        data.workOrder = { connect: { id: workOrder.id } };

        // Keep customer snapshot in sync with the selected workOrder when customerId is not explicitly sent.
        if (customerId === undefined) {
          if (workOrder.customerId && workOrder.customer) {
            data.customer = { connect: { id: workOrder.customerId } };
          } else {
            data.customer = { disconnect: true };
          }
        }
      }
    }

    if (customerId !== undefined) {
      if (!customerId) {
        data.customer = { disconnect: true };
      } else {
        const customer = await this.prisma.customer.findFirst({
          where: { id: customerId, tenantId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
          },
        });

        if (!customer) {
          throw new BadRequestException('Client introuvable pour ce tenant.');
        }

        data.customer = { connect: { id: customer.id } };
      }
    }

    if (addressId !== undefined) {
      if (!addressId) {
        data.address = { disconnect: true };
      } else {
        const existingAddress = await this.prisma.address.findFirst({
          where: this.tenantScopedAddressWhere(tenantId, addressId),
          select: {
            id: true,
            street1: true,
            postalCode: true,
            city: true,
          },
        });

        if (!existingAddress) {
          throw new BadRequestException('Adresse introuvable pour ce tenant.');
        }

        data.address = { connect: { id: existingAddress.id } };
      }
    } else if (this.hasAddress(address)) {
      if (!address?.street1?.trim() || !address?.postalCode?.trim() || !address?.city?.trim()) {
        throw new BadRequestException('Rue, code postal et ville obligatoires.');
      }

      data.address = {
        create: {
          street1: address.street1?.trim(),
          street2: address.street2?.trim(),
          postalCode: address.postalCode?.trim(),
          city: address.city?.trim(),
          countryCode: address.countryCode?.trim(),
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
      };
    }

    const result = await this.prisma.calendarEvent.update({
      where: { id, tenantId },
      data,
      include: {
        address: {
          select: {
            id: true,
            street1: true,
            postalCode: true,
            city: true,
          },
        },
      },
    });
    return result;
  }

  async delete(tenantId: string, id: string) {
    this.debug(`delete() tenantId=${tenantId} id=${id}`);
    const result = await this.prisma.calendarEvent.deleteMany({
      where: { id, tenantId },
    });
    this.debug(`Deleted ${result.count} calendarEvent(s)`);
    return result;
  }
}
