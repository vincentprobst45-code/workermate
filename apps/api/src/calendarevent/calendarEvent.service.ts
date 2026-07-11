import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCalendarEventDto } from './create-calendarEvent.dto'
import { CreateAddressDto } from 'src/address/create-address.dto';
import { Prisma } from '@prisma/client';

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

  async create(tenantId: string, dto: CreateCalendarEventDto) {
    this.debug(`create() tenantId=${tenantId}`);
    if (!tenantId) {
      this.logger.warn('create() called without tenantId');
      throw new Error('tenantId is required');
    }
  const { addressId, address, ...calendarEventData } = dto;

  if (addressId && this.hasAddress(address)) {
    throw new BadRequestException(
      'Vous devez fournir soit addressId, soit une nouvelle adresse.',
    );
  }

  const data: Prisma.CalendarEventCreateInput = {
    ...calendarEventData,
    tenant: {
      connect: {
        id: tenantId,
      },
    },
  };

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
      },
    };
  }
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
    const result = await this.prisma.calendarEvent.updateMany({
      where: { id, tenantId },
      data: dto,
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
