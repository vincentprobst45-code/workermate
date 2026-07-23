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
      OR: [
        { tenants: { some: { id: tenantId } } },
        { customers: { some: { tenantId } } },
        { projects: { some: { tenantId } } },
        { calendarevents: { some: { tenantId } } },
      ],
    };
  }

  async create(tenantId: string, dto: CreateCalendarEventDto, user?: User) {
    this.debug(`create() tenantId=${tenantId}`);
    if (!tenantId) {
      this.logger.warn('create() called without tenantId');
      throw new Error('tenantId is required');
    }
  const {  addressMode, addressId, address, projectId, customerId, ...calendarEventData } = dto;

  this.logger.debug("lodebut");
  this.logger.debug(calendarEventData);
  this.logger.debug(addressId);
  this.logger.debug(address);
  this.logger.debug("lolfind");


  // if (addressId && this.hasAddress(address)) {
  //   throw new BadRequestException(
  //     'Vous devez fournir soit addressId, soit une nouvelle adresse.',
  //   );
  // }

  const data: Prisma.CalendarEventCreateInput = {
    title: calendarEventData.title,
    description: calendarEventData.description,
    startDate: new Date(calendarEventData.startDate),
    endDate: new Date(calendarEventData.endDate),
    color: calendarEventData.color,
    notes: calendarEventData.notes,
    tenant: {
      connect: {
        id: tenantId,
      },
    },
  };

  if (projectId) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, tenantId },
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

    if (!project) {
      throw new BadRequestException('Projet introuvable pour ce tenant.');
    }

    data.project = { connect: { id: project.id } };
    data.projectName = project.title;

    if (!customerId && project.customerId && project.customer) {
      data.customer = { connect: { id: project.customerId } };
      data.customerName = this.formatCustomerName(project.customer);
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
    data.customerName = this.formatCustomerName(customer);
  }

  if (user?.id) {
    const fullName = [user.firstname, user.lastname]
      .filter((value): value is string => Boolean(value && value.trim()))
      .map((value) => value.trim())
      .join(' ');

    data.createdBy = {
      connect: {
        id: user.id,
      },
    };
    data.createdByName = fullName || user.email;
  }

  // const data: Prisma.CalendarEventCreateInput = {
  //   ...calendarEventData,
  //   tenant: {
  //     connect: {
  //       id: tenantId,
  //     },
  //   },
  // };

  if(addressMode === 'existing') {
    if(addressId == undefined || addressId == null) {
      throw new BadRequestException(
        "Id d'adresse existante invalide.",
      );
    } else if(addressId) {
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

      data.address = {
        connect: {
          id: existingAddress.id,
        },
      };
    }
  } else if (addressMode === 'new') {
      if(address == undefined || address == null) {
        throw new BadRequestException(
          'Nouvelle addresse invalide.',
        );
      }

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
        },
      };
      data.addressName = this.formatAddressName(address);
  }

  // if (addressId) {
  //   const existingAddress = await this.prisma.address.findFirst({
  //     where: this.tenantScopedAddressWhere(tenantId, addressId),
  //     select: {
  //       id: true,
  //       street1: true,
  //       postalCode: true,
  //       city: true,
  //     },
  //   });

  //   if (!existingAddress) {
  //     throw new BadRequestException('Adresse introuvable pour ce tenant.');
  //   }

  //   data.address = {
  //     connect: {
  //       id: existingAddress.id,
  //     },
  //   };
  //   data.addressName = this.formatAddressName(existingAddress);
  // } else if (this.hasAddress(address)) {
  //   if (!address?.street1?.trim() || !address?.postalCode?.trim() || !address?.city?.trim()) {
  //     throw new BadRequestException("Rue, code postal et ville obligatoires.");
  //   }

  //   data.address = {
  //     create: {
  //       street1: address.street1?.trim(),
  //       street2: address.street2?.trim(),
  //       postalCode: address.postalCode?.trim(),
  //       city: address.city?.trim(),
  //       countryCode: address.countryCode?.trim(),
  //     },
  //   };
  //   data.addressName = this.formatAddressName(address);
  // }

    const result = await this.prisma.calendarEvent.create({ data });

    this.debug(`CalendarEvent created id=${result.id}`);
    return result;
  }

  async findAll(tenantId: string) {
    
    const results = await this.prisma.calendarEvent.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
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

    const { addressId, address, projectId, customerId, ...calendarEventData } = dto;

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
    };

    if (projectId !== undefined) {
      if (!projectId) {
        data.project = { disconnect: true };
        data.projectName = null;
      } else {
        const project = await this.prisma.project.findFirst({
          where: { id: projectId, tenantId },
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

        if (!project) {
          throw new BadRequestException('Projet introuvable pour ce tenant.');
        }

        data.project = { connect: { id: project.id } };
        data.projectName = project.title;

        // Keep customer snapshot in sync with the selected project when customerId is not explicitly sent.
        if (customerId === undefined) {
          if (project.customerId && project.customer) {
            data.customer = { connect: { id: project.customerId } };
            data.customerName = this.formatCustomerName(project.customer);
          } else {
            data.customer = { disconnect: true };
            data.customerName = null;
          }
        }
      }
    }

    if (customerId !== undefined) {
      if (!customerId) {
        data.customer = { disconnect: true };
        data.customerName = null;
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
        data.customerName = this.formatCustomerName(customer);
      }
    }

    if (addressId !== undefined) {
      if (!addressId) {
        data.address = { disconnect: true };
        data.addressName = null;
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
        data.addressName = this.formatAddressName(existingAddress);
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
        },
      };
      data.addressName = this.formatAddressName(address);
    }

    const result = await this.prisma.calendarEvent.updateMany({
      where: { id, tenantId },
      data,
    });
    this.debug(`Updated ${result.count} calendarEvent(s)`);
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
