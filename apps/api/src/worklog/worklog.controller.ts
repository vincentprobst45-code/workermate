import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateWorkLogDto } from './create-worklog.dto';
import { CreateWorkLogItemDto } from './create-worklog-item.dto';
import { WorkLogService } from './worklog.service';

@Controller('worklogs')
export class WorkLogController {
  constructor(private workLogService: WorkLogService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateWorkLogDto) {
    return this.workLogService.create(requireTenantContext(req).tenant.id, dto);
  }

  @Post(':id/items')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  createItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: CreateWorkLogItemDto,
  ) {
    return this.workLogService.createItem(requireTenantContext(req).tenant.id, id, dto);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateWorkLogDto>) {
    return this.workLogService.update(requireTenantContext(req).tenant.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.workLogService.delete(requireTenantContext(req).tenant.id, id);
  }

  @Put(':id/items/:itemId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  updateItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string, @Body() dto: Partial<CreateWorkLogItemDto>) {
    return this.workLogService.updateItem(requireTenantContext(req).tenant.id, id, itemId, dto);
  }

  @Delete(':id/items/:itemId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  deleteItem(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.workLogService.deleteItem(requireTenantContext(req).tenant.id, id, itemId);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest, @Query('workOrderId') workOrderId?: string) {
    return this.workLogService.findAll(requireTenantContext(req).tenant.id, workOrderId);
  }
}