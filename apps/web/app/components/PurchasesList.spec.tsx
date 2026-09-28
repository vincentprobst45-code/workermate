import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PurchasesList from './PurchasesList';

const { api, authState } = vi.hoisted(() => ({
  api: { get: vi.fn() },
  authState: { activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' } },
}));

vi.mock('../auth.context', () => ({ useAuth: () => authState }));
vi.mock('../api-client', () => ({ useApiClient: () => api }));

describe('PurchasesList TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 'purchase-1',
        purchaseDate: '2026-01-01',
        status: 'CONFIRMED',
        taxInclusiveAmount: 120,
        effectiveCostAmount: 100,
        items: [],
        supplierName: 'Fournisseur test',
      }],
    });
  });

  it('loads purchases with a tenant-scoped query', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <PurchasesList onSelect={vi.fn()} />
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('Fournisseur test')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/purchases');
    expect(queryClient.getQueryData(['purchases', 'tenant-1', 0])).toHaveLength(1);
  });
});
