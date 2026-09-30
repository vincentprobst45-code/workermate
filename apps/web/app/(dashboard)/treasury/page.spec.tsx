'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TreasuryPage from './page';

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

vi.mock('../auth.context', () => ({
  useAuth: () => authState,
}));

vi.mock('../api-client', () => ({
  useApiClient: () => api,
}));

vi.mock('../protected-route', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../components/AddBankAccountForm', () => ({
  default: ({ onCreated }: { onCreated: (account: unknown) => void }) => (
    <button
      type="button"
      data-testid="create-account"
      onClick={() => onCreated({ id: 'account-2', name: 'Nouveau compte', currency: 'EUR', openingBalance: 0 })}
    >
      create account
    </button>
  ),
}));

vi.mock('../components/AddCompanyExpenseForm', () => ({ default: () => null }));
vi.mock('../components/AddBankTransactionForm', () => ({ default: () => null }));
vi.mock('../components/BankAccountDetails', () => ({ default: () => null }));
vi.mock('../components/BankAccountsList', () => ({ default: () => null }));
vi.mock('../components/ForecastBudgetGraph', () => ({ default: () => null }));

function response(data: unknown, ok = true) {
  return { ok, status: ok ? 200 : 500, json: async () => data };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <QueryClientProvider client={queryClient}>
      <TreasuryPage />
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('TreasuryPage TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation(async (endpoint: string) => {
      if (endpoint === '/payment-accounts') return response([{ id: 'account-1', name: 'Compte principal', currency: 'EUR', openingBalance: 0 }]);
      if (endpoint === '/company-expenses') return response([]);
      if (endpoint === '/bank-transactions') return response([]);
      if (endpoint === '/treasury/alerts') return response([]);
      if (endpoint === '/treasury/reconciliations') return response([]);
      if (endpoint === '/treasury/transfers') return response([]);
      if (endpoint.startsWith('/treasury/forecast')) return response({ points: [], diagnostics: { message: '' } });
      throw new Error(`Unexpected endpoint: ${endpoint}`);
    });
  });

  it('loads treasury data with tenant and forecast parameters', async () => {
    renderPage();

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/payment-accounts'));
    expect(api.get).toHaveBeenCalledWith('/company-expenses');
    expect(api.get).toHaveBeenCalledWith('/bank-transactions');
    expect(api.get).toHaveBeenCalledWith('/treasury/forecast?horizonDays=90&paymentTiming=DUE_DATE&paymentDelayDays=0');
  });

  it('updates the treasury cache when an account is created', async () => {
    const { queryClient } = renderPage();

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/payment-accounts'));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un compte' }));
    fireEvent.click(screen.getByTestId('create-account'));

    await waitFor(() => {
      expect(queryClient.getQueryData<{ accounts: Array<{ id: string }> }>(['treasury', 'tenant-1', '90', 'DUE_DATE', '0'])?.accounts).toHaveLength(2);
    });
  });
});
