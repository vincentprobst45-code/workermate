import { Body, Controller, Get, Put, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './update-tenant.dto';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

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
