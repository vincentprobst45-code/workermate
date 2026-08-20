import { MembershipController } from './membership.controller';
import type { MembershipService } from './membership.service';
import type { AuthenticatedRequest } from '../common/types/auth-request';

describe('MembershipController', () => {
  it('accepts an invitation for the authenticated user', async () => {
    const acceptInvitation = jest.fn().mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'MEMBER',
    });
    const service = { acceptInvitation } as unknown as MembershipService;
    const controller = new MembershipController(service);
    const request = { user: { id: 'user-1' } } as AuthenticatedRequest;

    await controller.acceptInvitation(request, { invitationId: 'invitation-1' });

    expect(acceptInvitation).toHaveBeenCalledWith('user-1', 'invitation-1');
  });
});
