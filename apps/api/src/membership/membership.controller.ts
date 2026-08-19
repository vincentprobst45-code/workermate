import { Controller, Get, Req } from '@nestjs/common';
import { requireUserContext, type AuthenticatedRequest } from '../common/types/auth-request';
import { MembershipService } from './membership.service';

@Controller('memberships')
export class MembershipController {
  constructor(private membershipService: MembershipService) {}

  @Get('me')
  async findForCurrentUser(@Req() req: AuthenticatedRequest) {
    return this.membershipService.findForUser(requireUserContext(req).user.id);
  }
}
