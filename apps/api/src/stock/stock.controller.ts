import { Controller, Get, Req } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';

@Controller('stock')
export class StockController {
  constructor(private readonly prisma: PrismaService) {}
  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.prisma.stockItem.findMany({ where: { tenantId: requireTenantContext(req).tenant.id }, include: { catalogItem: true }, orderBy: { updatedAt: 'desc' } });
  }
}
