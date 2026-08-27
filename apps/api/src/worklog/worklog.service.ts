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

  async createItem(tenantId: string, workLogId: string, dto: CreateWorkLogItemDto) {
    const workLog = await this.prisma.workLog.findFirst({
      where: { id: workLogId, tenantId },
      select: { id: true, workOrderId: true, items: { select: { position: true } } },
    });

    if (!workLog) {
      throw new BadRequestException('Fiche de suivi introuvable pour ce tenant.');
    }

    if (dto.workOrderItemId) {
      const workOrderItem = await this.prisma.workOrderItem.findFirst({
        where: { id: dto.workOrderItemId, workOrder: { tenantId, id: workLog.workOrderId } },
        select: { id: true },
      });
      if (!workOrderItem) throw new BadRequestException('Étape de chantier introuvable pour cette fiche.');
    }

    const quantity = Number(dto.quantity);
    const unitCost = Number(dto.unitCost);
    const baseQuantity = Number(dto.baseQuantity ?? 1);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitCost) || !Number.isFinite(baseQuantity) || baseQuantity <= 0) {
      throw new BadRequestException('Quantité et coût unitaire invalides.');
    }

    return this.prisma.workLogItem.create({
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
  }
}