import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RequireRoleGuard } from '../common/guards/require-role.guard';
import { requireUserContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { requireTenantContext } from '../common/types/auth-request';
import { AcceptMembershipInvitationDto } from './accept-membership-invitation.dto';
import { CreateMembershipInvitationDto } from './create-membership-invitation.dto';
import { RejectMembershipInvitationDto } from './reject-membership-invitation.dto';
import { UpdateMembershipRoleDto } from './update-membership-role.dto';
import { MembershipService } from './membership.service';

@Controller('memberships')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get('me')
  async findForCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.membershipService.findForUser(requireUserContext(req).user.id);
  }

  @Get('current')
  async findForCurrentTenant(@Req() req: AuthenticatedRequest) {
    const context = requireTenantContext(req);
    return this.membershipService.findForTenant(context.tenant.id);
  }

  @Patch(':userId/role')
  async updateRole(
    @Req() req: AuthenticatedRequest,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMembershipRoleDto,
  ) {
    const context = requireTenantContext(req);
    return this.membershipService.updateRole(
      context.tenant.id,
      context.user.id,
      targetUserId,
      dto.role,
    );
  }

  @Delete(':userId')
  async removeMembership(
    @Req() req: AuthenticatedRequest,
    @Param('userId') targetUserId: string,
  ) {
    const context = requireTenantContext(req);
    return this.membershipService.removeMembership(
      context.tenant.id,
      context.user.id,
      targetUserId,
    );
  }

  @Post('accept-invite')
  async acceptInvitation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcceptMembershipInvitationDto,
  ) {
    return this.membershipService.acceptInvitation(
      requireUserContext(req).user.id,
      dto.invitationId,
    );
  }

  @Post('reject-invite')
  async rejectInvitation(
    @Req() req: AuthenticatedRequest,
    @Body() dto: RejectMembershipInvitationDto,
  ) {
    return this.membershipService.rejectInvitation(
      requireUserContext(req).user.id,
      dto.invitationId,
    );
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
