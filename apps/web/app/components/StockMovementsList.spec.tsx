import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import StockMovementsList from './StockMovementsList';

const { api, authState } = vi.hoisted(() => ({
  api: { get: vi.fn() },
  authState: { activeTenant: { tenantId: 'tenant-1', tenantName: 'Test', role: 'OWNER' } },
}));

vi.mock('../auth.context', () => ({ useAuth: () => authState }));
vi.mock('../api-client', () => ({ useApiClient: () => api }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...rest}>{children}</a>,
}));

describe('StockMovementsList TanStack Query migration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'movement-in',
          direction: 'IN',
          reason: 'PURCHASE',
          quantity: 4,
          unitCode: 'PCS',
          totalCost: 80,
          occurredAt: '2026-09-01T00:00:00.000Z',
          stockItem: { catalogItem: { id: 'item-1', title: 'Vis', reference: 'VIS-1', unitLabel: 'pièce' } },
        },
        {
          id: 'movement-out',
          direction: 'OUT',
          reason: 'CONSUMPTION',
          quantity: 1,
          unitCode: 'PCS',
          totalCost: 20,
          occurredAt: '2026-09-02T00:00:00.000Z',
          stockItem: { catalogItem: { id: 'item-1', title: 'Vis', reference: 'VIS-1', unitLabel: 'pièce' } },
        },
      ],
    });
  });

  it('loads movements with a tenant-scoped query', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><StockMovementsList /></QueryClientProvider>);

    await waitFor(() => expect(screen.getAllByText('Vis')).toHaveLength(2));
    expect(api.get).toHaveBeenCalledWith('/stock/movements');
    expect(queryClient.getQueryData(['stock-movements', 'tenant-1'])).toHaveLength(2);
  });

  it('filters movements by direction', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={queryClient}><StockMovementsList /></QueryClientProvider>);

    await waitFor(() => expect(screen.getAllByText('Vis')).toHaveLength(2));
    fireEvent.change(screen.getByLabelText('Filtrer'), { target: { value: 'OUT' } });

    expect(screen.getByText('Consommation chantier')).toBeInTheDocument();
    expect(screen.queryByText('Achat')).not.toBeInTheDocument();
  });
});
