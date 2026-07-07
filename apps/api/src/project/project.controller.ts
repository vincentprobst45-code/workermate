import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProjectService, CreateProjectDto } from './project.service';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.findAll(tenantId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateProjectDto>) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.projectService.delete(tenantId, id);
  }
}