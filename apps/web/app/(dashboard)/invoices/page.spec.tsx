'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import InvoicesPage from './page';

const { api, authState } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  authState: {
    activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' },
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../../auth.context', () => ({
  useAuth: () => authState,
}));

vi.mock('../../api-client', () => ({
  useApiClient: () => api,
}));

vi.mock('../../protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../../components/AddInvoiceForm', () => ({
  default: () => null,
}));

vi.mock('../../components/AddReccuringInvoiceForm', () => ({
  default: () => null,
}));

vi.mock('../../components/RecuringInvoicesList', () => ({
  default: () => null,
}));

vi.mock('../../components/AddPaymentForm', () => ({
  default: ({ onCreated }: { onCreated: (payment: unknown) => void }) => (
    <button
      type="button"
      data-testid="create-payment"
      onClick={() => onCreated({ id: 'payment-1', invoiceId: 'invoice-1', amount: 100 })}
    >
      create payment
    </button>
  ),
}));

vi.mock('../../components/InvoicesList', () => ({
  default: ({ invoices, onUpdated }: { invoices: Array<{ id: string; paymentStatus?: string }>; onUpdated?: (invoice: unknown) => void }) => (
    <div>
      <span data-testid="invoice-count">{invoices.length}</span>
      <span data-testid="payment-status">{invoices[0]?.paymentStatus ?? 'unknown'}</span>
      <button
        type="button"
        data-testid="update-invoice"
        onClick={() => onUpdated?.({ ...invoices[0], paymentStatus: 'PAID', paidAmount: 100, amountDue: 0 })}
      >
        update invoice
      </button>
    </div>
  ),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <InvoicesPage />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('InvoicesPage TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'invoice-1', number: 'F-001', paymentStatus: 'UNPAID', payments: [] }],
    });
  });

  it('refetches invoices after a payment is created', async () => {
    const { queryClient } = renderPage();
    queryClient.setQueryData(['dashboard', 'tenant-1'], { cached: true });
    queryClient.setQueryData(['projects-profitability', 'tenant-1'], { cached: true });

    await waitFor(() => expect(screen.getByTestId('invoice-count')).toHaveTextContent('1'));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un paiement' }));
    fireEvent.click(screen.getByTestId('create-payment'));

    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(api.get).toHaveBeenLastCalledWith('/invoices');
    expect(queryClient.getQueryState(['dashboard', 'tenant-1'])?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(['projects-profitability', 'tenant-1'])?.isInvalidated).toBe(true);
  });

  it('updates the cached invoice when the detail flow returns a refreshed invoice', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTestId('payment-status')).toHaveTextContent('UNPAID'));
    fireEvent.click(screen.getByTestId('update-invoice'));

    await waitFor(() => expect(screen.getByTestId('payment-status')).toHaveTextContent('PAID'));
  });
});
