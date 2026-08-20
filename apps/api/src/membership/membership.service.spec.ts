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
  const transactionMock = jest.fn();

  const prisma = {
    membership: {
      findUnique: membershipFindUniqueMock,
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
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
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
    expect(updateInvitationMock).toHaveBeenCalledWith({
      where: { id: 'invitation-1' },
      data: { status: 'ACCEPTED', acceptedAt: expect.any(Date) },
    });
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
    transactionMock.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      membershipInvitation: { create: createInvitationMock },
      notification: { create: jest.fn() },
    }));

    await service.createInvitation('tenant-3', 'owner-1', 'NEW@EXAMPLE.COM');

    expect(createInvitationMock).toHaveBeenCalledTimes(1);
    const createCall = createInvitationMock.mock.calls[0][0] as {
      data: { email: string; tokenHash: string };
    };
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

    expect(updateInvitationMock).toHaveBeenCalledWith({
      where: { id: 'invitation-2' },
      data: { status: 'REJECTED', rejectedAt: expect.any(Date) },
    });
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
