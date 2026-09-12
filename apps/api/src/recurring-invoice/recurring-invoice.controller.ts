import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateRecurringInvoiceDto } from './create-recurring-invoice.dto';
import { RecurringInvoiceService } from './recurring-invoice.service';

@Controller('recurring-invoices')
export class RecurringInvoiceController {
  constructor(private readonly recurringInvoiceService: RecurringInvoiceService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.recurringInvoiceService.findAll(requireTenantContext(req).tenant.id);
  }

  @Post('process-due')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async processDue(@Req() req: AuthenticatedRequest) {
    return this.recurringInvoiceService.processDue(requireTenantContext(req).tenant.id);
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateRecurringInvoiceDto) {
    const context = requireTenantContext(req);
    return this.recurringInvoiceService.create(context.tenant.id, context.user?.id, dto);
  }

  @Post(':id/status/:status')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async updateStatus(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Param('status') status: 'ACTIVE' | 'PAUSED' | 'ENDED') {
    return this.recurringInvoiceService.updateStatus(requireTenantContext(req).tenant.id, id, status);
  }
}