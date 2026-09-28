import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import {
  requireTenantContext,
  type AuthenticatedRequest,
} from '../common/types/auth-request';
import { CreateCatalogItemDto } from './create-catalog-item.dto';
import { CatalogItemService } from './catalogitem.service';

@Controller('catalogitems')
export class CatalogItemController {
  constructor(private catalogItemService: CatalogItemService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCatalogItemDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.catalogItemService.create(tenantId, dto);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query('search') search?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('trackStock') trackStock?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.catalogItemService.findAll(tenantId, {
      search,
      type,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      trackStock: trackStock === undefined ? undefined : trackStock === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.catalogItemService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: Partial<CreateCatalogItemDto>,
  ) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.catalogItemService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.catalogItemService.delete(tenantId, id);
  }
}
