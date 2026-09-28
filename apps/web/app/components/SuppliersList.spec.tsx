import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SuppliersList from './SuppliersList';

const { api, authState } = vi.hoisted(() => ({
  api: { get: vi.fn(), delete: vi.fn() },
  authState: { activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' } },
}));

vi.mock('../auth.context', () => ({ useAuth: () => authState }));
vi.mock('../api-client', () => ({ useApiClient: () => api }));

describe('SuppliersList TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('confirm', vi.fn(() => true));
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'supplier-1', name: 'Fournisseur test', reference: 'SUP-1', _count: { purchases: 2, invoices: 1 } }],
    });
    api.delete.mockResolvedValue({ ok: true });
  });

  it('loads suppliers with a tenant-scoped query', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><SuppliersList refreshKey={0} onSelect={vi.fn()} onAddInvoice={vi.fn()} onAddSupplier={vi.fn()} /></QueryClientProvider>);

    await waitFor(() => expect(screen.getByText('Fournisseur test')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/suppliers');
    expect(queryClient.getQueryData(['suppliers', 'tenant-1', 0])).toHaveLength(1);
  });

  it('removes an archived supplier from the query cache', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><SuppliersList refreshKey={0} onSelect={vi.fn()} onAddInvoice={vi.fn()} onAddSupplier={vi.fn()} /></QueryClientProvider>);

    await waitFor(() => expect(screen.getByText('Fournisseur test')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Actions pour Fournisseur test' }));
    fireEvent.click(screen.getByRole('button', { name: 'Archiver' }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/suppliers/supplier-1'));
    expect(queryClient.getQueryData(['suppliers', 'tenant-1', 0])).toEqual([]);
  });
});
