import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCatalogItemDto } from './create-catalog-item.dto';

@Injectable()
export class CatalogItemService {
  constructor(private prisma: PrismaService) {}

  private normalizeOptionalString(value?: string | null): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private toNumber(value: unknown, fallback: number): number {
    if (value === null || value === undefined) {
      return fallback;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  async create(tenantId: string, dto: CreateCatalogItemDto) {
    const data: Prisma.CatalogItemCreateInput = {
      tenant: {
        connect: {
          id: tenantId,
        },
      },
      type: dto.type,
      reference: this.normalizeOptionalString(dto.reference),
      title: dto.title.trim(),
      description: this.normalizeOptionalString(dto.description),
      isActive: dto.isActive ?? true,
      defaultQuantity: this.toNumber(dto.defaultQuantity, 1),
      unitCode: dto.unitCode?.trim() || 'C62',
      unitLabel: this.normalizeOptionalString(dto.unitLabel ?? dto.unit),
      baseQuantity: this.toNumber(dto.baseQuantity, 1),
      baseQuantityUnitCode: this.normalizeOptionalString(dto.baseQuantityUnitCode),
      unitPrice: this.toNumber(dto.unitPrice, 0),
      unitCost: dto.unitCost !== undefined ? this.toNumber(dto.unitCost, 0) : undefined,
      purchaseVatRate:
        dto.purchaseVatRate !== undefined ? this.toNumber(dto.purchaseVatRate, 0) : undefined,
      vatRate: dto.vatRate !== undefined ? this.toNumber(dto.vatRate, 0) : undefined,
      vatCategory: dto.vatCategory ?? 'STANDARD',
    };

    return this.prisma.catalogItem.create({ data });
  }

  async findAll(tenantId: string) {
    return this.prisma.catalogItem.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const item = await this.prisma.catalogItem.findFirst({
      where: { id, tenantId },
    });

    if (!item) {
      throw new NotFoundException('Article catalogue introuvable pour ce tenant.');
    }

    return item;
  }

  async update(tenantId: string, id: string, dto: Partial<CreateCatalogItemDto>) {
    const data: Prisma.CatalogItemUpdateManyMutationInput = {
      type: dto.type,
      reference: dto.reference !== undefined ? this.normalizeOptionalString(dto.reference) : undefined,
      title: dto.title?.trim(),
      description: dto.description !== undefined ? this.normalizeOptionalString(dto.description) : undefined,
      isActive: dto.isActive,
      defaultQuantity:
        dto.defaultQuantity !== undefined ? this.toNumber(dto.defaultQuantity, 1) : undefined,
      unitCode: dto.unitCode?.trim() || (dto.unit !== undefined ? 'C62' : undefined),
      unitLabel: dto.unitLabel !== undefined || dto.unit !== undefined
        ? this.normalizeOptionalString(dto.unitLabel ?? dto.unit)
        : undefined,
      baseQuantity: dto.baseQuantity !== undefined ? this.toNumber(dto.baseQuantity, 1) : undefined,
      baseQuantityUnitCode: dto.baseQuantityUnitCode !== undefined
        ? this.normalizeOptionalString(dto.baseQuantityUnitCode)
        : undefined,
      unitPrice: dto.unitPrice !== undefined ? this.toNumber(dto.unitPrice, 0) : undefined,
      unitCost: dto.unitCost !== undefined ? this.toNumber(dto.unitCost, 0) : undefined,
      purchaseVatRate:
        dto.purchaseVatRate !== undefined ? this.toNumber(dto.purchaseVatRate, 0) : undefined,
      vatRate: dto.vatRate !== undefined ? this.toNumber(dto.vatRate, 0) : undefined,
      vatCategory: dto.vatCategory,
    };

    return this.prisma.catalogItem.updateMany({
      where: { id, tenantId },
      data,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.catalogItem.deleteMany({
      where: { id, tenantId },
    });
  }
}
