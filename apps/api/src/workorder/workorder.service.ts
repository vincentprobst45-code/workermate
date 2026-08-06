import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { CreateWorkOrderDto } from './create-workorder.dto';
import { CreateAddressDto } from 'src/address/create-address.dto';


// export class CreateWorkOrderDto {
//   name!: string;
//   description?: string;
//   customerId?: string;
// }

@Injectable()
export class WorkOrderService {
  constructor(private prisma: PrismaService) {}

  private hasAddress(address?: CreateAddressDto ): boolean {
    if (!address) {
      return false;
    }

    return Object.values(address).some(
      (value) => typeof value === 'string' && value.trim() !== '',
    );
  }

  async create(tenantId: string, dto: CreateWorkOrderDto ) {

    console.log(dto)
    const { addressId, address, customerId, items, ...workOrderData } = dto;
    const year = new Date().getFullYear();
    const reference = `CH-${year}-${workOrderData.title}`;

    const data: Prisma.WorkOrderCreateInput = {
      title: workOrderData.title,
      description: workOrderData.description,
      startDate: workOrderData.startDate
        ? new Date(workOrderData.startDate)
        : undefined,
      endDate: workOrderData.endDate
        ? new Date(workOrderData.endDate)
        : undefined,
      // startDate: workOrderData.startDate && new Date(workOrderData.startDate),
      // endDate: workOrderData.endDate && new Date(workOrderData.endDate),
      status: workOrderData.status
        ? workOrderData.status
        : 'DRAFT',
      // ...workOrderData,
      reference,
      tenant: {
        connect: { id: tenantId },
      },
      // customer: {
      //   connect: { id: dto.customerId },
      // },
    };

    // WorkOrderItems
    // if (items?.length) {
    //   data.items = {
    //     create: items,
    //   };
    // }
    console.log(items)
    if (items?.length) {
      data.items = {
        create: items.map((item) => ({
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
            tenant: {
              connect: {
                id: tenantId,
              },
            },
          },
      };
    }

    if(customerId?.trim()){
      data.customer = {
        connect : { id: customerId},
      }
    }

    //const result = await this.prisma.workOrder.create({ data });
    const result = await this.prisma.workOrder.create({
      data,
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    return result;
    // this.debug(`WorkOrder created id=${result.id}`);

    // return this.prisma.workOrder.create({
    //   data: { ...dto, tenantId },
    // });
  }

  async findAll(tenantId: string) {
    return this.prisma.workOrder.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        address: true,
        customer: true,
      },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.workOrder.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        address: true,
        customer: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateWorkOrderDto>) {
    return this.prisma.workOrder.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.workOrder.deleteMany({
      where: { id, tenantId },
    });
  }
}
