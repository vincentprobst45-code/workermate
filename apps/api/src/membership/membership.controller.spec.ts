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

  it('forwards user and tenant context for membership management routes', async () => {
    const findForUser = jest.fn().mockResolvedValue([]);
    const findForTenant = jest.fn().mockResolvedValue([]);
    const updateRole = jest.fn().mockResolvedValue({});
    const removeMembership = jest.fn().mockResolvedValue({});
    const rejectInvitation = jest.fn().mockResolvedValue({});
    const createInvitation = jest.fn().mockResolvedValue({});
    const service = {
      findForUser,
      findForTenant,
      updateRole,
      removeMembership,
      rejectInvitation,
      createInvitation,
    } as unknown as MembershipService;
    const controller = new MembershipController(service);
    const request = {
      user: { id: 'user-1' },
      tenant: { id: 'tenant-1' },
      membership: { role: 'OWNER' },
    } as AuthenticatedRequest;

    await controller.findForCurrentUser(request);
    await controller.findForCurrentTenant(request);
    await controller.updateRole(request, 'user-2', { role: 'ADMIN' });
    await controller.removeMembership(request, 'user-2');
    await controller.rejectInvitation(request, { invitationId: 'invitation-1' });
    await controller.createInvitation(request, { email: 'user@example.com' });

    expect(findForUser).toHaveBeenCalledWith('user-1');
    expect(findForTenant).toHaveBeenCalledWith('tenant-1');
    expect(updateRole).toHaveBeenCalledWith('tenant-1', 'user-1', 'user-2', 'ADMIN');
    expect(removeMembership).toHaveBeenCalledWith('tenant-1', 'user-1', 'user-2');
    expect(rejectInvitation).toHaveBeenCalledWith('user-1', 'invitation-1');
    expect(createInvitation).toHaveBeenCalledWith('tenant-1', 'user-1', 'user@example.com');
  });

  it('rejects protected routes without the required authentication context', async () => {
    const service = {
      findForUser: jest.fn(),
      findForTenant: jest.fn(),
      createInvitation: jest.fn(),
    } as unknown as MembershipService;
    const controller = new MembershipController(service);

    await expect(controller.findForCurrentUser({} as AuthenticatedRequest)).rejects.toMatchObject({ status: 401 });
    await expect(controller.findForCurrentTenant({ user: { id: 'user-1' } } as AuthenticatedRequest)).rejects.toMatchObject({ status: 401 });
    await expect(controller.createInvitation({ user: { id: 'user-1' } } as AuthenticatedRequest, { email: 'user@example.com' })).rejects.toMatchObject({ status: 401 });
  });
});
