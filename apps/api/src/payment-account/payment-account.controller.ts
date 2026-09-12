import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreatePaymentAccountDto } from './create-payment-account.dto';
import { PaymentAccountService } from './payment-account.service';
import { UpdatePaymentAccountDto } from './update-payment-account.dto';

@Controller('payment-accounts')
export class PaymentAccountController {
  constructor(private readonly paymentAccountService: PaymentAccountService) {}

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.paymentAccountService.findAll(requireTenantContext(req).tenant.id);
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePaymentAccountDto) {
    return this.paymentAccountService.create(requireTenantContext(req).tenant.id, dto);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: UpdatePaymentAccountDto) {
    return this.paymentAccountService.update(requireTenantContext(req).tenant.id, id, dto);
  }

  @Post(':id/default')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async setDefault(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.paymentAccountService.setDefault(requireTenantContext(req).tenant.id, id);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async archive(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.paymentAccountService.archive(requireTenantContext(req).tenant.id, id);
  }
}