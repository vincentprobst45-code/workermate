'use client';
import { useAuth } from './auth.context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: ('OWNER' | 'ADMIN' | 'MEMBER')[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, activeTenant } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !activeTenant) {
      router.push('/login');
      return;
    }

    if (requiredRole && !requiredRole.includes(activeTenant.role)) {
      router.push('/');
    }
  }, [user, activeTenant, router, requiredRole]);

  if (!user || !activeTenant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Vérification...</p>
      </div>
    );
  }

  return <>{children}</>;
}
