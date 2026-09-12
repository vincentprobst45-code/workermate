import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreatePurchaseDto } from './create-purchase.dto';
import { PurchaseService } from './purchase.service';

@Controller('purchases')
export class PurchaseController {
  constructor(private readonly service: PurchaseService) {}
  @Get() findAll(@Req() req: AuthenticatedRequest) { return this.service.findAll(requireTenantContext(req).tenant.id); }
  @Post() @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN'])) create(@Req() req: AuthenticatedRequest, @Body() dto: CreatePurchaseDto) { return this.service.create(requireTenantContext(req).tenant.id, dto); }
}
