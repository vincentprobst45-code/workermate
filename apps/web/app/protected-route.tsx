'use client';
import { useAuth } from './auth.context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: ('OWNER' | 'ADMIN' | 'MEMBER')[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, activeTenant, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('[ProtectedRoute] useEffect triggered');
    console.log('[ProtectedRoute] isLoading:', isLoading);
    console.log('[ProtectedRoute] user:', user ? '✅ Present' : '❌ Missing');
    console.log('[ProtectedRoute] activeTenant:', activeTenant ? '✅ ' + activeTenant.tenantName : '❌ Missing');

    // Wait for auth to be loaded from localStorage
    if (isLoading) {
      console.log('[ProtectedRoute] ⏳ Still loading auth...');
      return;
    }

    // Redirect to login if not authenticated
    if (!user || !activeTenant) {
      console.log('[ProtectedRoute] ❌ Not authenticated - redirecting to /login');
      router.push('/login');
      return;
    }

    console.log('[ProtectedRoute] ✅ User authenticated');

    // Check role if required
    if (requiredRole && !requiredRole.includes(activeTenant.role)) {
      console.log('[ProtectedRoute] ❌ Role check failed - redirecting to /');
      router.push('/');
    }
  }, [user, activeTenant, isLoading, router, requiredRole]);

  // Show loading while auth is being restored from localStorage
  if (isLoading) {
    console.log('[ProtectedRoute] Rendering: isLoading=true');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Chargement de votre session...</p>
      </div>
    );
  }

  // Show nothing while checking auth (prevent flash of content)
  if (!user || !activeTenant) {
    console.log('[ProtectedRoute] Rendering: user/tenant missing');
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">Vérification...</p>
      </div>
    );
  }

  console.log('[ProtectedRoute] Rendering: Content visible');
  return <>{children}</>;
}
