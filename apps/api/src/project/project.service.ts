import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export class CreateProjectDto {
  name!: string;
  description?: string;
  customerId?: string;
}

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: { ...dto, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.project.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    return this.prisma.project.findFirst({
      where: { id, tenantId },
    });
  }

  async update(tenantId: string, id: string, dto: Partial<CreateProjectDto>) {
    return this.prisma.project.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.project.deleteMany({
      where: { id, tenantId },
    });
  }
}
