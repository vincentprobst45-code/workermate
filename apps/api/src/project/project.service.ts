import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProjectDto } from './create-project.dto';
import { CreateAddressDto } from 'src/address/create-address.dto';


// export class CreateProjectDto {
//   name!: string;
//   description?: string;
//   customerId?: string;
// }

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  private hasAddress(address?: CreateAddressDto ): boolean {
    if (!address) {
      return false;
    }

    return Object.values(address).some(
      (value) => typeof value === 'string' && value.trim() !== '',
    );
  }

  async create(tenantId: string, dto: CreateProjectDto ) {

    const { addressId, address, ...projectData } = dto;

const data: Prisma.ProjectCreateInput = {
  ...projectData,
  tenant: {
    connect: { id: tenantId },
  },
  customer: {
    connect: { id: dto.customerId },
  },
};

if (addressId) {
  data.address = {
    connect: { id: addressId },
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
    const result = await this.prisma.project.create({ data });

    // this.debug(`Project created id=${result.id}`);
    return result;

    // return this.prisma.project.create({
    //   data: { ...dto, tenantId },
    // });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.project.findFirst({
      where: { id, tenantId },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateProjectDto>) {
    return this.prisma.project.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.project.deleteMany({
      where: { id, tenantId },
    });
  }
}
