import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { InvoiceService, CreateInvoiceDto } from './invoice.service';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import type { AuthenticatedRequest } from '../common/types/auth-request';

@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateInvoiceDto) {
    return this.invoiceService.create(req.tenant?.id ?? '', dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.invoiceService.findAll(req.tenant?.id ?? '');
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invoiceService.findOne(req.tenant?.id ?? '', id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateInvoiceDto>) {
    return this.invoiceService.update(req.tenant?.id ?? '', id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.invoiceService.delete(req.tenant?.id ?? '', id);
  }
}