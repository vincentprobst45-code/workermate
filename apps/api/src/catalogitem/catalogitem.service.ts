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
      title: dto.title.trim(),
      description: this.normalizeOptionalString(dto.description),
      defaultQuantity: this.toNumber(dto.defaultQuantity, 1),
      unit: this.normalizeOptionalString(dto.unit),
      unitPrice: this.toNumber(dto.unitPrice, 0),
      vatRate: this.toNumber(dto.vatRate, 0),
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
      title: dto.title?.trim(),
      description: dto.description !== undefined ? this.normalizeOptionalString(dto.description) : undefined,
      defaultQuantity:
        dto.defaultQuantity !== undefined ? this.toNumber(dto.defaultQuantity, 1) : undefined,
      unit: dto.unit !== undefined ? this.normalizeOptionalString(dto.unit) : undefined,
      unitPrice: dto.unitPrice !== undefined ? this.toNumber(dto.unitPrice, 0) : undefined,
      vatRate: dto.vatRate !== undefined ? this.toNumber(dto.vatRate, 0) : undefined,
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
