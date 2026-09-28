import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('invoice/:invoiceId')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  create(
    @Req() req: AuthenticatedRequest,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentService.create(requireTenantContext(req).tenant.id, invoiceId, dto);
  }

  @Get('invoice/:invoiceId')
  findAll(@Req() req: AuthenticatedRequest, @Param('invoiceId') invoiceId: string) {
    return this.paymentService.findAll(requireTenantContext(req).tenant.id, invoiceId);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.paymentService.delete(requireTenantContext(req).tenant.id, id);
  }

  @Patch(':id/cancel')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: { reason?: string }) {
    return this.paymentService.cancel(requireTenantContext(req).tenant.id, id, body.reason);
  }
}
