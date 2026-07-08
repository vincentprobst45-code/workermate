export interface AuthUser {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

export interface TenantMembership {
  tenantId: string;
  tenantName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

export interface Session {
  user: AuthUser | null;
  tenants: TenantMembership[];
  activeTenant: TenantMembership | null;
}