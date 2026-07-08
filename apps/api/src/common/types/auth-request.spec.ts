import { UnauthorizedException } from '@nestjs/common';
import { requireTenantContext, type AuthenticatedRequest } from './auth-request';

describe('requireTenantContext', () => {
  it('returns the request when user, membership and tenant are present', () => {
    const req = {
      user: { id: 'user-1' },
      membership: { userId: 'user-1', tenantId: 'tenant-1' },
      tenant: { id: 'tenant-1', name: 'Acme' },
    } as unknown as AuthenticatedRequest;

    const result = requireTenantContext(req);

    expect(result).toBe(req);
    expect(result.tenant.id).toBe('tenant-1');
  });

  it('throws UnauthorizedException when tenant context is missing', () => {
    const req = {
      user: { id: 'user-1' },
      membership: { userId: 'user-1', tenantId: 'tenant-1' },
    } as unknown as AuthenticatedRequest;

    expect(() => requireTenantContext(req)).toThrow(UnauthorizedException);
  });
});
