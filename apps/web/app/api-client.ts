import { useAuth } from './auth.context';

const API_URL = 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Hook pour utiliser le client API avec accès au contexte
export function useApiClient() {
  const auth = useAuth();

  const request = async (
    endpoint: string,
    options: FetchOptions = {},
    retryCount = 0,
  ): Promise<Response> => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          [useApiClient] SENDING REQUEST               ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`[useApiClient] Endpoint: ${endpoint}`);
    console.log(`[useApiClient] Method: ${options.method || 'GET'}`);
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Ajouter le token d'accès
    console.log(`[useApiClient] Access Token: ${auth.accessToken ? '✅ Present (' + auth.accessToken.substring(0, 20) + '...)' : '❌ MISSING'}`);
    if (auth.accessToken) {
      headers['Authorization'] = `Bearer ${auth.accessToken}`;
    }

    // Ajouter le tenant ID si un tenant est sélectionné
    console.log(`[useApiClient] Active Tenant: ${auth.activeTenant ? '✅ ' + auth.activeTenant.tenantId : '❌ MISSING'}`);
    if (auth.activeTenant) {
      headers['X-Tenant-ID'] = auth.activeTenant.tenantId;
    }

    console.log(`[useApiClient] Headers being sent:`, headers);
    console.log(`[useApiClient] Full URL: ${API_URL}${endpoint}`);
    console.log('');

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Si 401 et on a un refresh token, essayer de le rafraîchir
    if (response.status === 401 && auth.refreshToken && retryCount === 0) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: auth.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          auth.setAccessToken(data.accessToken);

          // Réessayer la requête originale avec le nouveau token
          return request(endpoint, options, retryCount + 1);
        } else {
          // Le refresh a échoué, déconnecter l'utilisateur
          auth.logout();
          throw new Error('Session expired, please login again');
        }
      } catch (err) {
        auth.logout();
        throw err;
      }
    }

    return response;
  };

  return {
    get: (endpoint: string, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body?: unknown, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body?: unknown, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'DELETE' }),
  };
}
