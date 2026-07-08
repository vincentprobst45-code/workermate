import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export class CreateCustomerDto {
  firstname!: string;
  lastname?: string;
  company?: string;
}

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

  async create(tenantId: string, dto: CreateCustomerDto) {
    this.debug(`create() tenantId=${tenantId}`);
    if (!tenantId) {
      this.logger.warn('create() called without tenantId');
      throw new Error('tenantId is required');
    }
    const result = await this.prisma.customer.create({
      data: {
        ...dto,
        tenantId,
      },
    });
    this.debug(`Customer created id=${result.id}`);
    return result;
  }

  async findAll(tenantId: string) {
    // this.debug(`findAll() tenantId=${tenantId}`);
    // if (!tenantId) {
    //   this.logger.warn('findAll() called without tenantId');
    //   throw new Error('tenantId is required');
    // }
    const results = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    // this.debug(`Found ${results.length} customers`);
    return results;
  }

  async findOne(tenantId: string, id: string) {
    this.debug(`findOne() tenantId=${tenantId} id=${id}`);
    const result = await this.prisma.customer.findFirst({
      where: { id, tenantId },
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
