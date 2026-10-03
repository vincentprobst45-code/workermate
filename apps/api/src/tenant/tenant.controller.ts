import { BadRequestException, Body, Controller, Get, Post, Put, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, requireUserContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { TenantService } from './tenant.service';
import { UpdateTenantDto } from './update-tenant.dto';
import { UpdateInvoiceAppearanceDto } from './update-invoice-appearance.dto';
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

  @Get('current/invoice-appearance')
  async findCurrentInvoiceAppearance(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.tenantService.findCurrentInvoiceAppearance(tenantId);
  }

  @Put('current/invoice-appearance')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async updateCurrentInvoiceAppearance(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateInvoiceAppearanceDto,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.tenantService.updateCurrentInvoiceAppearance(tenantId, dto);
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

  @Post('current/logo')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  @UseInterceptors(FileInterceptor('file'))
  async uploadLogo(@Req() req: AuthenticatedRequest, @UploadedFile() file?: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file) throw new BadRequestException('Un fichier image est requis.');
    return this.tenantService.uploadLogo(requireTenantContext(req).tenant.id, file);
  }
}
