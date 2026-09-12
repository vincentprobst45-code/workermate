import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateBankTransactionDto } from './create-bank-transaction.dto';
import { BankTransactionService } from './bank-transaction.service';

@Controller('bank-transactions')
export class BankTransactionController {
  constructor(private readonly bankTransactionService: BankTransactionService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.bankTransactionService.findAll(requireTenantContext(req).tenant.id);
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateBankTransactionDto) {
    return this.bankTransactionService.create(requireTenantContext(req).tenant.id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bankTransactionService.delete(requireTenantContext(req).tenant.id, id);
  }
}
