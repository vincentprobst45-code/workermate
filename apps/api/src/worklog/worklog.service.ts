import { BadRequestException, Injectable } from '@nestjs/common';
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
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async createItem(tenantId: string, workLogId: string, dto: CreateWorkLogItemDto) {
    const workLog = await this.prisma.workLog.findFirst({
      where: { id: workLogId, tenantId },
      select: { id: true },
    });

    if (!workLog) {
      throw new BadRequestException('Fiche de suivi introuvable pour ce tenant.');
    }

    const quantity = Number(dto.quantity);
    const unitCost = Number(dto.unitCost);
    if (!Number.isFinite(quantity) || !Number.isFinite(unitCost)) {
      throw new BadRequestException('Quantité et coût unitaire invalides.');
    }

    return this.prisma.workLogItem.create({
      data: {
        workLogId: workLog.id,
        title: dto.title.trim(),
        description: dto.description?.trim() || undefined,
        quantity,
        unit: dto.unit?.trim() || undefined,
        unitCost,
        totalCost: quantity * unitCost,
        type: dto.type,
      },
    });
  }
}