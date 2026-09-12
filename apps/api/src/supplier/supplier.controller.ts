import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateSupplierDto } from './create-supplier.dto';
import { SupplierService } from './supplier.service';

@Controller('suppliers')
export class SupplierController {
  constructor(private readonly service: SupplierService) {}
  @Get() findAll(@Req() req: AuthenticatedRequest) { return this.service.findAll(requireTenantContext(req).tenant.id); }
  @Get(':id') findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.service.findOne(requireTenantContext(req).tenant.id, id); }
  @Post() @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN'])) create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSupplierDto) { return this.service.create(requireTenantContext(req).tenant.id, dto); }
  @Delete(':id') @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN'])) remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) { return this.service.remove(requireTenantContext(req).tenant.id, id); }
}
