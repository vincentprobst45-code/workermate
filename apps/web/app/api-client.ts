import { useAuth } from './auth.context';
import { useCallback, useMemo } from 'react';

const API_URL = 'http://localhost:4000';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Hook pour utiliser le client API avec accès au contexte
export function useApiClient() {
  const session = useAuth();
  const tenantId = session.activeTenant?.tenantId;

  const executeRequest = useCallback(async (
    endpoint: string,
    options: FetchOptions = {},
  ): Promise<Response> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (tenantId) {
      headers['X-Tenant-ID'] = tenantId;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    return response;
  }, [tenantId]);

  const request = useCallback(async (
    endpoint: string,
    options: FetchOptions = {},
    retryCount = 0,
  ): Promise<Response> => {
    const response = await executeRequest(endpoint, options);

    if (response.status === 401 && retryCount === 0) {
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          return executeRequest(endpoint, options);
        }

        throw new Error('Session expired, please login again');
      } catch (err) {
        throw err;
      }
    }

    return response;
  }, [executeRequest]);

  return useMemo(() => ({
    get: (endpoint: string, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint: string, body?: unknown, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body?: unknown, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint: string, options?: FetchOptions) =>
      request(endpoint, { ...options, method: 'DELETE' }),
  }), [request]);
}
