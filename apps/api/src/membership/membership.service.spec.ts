import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import { MembershipService } from './membership.service';

describe('MembershipService', () => {
  const findUniqueInvitationMock = jest.fn();
  const findFirstInvitationMock = jest.fn();
  const findUniqueTenantMock = jest.fn();
  const findUniqueUserMock = jest.fn();
  const sendMembershipInvitationMock = jest.fn();
  const membershipUpsertMock = jest.fn();
  const updateInvitationMock = jest.fn();
  const notificationCreateMock = jest.fn();
  const membershipFindUniqueMock = jest.fn();
  const membershipFindManyMock = jest.fn();
  const membershipUpdateMock = jest.fn();
  const membershipDeleteMock = jest.fn();
  const transactionMock = jest.fn();

  const prisma = {
    membership: {
      findUnique: membershipFindUniqueMock,
      findMany: membershipFindManyMock,
      update: membershipUpdateMock,
      delete: membershipDeleteMock,
    },
    membershipInvitation: {
      findUnique: findUniqueInvitationMock,
      findFirst: findFirstInvitationMock,
    },
    user: {
      findUnique: findUniqueUserMock,
    },
    tenant: {
      findUnique: findUniqueTenantMock,
    },
    $transaction: transactionMock,
  } as unknown as PrismaService;

  let service: MembershipService;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionMock.mockImplementation((callback: (tx: unknown) => unknown) => callback({
      membership: { upsert: membershipUpsertMock },
      membershipInvitation: { update: updateInvitationMock },
      notification: { create: notificationCreateMock },
    }));
    service = new MembershipService(prisma, {
      sendMembershipInvitation: sendMembershipInvitationMock,
    } as never);
  });

  it('prevents a user from removing their own membership', async () => {
    await expect(service.removeMembership('tenant-1', 'user-1', 'user-1'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(membershipFindUniqueMock).not.toHaveBeenCalled();
  });

  it('lists a user memberships mapped and sorted by tenant name', async () => {
    membershipFindManyMock.mockResolvedValue([
      { tenantId: 'tenant-1', role: 'OWNER', tenant: { name: 'Acme' } },
    ]);

    await expect(service.findForUser('user-1')).resolves.toEqual([
      { tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' },
    ]);
    expect(membershipFindManyMock).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: { tenantId: true, role: true, tenant: { select: { name: true } } },
      orderBy: { tenant: { name: 'asc' } },
    });
  });

  it('allows an owner to update a membership role', async () => {
    membershipFindUniqueMock
      .mockResolvedValueOnce({ role: 'OWNER' })
      .mockResolvedValueOnce({ role: 'MEMBER' });
    membershipUpdateMock.mockResolvedValue({ userId: 'user-2', tenantId: 'tenant-1', role: 'ADMIN' });

    await expect(service.updateRole('tenant-1', 'user-1', 'user-2', 'ADMIN')).resolves.toEqual({
      userId: 'user-2', tenantId: 'tenant-1', role: 'ADMIN',
    });
    expect(membershipUpdateMock).toHaveBeenCalledWith({
      where: { userId_tenantId: { userId: 'user-2', tenantId: 'tenant-1' } },
      data: { role: 'ADMIN' },
    });
  });

  it('prevents an admin from assigning or changing an owner role', async () => {
    membershipFindUniqueMock
      .mockResolvedValueOnce({ role: 'ADMIN' })
      .mockResolvedValueOnce({ role: 'MEMBER' });

    await expect(service.updateRole('tenant-1', 'admin-1', 'user-2', 'OWNER'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(membershipUpdateMock).not.toHaveBeenCalled();
  });

  it('allows an owner to remove another membership', async () => {
    membershipFindUniqueMock
      .mockResolvedValueOnce({ role: 'OWNER' })
      .mockResolvedValueOnce({ role: 'MEMBER' });
    membershipDeleteMock.mockResolvedValue({ userId: 'user-2', tenantId: 'tenant-1' });

    await expect(service.removeMembership('tenant-1', 'user-1', 'user-2')).resolves.toEqual({
      userId: 'user-2', tenantId: 'tenant-1',
    });
    expect(membershipDeleteMock).toHaveBeenCalledWith({
      where: { userId_tenantId: { userId: 'user-2', tenantId: 'tenant-1' } },
    });
  });

  it('rejects a duplicate pending invitation', async () => {
    findFirstInvitationMock.mockResolvedValue({ id: 'invitation-1' });

    await expect(service.createInvitation('tenant-1', 'owner-1', ' User@Example.com '))
      .rejects.toBeInstanceOf(ConflictException);
    expect(findUniqueUserMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('creates an in-app invitation and notification for an existing user', async () => {
    const createInvitationMock = jest.fn().mockResolvedValue({
      id: 'invitation-2', tenantId: 'tenant-1', email: 'user@example.com', role: 'MEMBER',
      status: 'PENDING', expiresAt: new Date(), createdAt: new Date(),
    });
    findFirstInvitationMock.mockResolvedValue(null);
    findUniqueUserMock.mockResolvedValue({ id: 'user-2' });
    findUniqueTenantMock.mockResolvedValue({ name: 'Acme' });
    transactionMock.mockImplementation((callback: (tx: unknown) => unknown) => callback({
      membershipInvitation: { create: createInvitationMock },
      notification: { create: notificationCreateMock },
    }));

    await service.createInvitation('tenant-1', 'owner-1', 'USER@EXAMPLE.COM');

    const invitationCreateCalls = createInvitationMock.mock.calls as unknown as Array<[{ data: { email: string; invitedUserId: string; role: string } }] >;
    expect(invitationCreateCalls[0][0].data).toEqual(expect.objectContaining({ email: 'user@example.com', invitedUserId: 'user-2', role: 'MEMBER' }));
    const notificationCreateCalls = notificationCreateMock.mock.calls as unknown as Array<[{ data: { recipientId: string; senderId: string; type: string } }] >;
    expect(notificationCreateCalls[0][0].data).toEqual(expect.objectContaining({ recipientId: 'user-2', senderId: 'owner-1', type: 'MEMBERSHIP_INVITE' }));
    expect(sendMembershipInvitationMock).not.toHaveBeenCalled();
  });

  it('rejects an invitation that is already accepted', async () => {
    findUniqueInvitationMock.mockResolvedValue({
      id: 'invitation-1', invitedUserId: 'user-1', status: 'ACCEPTED', expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.rejectInvitation('user-1', 'invitation-1')).rejects.toBeInstanceOf(ConflictException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('creates a membership and accepts a pending invitation', async () => {
    const invitation = {
      id: 'invitation-1',
      tenantId: 'tenant-1',
      invitedUserId: 'user-1',
      role: 'MEMBER',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
    };
    const membership = { userId: 'user-1', tenantId: 'tenant-1', role: 'MEMBER' };
    findUniqueInvitationMock.mockResolvedValue(invitation);
    membershipUpsertMock.mockResolvedValue(membership);
    updateInvitationMock.mockResolvedValue({ ...invitation, status: 'ACCEPTED' });

    await expect(service.acceptInvitation('user-1', 'invitation-1')).resolves.toEqual(membership);

    expect(membershipUpsertMock).toHaveBeenCalledWith({
      where: { userId_tenantId: { userId: 'user-1', tenantId: 'tenant-1' } },
      create: { userId: 'user-1', tenantId: 'tenant-1', role: 'MEMBER' },
      update: {},
    });
    expect(updateInvitationMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'invitation-1' },
    }));
    const acceptedUpdateCalls = updateInvitationMock.mock.calls as unknown as Array<[{ data: { status: string } }] >;
    expect(acceptedUpdateCalls[0][0].data.status).toBe('ACCEPTED');
  });

  it('emails an invitation link when the address has no account', async () => {
    const createInvitationMock = jest.fn().mockResolvedValue({
      id: 'invitation-3',
      tenantId: 'tenant-3',
      email: 'new@example.com',
      role: 'MEMBER',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    });
    findUniqueInvitationMock.mockResolvedValue(null);
    findUniqueUserMock.mockResolvedValue(null);
    findUniqueTenantMock.mockResolvedValue({ name: 'Acme' });
    transactionMock.mockImplementation((callback: (tx: unknown) => unknown) => callback({
      membershipInvitation: { create: createInvitationMock },
      notification: { create: jest.fn() },
    }));

    await service.createInvitation('tenant-3', 'owner-1', 'NEW@EXAMPLE.COM');

    expect(createInvitationMock).toHaveBeenCalledTimes(1);
    const createCalls = createInvitationMock.mock.calls as unknown as Array<[{ data: { email: string; tokenHash: string } }] >;
    const createCall = createCalls[0][0];
    expect(createCall.data.email).toBe('new@example.com');
    expect(createCall.data.tokenHash).not.toContain('new@example.com');
    expect(sendMembershipInvitationMock).toHaveBeenCalledWith(
      'new@example.com',
      'Acme',
      expect.stringMatching(/^https:\/\/workermate\.fr\/register\?invitation=.+$/),
    );
  });

  it('rejects an invitation belonging to another user', async () => {
    findUniqueInvitationMock.mockResolvedValue({
      id: 'invitation-1',
      invitedUserId: 'another-user',
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.acceptInvitation('user-1', 'invitation-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('rejects an expired invitation', async () => {
    findUniqueInvitationMock.mockResolvedValue({
      id: 'invitation-1',
      invitedUserId: 'user-1',
      status: 'PENDING',
      expiresAt: new Date(Date.now() - 60_000),
    });

    await expect(service.acceptInvitation('user-1', 'invitation-1')).rejects.toBeInstanceOf(ConflictException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('rejects a pending invitation and notifies the inviter', async () => {
    const invitation = {
      id: 'invitation-2',
      tenantId: 'tenant-2',
      invitedUserId: 'user-2',
      invitedBy: { id: 'owner-1' },
      invitedUser: { firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' },
      tenant: { name: 'Acme' },
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 60_000),
    };
    findUniqueInvitationMock.mockResolvedValue(invitation);
    updateInvitationMock.mockResolvedValue({ ...invitation, status: 'REJECTED' });

    await service.rejectInvitation('user-2', 'invitation-2');

    expect(updateInvitationMock).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'invitation-2' },
    }));
    const rejectedUpdateCalls = updateInvitationMock.mock.calls as unknown as Array<[{ data: { status: string } }] >;
    expect(rejectedUpdateCalls[0][0].data.status).toBe('REJECTED');
    expect(notificationCreateMock).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-2',
        recipientId: 'owner-1',
        type: 'MEMBERSHIP_INVITE',
        title: 'Invitation refusée',
        message: 'Jane Doe a refusé votre invitation à rejoindre Acme',
      },
    });
  });
});
