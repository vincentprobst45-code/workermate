import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateReconciliationDto } from './create-reconciliation.dto';
import { CreateTransferDto } from './create-transfer.dto';
import { ForecastQueryDto } from './forecast-query.dto';
import { TreasuryService } from './treasury.service';

@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('reconciliations')
  listReconciliations(@Req() req: AuthenticatedRequest, @Query('paymentAccountId') paymentAccountId?: string) {
    return this.treasuryService.listReconciliations(requireTenantContext(req).tenant.id, paymentAccountId);
  }

  @Post('reconciliations')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  reconcile(@Req() req: AuthenticatedRequest, @Body() dto: CreateReconciliationDto) {
    return this.treasuryService.reconcile(requireTenantContext(req).tenant.id, dto);
  }

  @Get('transfers')
  listTransfers(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.listTransfers(requireTenantContext(req).tenant.id);
  }

  @Post('transfers')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  createTransfer(@Req() req: AuthenticatedRequest, @Body() dto: CreateTransferDto) {
    return this.treasuryService.createTransfer(requireTenantContext(req).tenant.id, dto);
  }

  @Get('alerts')
  listAlerts(@Req() req: AuthenticatedRequest) {
    return this.treasuryService.listAlerts(requireTenantContext(req).tenant.id);
  }

  @Get('forecast')
  forecast(@Req() req: AuthenticatedRequest, @Query() query: ForecastQueryDto): Promise<unknown> {
    return this.treasuryService.forecast(requireTenantContext(req).tenant.id, query);
  }
}
