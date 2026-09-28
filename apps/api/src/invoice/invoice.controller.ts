import { BadRequestException, Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './create-invoice.dto'
import { CreateInvoiceFromWorkOrderDto } from './create-invoice-from-workorder.dto';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { EmailService } from '../email/email.service';
import { EmailDocumentType } from '@prisma/client';

@Controller('invoices')
export class InvoiceController {
  constructor(private invoiceService: InvoiceService, private emailService: EmailService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateInvoiceDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.create(tenantId, dto);
  }

  @Post('from-workorder')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async createFromWorkOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateInvoiceFromWorkOrderDto,
  ): Promise<unknown> {
    const tenantId = requireTenantContext(req).tenant.id;
    return await this.invoiceService.createFromWorkOrder(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    const result = this.invoiceService.findAll(tenantId);
    return result;
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.findOne(tenantId, id);
  }

  @Post(':id/send-email')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async sendEmail(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const invoice = await this.invoiceService.findOne(requireTenantContext(req).tenant.id, id);
    if (!invoice) {
      return invoice;
    }
    if (!invoice.customerEmail) {
      throw new BadRequestException('Le client de la facture n’a pas d’adresse email.');
    }
    const result = await this.emailService.sendInvoice(requireTenantContext(req).tenant.id, invoice.customerEmail, invoice);
    return result;
  }

  @Get(':id/email-history')
  async emailHistory(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.emailService.listHistory(requireTenantContext(req).tenant.id, EmailDocumentType.INVOICE, id);
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

  @Post(':id/delete-with-payments')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async deleteWithPayments(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.invoiceService.deleteDraftWithPayments(tenantId, id);
  }
}