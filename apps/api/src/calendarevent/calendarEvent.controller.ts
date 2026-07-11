import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Logger } from '@nestjs/common';
import { CalendarEventService  } from './calendarEvent.service';
import { CreateCalendarEventDto } from './create-calendarEvent.dto'
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, type AuthenticatedRequest } from '../common/types/auth-request';

@Controller('calendarevents')
export class CalendarEventController {
  private readonly logger = new Logger(CalendarEventController.name);
  private readonly isDebugEnabled = process.env.NODE_ENV !== 'production';

  constructor(private calendarEventService: CalendarEventService) {}

  private debug(message: string) {
    if (this.isDebugEnabled) {
      this.logger.debug(message);
    }
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCalendarEventDto) {
    const tenantId = requireTenantContext(req).tenant.id;
    this.debug(`Creating customer for tenantId=${tenantId}`);
    return this.calendarEventService.create(tenantId, dto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const tenantId = requireTenantContext(req).tenant.id;
    this.debug(`Listing customers for tenantId=${tenantId}`);
    const result = this.calendarEventService.findAll(tenantId);
    return result;
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    this.debug(`Getting customer id=${id} for tenantId=${tenantId}`);
    return this.calendarEventService.findOne(tenantId, id);
  }

  @Put(':id')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() dto: Partial<CreateCalendarEventDto>) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.calendarEventService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @UseGuards(new RequireRoleGuard(['OWNER']))
  async delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const tenantId = requireTenantContext(req).tenant.id;
    return this.calendarEventService.delete(tenantId, id);
  }
}
