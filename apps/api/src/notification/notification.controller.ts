import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireTenantContext, requireUserContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { CreateNotificationDto } from './create-notification.dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async findReceived(@Req() req: AuthenticatedRequest) {
    const context = requireUserContext(req);
    return this.notificationService.findReceived(context.user.id);
  }

  @Get('recipients')
  async findRecipients(@Req() req: AuthenticatedRequest) {
    const context = requireTenantContext(req);
    return this.notificationService.findRecipients(context.tenant.id, context.user.id);
  }

  @Post()
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN', 'MEMBER']))
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateNotificationDto) {
    const context = requireTenantContext(req);
    return this.notificationService.create(context.tenant.id, context.user.id, dto);
  }

  @Put(':id/read')
  async markAsRead(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const context = requireUserContext(req);
    return this.notificationService.markAsRead(context.user.id, id);
  }
}
