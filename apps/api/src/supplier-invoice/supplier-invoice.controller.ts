import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateSupplierInvoiceDto } from './create-supplier-invoice.dto';
import { SupplierInvoiceService } from './supplier-invoice.service';

@Controller('supplier-invoices')
export class SupplierInvoiceController {
  constructor(private readonly service: SupplierInvoiceService) {}
  @Get() findAll(@Req() req: AuthenticatedRequest) { return this.service.findAll(requireTenantContext(req).tenant.id); }
  @Post() @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN'])) create(@Req() req: AuthenticatedRequest, @Body() dto: CreateSupplierInvoiceDto) { return this.service.create(requireTenantContext(req).tenant.id, dto); }
}
