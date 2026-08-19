/*
'use client';
import { createContext, useState, useContext, ReactNode } from 'react';

interface AuthUser {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

interface TenantMembership {
  tenantId: string;
  tenantName: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
}

interface AuthContextType {
  user: AuthUser | null;
  tenants: TenantMembership[];
  activeTenant: TenantMembership | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, user: AuthUser, memberships: TenantMembership[]) => void;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialAuth] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        user: null as AuthUser | null,
        tenants: [] as TenantMembership[],
        activeTenant: null as TenantMembership | null,
        accessToken: null as string | null,
        refreshToken: null as string | null,
      };
    }

    const saved = localStorage.getItem('auth');
    if (!saved) {
      console.log("passaved")
      return {
        user: null as AuthUser | null,
        tenants: [] as TenantMembership[],
        activeTenant: null as TenantMembership | null,
        accessToken: null as string | null,
        refreshToken: null as string | null,
      };
    }

    try {
      console.log("trysaved")
      const parsed = JSON.parse(saved) as {
        user: AuthUser | null;
        tenants: TenantMembership[];
        activeTenant: TenantMembership | null;
        accessToken: string | null;
        refreshToken: string | null;
      };

      console.log("goreturuser")
      return {
        user: parsed.user,
        tenants: parsed.tenants ?? [],
        activeTenant: parsed.activeTenant ?? null,
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null,
      };
    } catch {
      console.log("atchonsaipaspourquoi")
      localStorage.removeItem('auth');
      return {
        user: null as AuthUser | null,
        tenants: [] as TenantMembership[],
        activeTenant: null as TenantMembership | null,
        accessToken: null as string | null,
        refreshToken: null as string | null,
      };
    }
  });

  const [user, setUser] = useState<AuthUser | null>(initialAuth.user);
  const [tenants, setTenants] = useState<TenantMembership[]>(initialAuth.tenants);
  const [activeTenant, setActiveTenant] = useState<TenantMembership | null>(initialAuth.activeTenant);
  const [accessToken, setAccessToken] = useState<string | null>(initialAuth.accessToken);
  const [refreshToken, setRefreshToken] = useState<string | null>(initialAuth.refreshToken);
  const [isLoading] = useState(false);

  const login = (accessToken: string, refreshToken: string, user: AuthUser, memberships: TenantMembership[]) => {
    const firstTenant = memberships[0] || null;
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    setUser(user);
    setTenants(memberships);
    setActiveTenant(firstTenant);
    localStorage.setItem(
      'auth',
      JSON.stringify({ accessToken, refreshToken, user, tenants: memberships, activeTenant: firstTenant }),
    );
  };

  const logout = () => {
    setUser(null);
    setTenants([]);
    setActiveTenant(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem('auth');
  };

  const switchTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.tenantId === tenantId);
    if (tenant) {
      setActiveTenant(tenant);
      const saved = localStorage.getItem('auth');
      if (saved) {
        const parsed = JSON.parse(saved);
        parsed.activeTenant = tenant;
        localStorage.setItem('auth', JSON.stringify(parsed));
      }
    }
  };

  const updateAccessToken = (token: string) => {
    setAccessToken(token);
    const saved = localStorage.getItem('auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      parsed.accessToken = token;
      localStorage.setItem('auth', JSON.stringify(parsed));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenants,
        activeTenant,
        accessToken,
        refreshToken,
        isLoading,
        login,
        logout,
        switchTenant,
        setAccessToken: updateAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
*/

'use client';

import { createContext, useContext, useState } from 'react';
import { Session } from './lib/auth.types';
import { EMPTY_SESSION } from './lib/session';

type AuthContextValue = Session & {
  switchTenant: (tenantId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  ...EMPTY_SESSION,
  switchTenant: async () => undefined,
});

export function AuthProvider({
    session,
    children,
}: {
  session: Session;
    children: React.ReactNode;
}) {
    const [currentSession, setCurrentSession] = useState<Session>(session);

    async function switchTenant(tenantId: string) {
      const response = await fetch('http://localhost:4000/auth/switch-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tenantId }),
      });

      if (!response.ok) {
        let message = 'Impossible de changer d’entreprise.';
        try {
          const body = await response.json() as { message?: string | string[] };
          if (Array.isArray(body.message)) message = body.message.join(', ');
          else if (body.message) message = body.message;
        } catch {
          // Keep the generic message when the API response is not JSON.
        }
        throw new Error(`${message} (HTTP ${response.status})`);
      }

      const nextSession = await response.json() as Session;
      setCurrentSession(nextSession);
    }

    return (
        <AuthContext.Provider value={{ ...currentSession, switchTenant }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  return useContext(AuthContext);
}