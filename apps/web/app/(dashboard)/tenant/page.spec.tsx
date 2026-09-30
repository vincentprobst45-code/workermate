import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TenantPage from './page';

const { api, authState } = vi.hoisted(() => ({
  api: { get: vi.fn() },
  authState: { activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' } },
}));

vi.mock('../auth.context', () => ({ useAuth: () => authState }));
vi.mock('../api-client', () => ({ useApiClient: () => api }));
vi.mock('../protected-route', () => ({ ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('../components/AddTenantForm', () => ({ default: () => null }));
vi.mock('../components/EmployeesList', () => ({ default: () => null }));
vi.mock('../components/TenantDetails', () => ({
  default: ({ tenant, onEdit }: { tenant: { name?: string }; onEdit: () => void }) => (
    <div><span data-testid="tenant-name">{tenant.name}</span><button type="button" onClick={onEdit}>edit tenant</button></div>
  ),
}));
vi.mock('../components/UpdateTenantForm', () => ({
  default: ({ onSaved }: { onSaved: (tenant: unknown) => void }) => (
    <button type="button" onClick={() => onSaved({ id: 'tenant-1', name: 'Updated company' })}>save tenant</button>
  ),
}));

describe('TenantPage TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ ok: true, json: async () => ({ id: 'tenant-1', name: 'Initial company' }) });
  });

  it('loads the current tenant with a tenant-scoped query', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><TenantPage /></QueryClientProvider>);

    await waitFor(() => expect(screen.getByTestId('tenant-name')).toHaveTextContent('Initial company'));
    expect(api.get).toHaveBeenCalledWith('/tenants/current');
    expect(queryClient.getQueryData(['tenant-current', 'tenant-1'])).toMatchObject({ name: 'Initial company' });
  });

  it('updates the tenant query cache after saving', async () => {
    render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><TenantPage /></QueryClientProvider>);

    await waitFor(() => screen.getByTestId('tenant-name'));
    fireEvent.click(screen.getByRole('button', { name: 'edit tenant' }));
    fireEvent.click(screen.getByRole('button', { name: 'save tenant' }));

    await waitFor(() => expect(screen.getByTestId('tenant-name')).toHaveTextContent('Updated company'));
  });
});
