import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { InvoiceService, CreateInvoiceDto } from './invoice.service';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';

@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateInvoiceDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateInvoiceDto>) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.delete(tenantId, id);
  }
}