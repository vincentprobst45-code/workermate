import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PurchaseStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePurchaseDto, CreatePurchaseItemDto } from './create-purchase.dto';

@Injectable()
export class PurchaseService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(value: Date | string | undefined, fieldName: string): Date | undefined {
    if (!value) return undefined;
    const rawValue = value instanceof Date ? value.toISOString() : value;
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? `${rawValue}T00:00:00.000Z` : rawValue);
    if (Number.isNaN(date.getTime())) throw new BadRequestException(`${fieldName} doit être une date valide.`);
    return date;
  }

  findAll(tenantId: string) {
    return this.prisma.purchase.findMany({ where: { tenantId }, include: { supplier: true, items: { include: { catalogItem: true } } }, orderBy: { purchaseDate: 'desc' } });
  }

  async create(tenantId: string, dto: CreatePurchaseDto) {
    const items = dto.items ?? [];
    const supplier = dto.supplierId ? await this.prisma.supplier.findFirst({ where: { id: dto.supplierId, tenantId, archivedAt: null } }) : null;
    if (dto.supplierId && !supplier) throw new NotFoundException('Fournisseur introuvable.');
    const deductibleVatAmount = dto.deductibleVatAmount ?? items.reduce((sum, item) => sum + Number(item.deductibleVatAmount ?? 0), 0);
    const taxExclusiveAmount = dto.taxExclusiveAmount ?? items.reduce((sum, item) => sum + Number(item.taxExclusiveAmount), 0);
    const vatAmount = dto.vatAmount ?? items.reduce((sum, item) => sum + Number(item.vatAmount ?? 0), 0);
    const effectiveCostAmount = Number(dto.taxInclusiveAmount) - deductibleVatAmount;
    const purchaseDate = this.parseDate(dto.purchaseDate, 'purchaseDate');
    if (!purchaseDate) throw new BadRequestException('purchaseDate est obligatoire.');

    return this.prisma.$transaction(async (tx) => {
      const catalogItemIds = new Map<CreatePurchaseItemDto, string>();
      for (const item of items) {
        if (!item.addToStock) continue;
        if (Number(item.quantity) <= 0) throw new BadRequestException(`La quantité de stock de la ligne ${item.title} doit être supérieure à zéro.`);
        if (item.catalogItemMode === 'NEW') {
          const catalogItem = await tx.catalogItem.create({ data: {
            tenantId, type: item.type, title: item.title.trim(), description: item.description?.trim(),
            unitCode: item.unitCode, unitLabel: item.unitLabel?.trim(), defaultQuantity: item.quantity,
            baseQuantity: item.baseQuantity ?? 1, baseQuantityUnitCode: item.baseQuantityUnitCode,
            unitCost: (Number(item.taxInclusiveAmount) - Number(item.deductibleVatAmount ?? 0)) / Number(item.quantity),
            purchaseVatRate: item.vatRate, trackStock: true, vatCategory: 'STANDARD',
          } });
          catalogItemIds.set(item, catalogItem.id);
        } else {
          if (item.catalogItemMode !== 'EXISTING' || !item.catalogItemId) throw new BadRequestException('Choisissez un article catalogue existant ou Nouveau.');
          const catalogItem = await tx.catalogItem.findFirst({ where: { id: item.catalogItemId, tenantId } });
          if (!catalogItem) throw new NotFoundException('Article catalogue introuvable.');
          catalogItemIds.set(item, catalogItem.id);
        }
        const catalogItemId = catalogItemIds.get(item);
        if (!catalogItemId) throw new BadRequestException('La cible catalogue de la ligne est invalide.');
        const catalogItem = await tx.catalogItem.findUnique({ where: { id: catalogItemId } });
        if (!catalogItem) throw new NotFoundException('Article catalogue introuvable.');
        if (catalogItem.unitCode !== item.unitCode) throw new BadRequestException(`L'unité de la ligne ${item.title} ne correspond pas à l'article catalogue.`);
      }
      const purchase = await tx.purchase.create({ data: {
        tenantId, supplierId: supplier?.id, supplierName: supplier?.name ?? dto.supplierName?.trim(), label: dto.label?.trim(), purchaseDate,
        status: dto.status ?? PurchaseStatus.CONFIRMED, currency: dto.currency?.trim().toUpperCase() || 'EUR', taxExclusiveAmount, vatAmount,
        taxInclusiveAmount: dto.taxInclusiveAmount, deductibleVatAmount, effectiveCostAmount, paidAt: dto.paidAt, dueDate: dto.dueDate,
        paymentAccountId: dto.paymentAccountId, bankTransactionId: dto.bankTransactionId, notes: dto.notes?.trim(),
        items: items.length ? { create: items.map((item, position) => ({ position, catalogItemId: catalogItemIds.get(item), type: item.type, title: item.title.trim(), description: item.description?.trim(), quantity: item.quantity, unitCode: item.unitCode, unitLabel: item.unitLabel?.trim(), baseQuantity: item.baseQuantity ?? 1, baseQuantityUnitCode: item.baseQuantityUnitCode, unitPrice: item.unitPrice, taxExclusiveAmount: item.taxExclusiveAmount, vatRate: item.vatRate, vatAmount: item.vatAmount ?? 0, deductibleVatAmount: item.deductibleVatAmount ?? 0, taxInclusiveAmount: item.taxInclusiveAmount, effectiveCostAmount: Number(item.taxInclusiveAmount) - Number(item.deductibleVatAmount ?? 0), effectiveUnitCost: (Number(item.taxInclusiveAmount) - Number(item.deductibleVatAmount ?? 0)) / (item.quantity), projectId: item.projectId, workOrderId: item.workOrderId })) } : undefined,
      }, include: { items: true, supplier: true } });
      for (const item of items.filter((entry) => entry.addToStock)) {
        const purchaseItem = purchase.items.find((entry) => entry.position === items.indexOf(item));
        const catalogItemId = catalogItemIds.get(item);
        if (!purchaseItem || !catalogItemId) continue;
        const quantity = Number(item.quantity);
        const unitCost = (Number(item.taxInclusiveAmount) - Number(item.deductibleVatAmount ?? 0)) / quantity;
        const stock = await tx.stockItem.findUnique({ where: { tenantId_catalogItemId: { tenantId, catalogItemId } } });
        const previousQuantity = Number(stock?.quantityOnHand ?? 0);
        const previousCost = Number(stock?.averageUnitCost ?? 0);
        const nextQuantity = previousQuantity + quantity;
        const averageUnitCost = previousQuantity === 0 || stock?.averageUnitCost === null
          ? unitCost
          : ((previousQuantity * previousCost) + (quantity * unitCost)) / nextQuantity;
        const stockItem = stock
          ? await tx.stockItem.update({ where: { id: stock.id }, data: { quantityOnHand: nextQuantity, averageUnitCost } })
          : await tx.stockItem.create({ data: { tenantId, catalogItemId, quantityOnHand: quantity, averageUnitCost: unitCost } });
        await tx.catalogItem.update({ where: { id: catalogItemId }, data: { trackStock: true, unitCost: averageUnitCost } });
        await tx.stockMovement.create({ data: { tenantId, stockItemId: stockItem.id, direction: 'IN', reason: 'PURCHASE', quantity, unitCode: item.unitCode, unitCost, totalCost: Number(item.taxInclusiveAmount) - Number(item.deductibleVatAmount ?? 0), purchaseItemId: purchaseItem.id, occurredAt: purchaseDate } });
      }
      return purchase;
    });
  }
}
