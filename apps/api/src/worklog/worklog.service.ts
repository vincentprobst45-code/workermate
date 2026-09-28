import { BadRequestException, Injectable } from '@nestjs/common';
import { LineItemType } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateWorkLogDto } from './create-worklog.dto';
import { CreateWorkLogItemDto } from './create-worklog-item.dto';

@Injectable()
export class WorkLogService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateWorkLogDto) {
    const [project, workOrder] = await Promise.all([
      this.prisma.project.findFirst({ where: { id: dto.projectId, tenantId }, select: { id: true } }),
      this.prisma.workOrder.findFirst({ where: { id: dto.workOrderId, tenantId }, select: { id: true, projectId: true } }),
    ]);

    if (!project) throw new BadRequestException('Projet introuvable pour ce tenant.');
    if (!workOrder || workOrder.projectId !== project.id) {
      throw new BadRequestException('Chantier introuvable ou non associé au projet.');
    }

    return this.prisma.workLog.create({
      data: {
        tenantId,
        projectId: project.id,
        workOrderId: workOrder.id,
        date: new Date(dto.date),
        title: dto.title?.trim() || undefined,
        description: dto.description?.trim() || undefined,
        timePlannedMinutes: dto.timePlannedMinutes,
        timeSpentMinutes: dto.timeSpentMinutes,
      },
    });
  }

  async findAll(tenantId: string, workOrderId?: string) {
    return this.prisma.workLog.findMany({
      where: { tenantId, workOrderId },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateWorkLogDto>) {
    const result = await this.prisma.workLog.updateMany({
      where: { id, tenantId },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        timePlannedMinutes: dto.timePlannedMinutes,
        timeSpentMinutes: dto.timeSpentMinutes,
      },
    });
    if (!result.count) throw new BadRequestException('Fiche de suivi introuvable.');
    return this.prisma.workLog.findFirst({ where: { id, tenantId }, include: { items: { orderBy: { position: 'asc' } } } });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const workLog = await tx.workLog.findFirst({ where: { id, tenantId }, include: { items: { include: { stockMovements: { where: { reversedMovementId: null } } } } } });
      if (!workLog) throw new BadRequestException('Fiche de suivi introuvable.');
      for (const item of workLog.items) {
        for (const movement of item.stockMovements) {
          if (movement.direction === 'OUT' && movement.reason === 'CONSUMPTION') {
            await tx.stockItem.update({ where: { id: movement.stockItemId }, data: { quantityOnHand: { increment: movement.quantity } } });
            await tx.stockMovement.create({ data: { tenantId, stockItemId: movement.stockItemId, direction: 'IN', reason: 'REVERSAL', quantity: movement.quantity, unitCode: movement.unitCode, unitCost: movement.unitCost, totalCost: movement.totalCost, reversedMovementId: movement.id, workLogItemId: item.id } });
          }
        }
      }
      return tx.workLog.delete({ where: { id } });
    });
  }

  async updateItem(tenantId: string, workLogId: string, itemId: string, dto: Partial<CreateWorkLogItemDto>) {
    const existing = await this.prisma.workLogItem.findFirst({ where: { id: itemId, workLogId, workLog: { tenantId } }, include: { stockMovements: { where: { reversedMovementId: null } } } });
    if (!existing) throw new BadRequestException('Étape de suivi introuvable.');
    const quantity = Number(dto.quantity ?? existing.quantity);
    const baseQuantity = Number(dto.baseQuantity ?? existing.baseQuantity);
    const unitCost = Number(dto.unitCost ?? existing.unitCost);
    if (!Number.isFinite(quantity) || !Number.isFinite(baseQuantity) || baseQuantity <= 0 || !Number.isFinite(unitCost)) throw new BadRequestException('Quantité et coût unitaire invalides.');
    return this.prisma.$transaction(async (tx) => {
      for (const movement of existing.stockMovements) {
        if (movement.direction === 'OUT' && movement.reason === 'CONSUMPTION') {
          await tx.stockItem.update({ where: { id: movement.stockItemId }, data: { quantityOnHand: { increment: movement.quantity } } });
          await tx.stockMovement.create({ data: { tenantId, stockItemId: movement.stockItemId, direction: 'IN', reason: 'REVERSAL', quantity: movement.quantity, unitCode: movement.unitCode, unitCost: movement.unitCost, totalCost: movement.totalCost, reversedMovementId: movement.id, workLogItemId: existing.id } });
        }
      }
      const updated = await tx.workLogItem.update({ where: { id: existing.id }, data: { title: dto.title?.trim(), description: dto.description?.trim(), quantity, baseQuantity, unitCode: dto.unitCode?.trim(), unitLabel: dto.unitLabel?.trim() || dto.unit?.trim(), reference: dto.reference?.trim(), unitCost, purchaseVatRate: dto.purchaseVatRate === undefined ? undefined : Number(dto.purchaseVatRate), totalCost: (quantity / baseQuantity) * unitCost, type: dto.type } });
      const previousMovement = existing.stockMovements.find((movement) => movement.direction === 'OUT' && movement.reason === 'CONSUMPTION');
      if (previousMovement) {
        const consumedQuantity = quantity / baseQuantity;
        const unitStockCost = previousMovement.unitCost === null ? null : Number(previousMovement.unitCost);
        await tx.stockItem.update({ where: { id: previousMovement.stockItemId }, data: { quantityOnHand: { decrement: consumedQuantity } } });
        await tx.stockMovement.create({ data: { tenantId, stockItemId: previousMovement.stockItemId, direction: 'OUT', reason: 'CONSUMPTION', quantity: consumedQuantity, unitCode: previousMovement.unitCode, unitCost: unitStockCost, totalCost: unitStockCost === null ? null : Math.round(consumedQuantity * unitStockCost * 100) / 100, workLogItemId: updated.id } });
      }
      return updated;
    });
  }

  async deleteItem(tenantId: string, workLogId: string, itemId: string) {
    const item = await this.prisma.workLogItem.findFirst({ where: { id: itemId, workLogId, workLog: { tenantId } }, include: { stockMovements: { where: { reversedMovementId: null } } } });
    if (!item) throw new BadRequestException('Étape de suivi introuvable.');
    return this.prisma.$transaction(async (tx) => {
      for (const movement of item.stockMovements) {
        if (movement.direction === 'OUT' && movement.reason === 'CONSUMPTION') {
          await tx.stockItem.update({ where: { id: movement.stockItemId }, data: { quantityOnHand: { increment: movement.quantity } } });
          await tx.stockMovement.create({ data: { tenantId, stockItemId: movement.stockItemId, direction: 'IN', reason: 'REVERSAL', quantity: movement.quantity, unitCode: movement.unitCode, unitCost: movement.unitCost, totalCost: movement.totalCost, reversedMovementId: movement.id, workLogItemId: item.id } });
        }
      }
      return tx.workLogItem.delete({ where: { id: item.id } });
    });
  }

  async createItem(tenantId: string, workLogId: string, dto: CreateWorkLogItemDto) {
    const workLog = await this.prisma.workLog.findFirst({
      where: { id: workLogId, tenantId },
      select: { id: true, workOrderId: true, items: { select: { position: true } } },
    });

    if (!workLog) {
      throw new BadRequestException('Fiche de suivi introuvable pour ce tenant.');
    }

    let workOrderItem: { id: string; sellerItemIdentifier: string | null } | null = null;
    if (dto.workOrderItemId) {
      workOrderItem = await this.prisma.workOrderItem.findFirst({
        where: { id: dto.workOrderItemId, workOrder: { tenantId, id: workLog.workOrderId } },
        select: { id: true, sellerItemIdentifier: true },
      });
      if (!workOrderItem) throw new BadRequestException('Étape de chantier introuvable pour cette fiche.');
    }

    const quantity = Number(dto.quantity);
    const unitCost = Number(dto.unitCost);
    const baseQuantity = Number(dto.baseQuantity ?? 1);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitCost) || !Number.isFinite(baseQuantity) || baseQuantity <= 0) {
      throw new BadRequestException('Quantité et coût unitaire invalides.');
    }

    return this.prisma.$transaction(async (tx) => {
      const workLogItem = await tx.workLogItem.create({
        data: {
          workLogId: workLog.id,
          workOrderItemId: dto.workOrderItemId || undefined,
          position: workLog.items.reduce((max, item) => Math.max(max, item.position), -1) + 1,
          reference: dto.reference?.trim() || undefined,
          title: dto.title.trim(),
          description: dto.description?.trim() || undefined,
          quantity,
          unitCode: dto.unitCode?.trim() || 'C62',
          unitLabel: dto.unitLabel?.trim() || dto.unit?.trim() || undefined,
          baseQuantity,
          baseQuantityUnitCode: dto.baseQuantityUnitCode?.trim() || undefined,
          unitCost,
          purchaseVatRate: dto.purchaseVatRate !== undefined ? Number(dto.purchaseVatRate) : undefined,
          totalCost: (quantity / baseQuantity) * unitCost,
          type: dto.type ?? LineItemType.OTHER,
        },
      });

      const catalogReference = workOrderItem?.sellerItemIdentifier || dto.reference?.trim();
      if (catalogReference) {
        const catalogItem = await tx.catalogItem.findFirst({
          where: { tenantId, reference: catalogReference },
          select: { id: true, trackStock: true, unitCode: true },
        });

        if (catalogItem?.trackStock) {
          const stockItem = await tx.stockItem.findUnique({
            where: { catalogItemId: catalogItem.id },
            select: { id: true, averageUnitCost: true },
          });
          if (!stockItem) throw new BadRequestException('Stock introuvable pour cet article suivi.');

          const consumedQuantity = quantity / baseQuantity;
          const unitStockCost = stockItem.averageUnitCost === null ? null : Number(stockItem.averageUnitCost);
          await tx.stockItem.update({
            where: { id: stockItem.id },
            data: { quantityOnHand: { decrement: consumedQuantity } },
          });
          await tx.stockMovement.create({
            data: {
              tenantId,
              stockItemId: stockItem.id,
              direction: 'OUT',
              reason: 'CONSUMPTION',
              quantity: consumedQuantity,
              unitCode: catalogItem.unitCode,
              unitCost: unitStockCost,
              totalCost: unitStockCost === null ? null : Math.round(consumedQuantity * unitStockCost * 100) / 100,
              workLogItemId: workLogItem.id,
            },
          });
        }
      }

      return workLogItem;
    });
  }
}