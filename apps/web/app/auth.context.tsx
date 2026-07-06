'use client';
import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

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
  login: (accessToken: string, refreshToken: string, user: AuthUser, memberships: TenantMembership[]) => void;
  logout: () => void;
  switchTenant: (tenantId: string) => void;
  setAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [tenants, setTenants] = useState<TenantMembership[]>([]);
  const [activeTenant, setActiveTenant] = useState<TenantMembership | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('auth');
    if (saved) {
      try {
        const { user, tenants, activeTenant, accessToken, refreshToken } = JSON.parse(saved);
        setUser(user);
        setTenants(tenants);
        setActiveTenant(activeTenant);
        setAccessToken(accessToken);
        setRefreshToken(refreshToken);
      } catch (e) {
        localStorage.removeItem('auth');
      }
    }
  }, []);

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
