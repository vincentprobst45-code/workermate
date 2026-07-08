import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export class CreateInvoiceDto {
  number!: string;
  amount!: number;
  customerId?: string;
  description?: string;
}

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateInvoiceDto) {
    return this.prisma.invoice.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string) {
    const results = await this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    return results;
  }

  async findOne(tenantId: string, id: string) {
    const results = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });
    return results

  }

  async update(tenantId: string, id: string, dto: Partial<CreateInvoiceDto>) {
    return this.prisma.invoice.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.invoice.deleteMany({
      where: { id, tenantId },
    });
  }
}