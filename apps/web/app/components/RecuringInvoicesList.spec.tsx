import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RecuringInvoicesList from './RecuringInvoicesList';

const { api, authState } = vi.hoisted(() => ({
  api: { get: vi.fn(), post: vi.fn() },
  authState: { activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' } },
}));

vi.mock('../auth.context', () => ({ useAuth: () => authState }));
vi.mock('../api-client', () => ({ useApiClient: () => api }));

describe('RecuringInvoicesList TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 'recurring-1',
        name: 'Maintenance mensuelle',
        status: 'ACTIVE',
        recurrenceUnit: 'MONTH',
        interval: 1,
        nextOccurrenceDate: '2026-10-01T00:00:00.000Z',
        currency: 'EUR',
        customer: { company: 'Client test' },
        items: [{ quantity: 1, unitPrice: 100 }],
      }],
    });
    api.post.mockResolvedValue({ ok: true, json: async () => ({ status: 'PAUSED' }) });
  });

  it('loads recurring invoices with a tenant-scoped query', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><RecuringInvoicesList refreshKey={3} /></QueryClientProvider>);

    await waitFor(() => expect(screen.getAllByText('Maintenance mensuelle')).toHaveLength(2));
    expect(api.get).toHaveBeenCalledWith('/recurring-invoices');
    expect(queryClient.getQueryData(['recurring-invoices', 'tenant-1', 3])).toHaveLength(1);
  });

  it('updates the status through a mutation and cache update', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><RecuringInvoicesList /></QueryClientProvider>);

    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Mettre en pause' })).toHaveLength(2));
    fireEvent.click(screen.getAllByRole('button', { name: 'Mettre en pause' })[0]);

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/recurring-invoices/recurring-1/status/PAUSED', {}));
    await waitFor(() => expect(queryClient.getQueryData<Array<{ status: string }>>(['recurring-invoices', 'tenant-1', 0])?.[0].status).toBe('PAUSED'));
  });
});
