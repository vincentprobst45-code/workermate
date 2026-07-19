import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateAddressDto } from './create-address.dto';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  private tenantScopeWhere(tenantId: string): Prisma.AddressWhereInput {
    return {
      OR: [
        { tenants: { some: { id: tenantId } } },
        { customers: { some: { tenantId } } },
        { projects: { some: { tenantId } } },
        { calendarevents: { some: { tenantId } } },
      ],
    };
  }

  private toAddressCreateData(dto: CreateAddressDto): Prisma.AddressCreateInput {
    return {
      street1: dto.street1.trim(),
      street2: dto.street2?.trim() || undefined,
      postalCode: dto.postalCode.trim(),
      city: dto.city.trim(),
      region: dto.region?.trim() || undefined,
      countryCode: dto.countryCode?.trim() || 'FR',
      latitude: dto.latitude?.trim() || undefined,
      longitude: dto.longitude?.trim() || undefined,
      accessCode: dto.accessCode?.trim() || undefined,
      floor: dto.floor?.trim() || undefined,
      apartment: dto.apartment?.trim() || undefined,
      note: dto.note?.trim() || undefined,
    };
  }

  async create(tenantId: string, dto: CreateAddressDto) {
    const data = this.toAddressCreateData(dto);

    return this.prisma.address.create({
      data: {
        ...data,
        tenants: {
          connect: { id: tenantId },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.address.findMany({
      where: this.tenantScopeWhere(tenantId),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.address.findFirst({
      where: {
        id,
        ...this.tenantScopeWhere(tenantId),
      },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateAddressDto>) {
    const data: Prisma.AddressUpdateInput = {
      street1: dto.street1?.trim(),
      street2: dto.street2?.trim(),
      postalCode: dto.postalCode?.trim(),
      city: dto.city?.trim(),
      region: dto.region?.trim(),
      countryCode: dto.countryCode?.trim(),
      latitude: dto.latitude?.trim(),
      longitude: dto.longitude?.trim(),
      accessCode: dto.accessCode?.trim(),
      floor: dto.floor?.trim(),
      apartment: dto.apartment?.trim(),
      note: dto.note?.trim(),
    };

    return this.prisma.address.updateMany({
      where: {
        id,
        ...this.tenantScopeWhere(tenantId),
      },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.address.deleteMany({
      where: {
        id,
        ...this.tenantScopeWhere(tenantId),
      },
    });
  }
}
