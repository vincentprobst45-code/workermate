import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireUserContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { requireTenantContext } from '../common/types/auth-request';
import { CreateMembershipInvitationDto } from './create-membership-invitation.dto';
import { MembershipService } from './membership.service';

@Controller('memberships')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get('me')
  async findForCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.membershipService.findForUser(requireUserContext(req).user.id);
  }

  @Post('invitations')
  @UseGuards(new RequireRoleGuard(['OWNER', 'ADMIN']))
  async createInvitation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateMembershipInvitationDto,
  ) {
    const context = requireTenantContext(req);
    return this.membershipService.createInvitation(
      context.tenant.id,
      context.user.id,
      dto.email,
    );
  }
}
