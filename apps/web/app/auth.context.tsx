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

import { createContext, useContext } from 'react';
import { Session } from './lib/auth.types';
import { EMPTY_SESSION } from './lib/session';

const AuthContext = createContext<Session>(EMPTY_SESSION);

export function AuthProvider({
    session,
    children,
}: {
  session: Session;
    children: React.ReactNode;
}) {
    return (
        <AuthContext.Provider value={session}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
  return useContext(AuthContext);
}