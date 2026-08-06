import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { WorkOrderService } from './workorder.service';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateWorkOrderDto } from './create-workorder.dto';

@Controller('workOrders')
export class WorkOrderController {
  constructor(private workOrderService: WorkOrderService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateWorkOrderDto ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.workOrderService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.workOrderService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.workOrderService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateWorkOrderDto>) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.workOrderService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.workOrderService.delete(tenantId, id);
  }
}