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

    const { addressId, address, projectItems, ...projectData } = dto;
    const year = new Date().getFullYear();
    const reference = `CH-${year}-${projectData.title}`;

    const data: Prisma.ProjectCreateInput = {
      title: projectData.title,
      description: projectData.description,
      startDate: projectData.startDate
        ? new Date(projectData.startDate)
        : undefined,
      endDate: projectData.endDate
        ? new Date(projectData.endDate)
        : undefined,
      // startDate: projectData.startDate && new Date(projectData.startDate),
      // endDate: projectData.endDate && new Date(projectData.endDate),
      status: projectData.status
        ? projectData.status
        : 'DRAFT',
      // ...projectData,
      reference,
      tenant: {
        connect: { id: tenantId },
      },
      // customer: {
      //   connect: { id: dto.customerId },
      // },
    };

    // ProjectItems
    // if (projectItems?.length) {
    //   data.items = {
    //     create: projectItems,
    //   };
    // }
    if (projectItems?.length) {
      data.items = {
        create: projectItems.map((item) => ({
          type: item.type,
          position: item.position,

          title: item.title,
          description: item.description,

          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,

          vatRate: item.vatRate,
        })),
      };
    }

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
}console.log(JSON.stringify(projectItems, null, 2));
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
      include: {
        items: true,
        address: true,
        customer: true,
      },
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
