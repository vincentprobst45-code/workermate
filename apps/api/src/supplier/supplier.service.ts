import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateSupplierDto } from './create-supplier.dto';

@Injectable()
export class SupplierService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.supplier.findMany({
      where: { tenantId, archivedAt: null },
      include: { _count: { select: { purchases: true, invoices: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { tenantId, id },
      include: { invoices: { orderBy: { issueDate: 'desc' }, take: 10 }, purchases: { orderBy: { purchaseDate: 'desc' }, take: 10 } },
    });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    return supplier;
  }

  async create(tenantId: string, dto: CreateSupplierDto) {
    const supplierCount = await this.prisma.supplier.count({ where: { tenantId } });
    const data: Prisma.SupplierUncheckedCreateInput = {
      tenantId,
      name: dto.name.trim(),
      reference: `FOU-${String(supplierCount + 1).padStart(4, '0')}`,
      legalName: dto.legalName?.trim() || undefined,
      sirenNumber: dto.sirenNumber?.trim() || undefined,
      siretNumber: dto.siretNumber?.trim() || undefined,
      vatNumber: dto.vatNumber?.trim() || undefined,
      contactName: dto.contactName?.trim() || undefined,
      email: dto.email?.trim() || undefined,
      phone: dto.phone?.trim() || undefined,
      website: dto.website?.trim() || undefined,
      street1: dto.street1?.trim() || undefined,
      street2: dto.street2?.trim() || undefined,
      postalCode: dto.postalCode?.trim() || undefined,
      city: dto.city?.trim() || undefined,
      countryCode: dto.countryCode?.trim().toUpperCase() || 'FR',
      notes: dto.notes?.trim() || undefined,
    };
    try {
      return await this.prisma.supplier.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const nextCount = await this.prisma.supplier.count({ where: { tenantId } });
        return this.prisma.supplier.create({ data: { ...data, reference: `FOU-${String(nextCount + 1).padStart(4, '0')}` } });
      }
      throw error;
    }
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.supplier.updateMany({ where: { tenantId, id, archivedAt: null }, data: { archivedAt: new Date() } });
    if (!result.count) throw new NotFoundException('Fournisseur introuvable.');
    return { success: true };
  }
}
