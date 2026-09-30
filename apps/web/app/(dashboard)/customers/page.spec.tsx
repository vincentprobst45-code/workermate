'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CustomersPage from './page';

const { api, authState } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
  authState: {
    activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' },
  },
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../auth.context', () => ({
  useAuth: () => authState,
}));

vi.mock('../api-client', () => ({
  useApiClient: () => api,
}));

vi.mock('../protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/AddCustomerForm', () => ({
  default: () => null,
}));

vi.mock('../components/CustomersList', () => ({
  default: ({ customers, onDelete }: { customers: Array<{ id: string }>; onDelete?: (id: string) => void }) => (
    <div>
      <span data-testid="customer-count">{customers.length}</span>
      <button type="button" data-testid="delete-customer" onClick={() => onDelete?.('customer-1')}>
        delete customer
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
      <CustomersPage />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('CustomersPage TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'customer-1', tenantId: 'tenant-1', firstName: 'Ada', createdAt: '2026-01-01' }],
    });
    api.delete.mockResolvedValue({ ok: true });
  });

  it('invalidates the customer list and dashboard after deletion', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByTestId('customer-count')).toHaveTextContent('1'));
    fireEvent.click(screen.getByTestId('delete-customer'));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/customers/customer-1'));
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
  });
});
