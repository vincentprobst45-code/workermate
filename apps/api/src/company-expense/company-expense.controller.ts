import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateCompanyExpenseDto } from './create-company-expense.dto';
import { CompanyExpenseService } from './company-expense.service';

@Controller('company-expenses')
export class CompanyExpenseController {
  constructor(private readonly companyExpenseService: CompanyExpenseService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.companyExpenseService.findAll(requireTenantContext(req).tenant.id);
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCompanyExpenseDto) {
    return this.companyExpenseService.create(requireTenantContext(req).tenant.id, dto);
  }

  @Post(':id/paid')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  markPaid(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.companyExpenseService.markPaid(requireTenantContext(req).tenant.id, id);
  }
}
