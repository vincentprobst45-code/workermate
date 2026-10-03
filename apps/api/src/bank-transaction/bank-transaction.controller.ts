import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateBankTransactionDto } from './create-bank-transaction.dto';
import { ImportBankTransactionsDto } from './import-bank-transactions.dto';
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

  @Post('import')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  import(@Req() req: AuthenticatedRequest, @Body() dto: ImportBankTransactionsDto) {
    return this.bankTransactionService.importTransactions(requireTenantContext(req).tenant.id, dto);
  }

  @Get('imports')
  listImports(@Req() req: AuthenticatedRequest, @Query('paymentAccountId') paymentAccountId?: string) {
    return this.bankTransactionService.listImportBatches(requireTenantContext(req).tenant.id, paymentAccountId);
  }

  @Get('imports/:id')
  getImport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bankTransactionService.getImportBatch(requireTenantContext(req).tenant.id, id);
  }

  @Post('imports/:id/rollback')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  rollbackImport(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bankTransactionService.rollbackImportBatch(requireTenantContext(req).tenant.id, id);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bankTransactionService.delete(requireTenantContext(req).tenant.id, id);
  }
}
