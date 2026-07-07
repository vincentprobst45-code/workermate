import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export class CreateCustomerDto {
  firstname!: string;
  lastname?: string;
  company?: string;
}

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCustomerDto) {
    console.log('[CustomerService] create() called');
    console.log('[CustomerService] tenantId:', tenantId);
    console.log('[CustomerService] dto:', dto);
    if (!tenantId) {
      console.log('[CustomerService] ❌ ERROR: tenantId is undefined!');
      throw new Error('tenantId is required');
    }
    const result = await this.prisma.customer.create({
      data: {
        ...dto,
        tenantId,
      },
    });
    console.log('[CustomerService] ✅ Customer created:', result.id);
    return result;
  }

  async findAll(tenantId: string) {
    console.log('[CustomerService] findAll() called');
    console.log('[CustomerService] tenantId:', tenantId);
    if (!tenantId) {
      console.log('[CustomerService] ❌ ERROR: tenantId is undefined!');
      throw new Error('tenantId is required');
    }
    const results = await this.prisma.customer.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[CustomerService] ✅ Found ${results.length} customers`);
    return results;
  }

  async findOne(tenantId: string, id: string) {
    console.log('[CustomerService] findOne() called');
    console.log('[CustomerService] tenantId:', tenantId, 'id:', id);
    const result = await this.prisma.customer.findFirst({
      where: { id, tenantId },
    });
    if (!result) {
      console.log('[CustomerService] ❌ Customer not found');
    } else {
      console.log('[CustomerService] ✅ Customer found');
    }
    return result;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateCustomerDto>) {
    console.log('[CustomerService] update() called');
    console.log('[CustomerService] tenantId:', tenantId, 'id:', id);
    const result = await this.prisma.customer.updateMany({
      where: { id, tenantId },
      data: dto,
    });
    console.log('[CustomerService] ✅ Updated:', result.count, 'customer(s)');
    return result;
  }

  async delete(tenantId: string, id: string) {
    console.log('[CustomerService] delete() called');
    console.log('[CustomerService] tenantId:', tenantId, 'id:', id);
    const result = await this.prisma.customer.deleteMany({
      where: { id, tenantId },
    });
    console.log('[CustomerService] ✅ Deleted:', result.count, 'customer(s)');
    return result;
  }
}
