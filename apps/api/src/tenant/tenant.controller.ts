import { Body, Controller, Get, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, requireUserContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './update-tenant.dto';
import { CreateTenantDto } from './create-tenant.dto';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateTenantDto) {
    const context = requireUserContext(req);
    return this.tenantService.create(context.user.id, dto);
  }

  @Get('current')
  async findCurrent(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.tenantService.findCurrent(tenantId);
  }

  @Get('current/quote-defaults')
  async findCurrentQuoteDefaults(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.tenantService.findCurrent(tenantId);
  }

  @Put('current')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async updateCurrent(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateTenantDto,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.tenantService.updateCurrent(tenantId, dto);
  }
}
