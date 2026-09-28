import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SupplierInvoicesList from './SupplierInvoicesList';

const { api, authState } = vi.hoisted(() => ({
  api: { get: vi.fn() },
  authState: { activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' } },
}));

vi.mock('../auth.context', () => ({ useAuth: () => authState }));
vi.mock('../api-client', () => ({ useApiClient: () => api }));
vi.mock('./SupplierInvoiceDetails', () => ({ default: () => null }));

describe('SupplierInvoicesList TanStack Query migration', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads supplier invoices with a tenant-scoped query', async () => {
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 'invoice-1',
        supplierInvoiceNumber: 'FA-2026-001',
        issueDate: '2026-09-01T00:00:00.000Z',
        status: 'CONFIRMED',
        settlementStatus: 'UNSETTLED',
        taxExclusiveAmount: 100,
        vatAmount: 20,
        taxInclusiveAmount: 120,
        openAmount: 120,
        supplier: { id: 'supplier-1', name: 'Fournisseur test' },
        items: [{ id: 'item-1', title: 'Prestation', quantity: 1, taxExclusiveAmount: 100, taxInclusiveAmount: 120 }],
      }],
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={queryClient}><SupplierInvoicesList refreshKey={2} /></QueryClientProvider>);

    await waitFor(() => expect(screen.getByText('FA-2026-001')).toBeInTheDocument());
    expect(api.get).toHaveBeenCalledWith('/supplier-invoices');
    expect(queryClient.getQueryData(['supplier-invoices', 'tenant-1', 2])).toHaveLength(1);
  });

  it('retries a failed supplier invoice query', async () => {
    api.get
      .mockResolvedValueOnce({ ok: false })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    render(<QueryClientProvider client={queryClient}><SupplierInvoicesList /></QueryClientProvider>);

    await waitFor(() => expect(screen.getByText('Impossible de charger les factures fournisseurs.')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });
});
