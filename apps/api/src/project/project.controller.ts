import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProjectService, CreateProjectDto } from './project.service';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import type { AuthenticatedRequest } from '../common/types/auth-request';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProjectDto) {
    return this.projectService.create(req.tenant?.id ?? '', dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    return this.projectService.findAll(req.tenant?.id ?? '');
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectService.findOne(req.tenant?.id ?? '', id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateProjectDto>) {
    return this.projectService.update(req.tenant?.id ?? '', id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.projectService.delete(req.tenant?.id ?? '', id);
  }
}