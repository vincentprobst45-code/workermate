import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './create-customer.dto'
import { CreateAddressDto } from 'src/address/create-address.dto';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name);
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

  async create(tenantId: string, dto: CreateCustomerDto, user?: User) {
    this.debug(`create() tenantId=${tenantId}`);
    if (!tenantId) {
      this.logger.warn('create() called without tenantId');
      throw new Error('tenantId is required');
    }
  const { addressId, address, ...customerData } = dto;

  if (addressId && this.hasAddress(address)) {
    throw new BadRequestException(
      'Vous devez fournir soit addressId, soit une nouvelle adresse.',
    );
  }

  const data: Prisma.CustomerCreateInput = {
    ...customerData,
    tenant: {
      connect: {
        id: tenantId,
      },
    },
  };

  if (user?.id) {
    data.createdBy = {
      connect: {
        id: user.id,
      },
    };
    
    // const fullName = [user.firstname, user.lastname]
    //   .filter((value): value is string => Boolean(value && value.trim()))
    //   .map((value) => value.trim())
    //   .join(' ');
    // data.createdByName = fullName || user.email;
  }

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
    const result = await this.prisma.customer.create({ data });

    this.debug(`Customer created id=${result.id}`);
    return result;
  }

  async findAll(tenantId: string) {
    
    const results = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        phone: true,
        mobile: true,
        siret: true,
        vatNumber: true,
        notes:true,

        tenantId:true,
        createdById:true,
        createdAt:true,

  
        address: {
          select: {
            street1: true,
            postalCode: true,
            city: true,
          },
        },
      },
    });

    return results;
  }

  async findOne(tenantId: string, id: string) {
    this.debug(`findOne() tenantId=${tenantId} id=${id}`);
    const result = await this.prisma.customer.findFirst({
      where: {
         id, tenantId 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        phone: true,
        mobile: true,
        siret: true,
        vatNumber: true,
        notes:true,

        tenantId:true,
        createdById:true,
        createdAt:true,

        address: {
          select: {
            street1: true,
            postalCode: true,
            city: true,
          },
        },
      },
    });
    if (!result) {
      this.logger.warn(`Customer not found id=${id} tenantId=${tenantId}`);
    } else {
      this.debug(`Customer found id=${id}`);
    }
    return result;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateCustomerDto>) {
    this.debug(`update() tenantId=${tenantId} id=${id}`);
    const result = await this.prisma.customer.updateMany({
      where: { id, tenantId },
      data: dto,
    });
    this.debug(`Updated ${result.count} customer(s)`);
    return result;
  }

  async delete(tenantId: string, id: string) {
    this.debug(`delete() tenantId=${tenantId} id=${id}`);
    const result = await this.prisma.customer.deleteMany({
      where: { id, tenantId },
    });
    this.debug(`Deleted ${result.count} customer(s)`);
    return result;
  }
}
