import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddCatalogItemForm from './AddCatalogItemForm';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';
import type { CatalogItem } from './CatalogItemList';

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const session: Session = {
  user: { id: 'user-1', email: 'owner@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' },
};

const catalogItem: CatalogItem = {
  id: 'item-1', tenantId: 'tenant-1', type: 'MATERIAL', title: 'Cable', reference: 'CAB-1',
  isActive: true, description: 'Cuivre', defaultQuantity: 1, unitCode: 'MTR', unitLabel: 'm',
  baseQuantity: 1, baseQuantityUnitCode: 'MTR', unitPrice: 10, unitCost: 4, purchaseVatRate: 20,
  vatRate: 20, vatCategory: 'STANDARD', trackStock: true, stockItem: null,
  createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z',
};

function renderForm(props: Partial<React.ComponentProps<typeof AddCatalogItemForm>> = {}) {
  const defaultProps = { onCreated: vi.fn(), onUpdated: vi.fn(), show: true };
  return { ...defaultProps, ...props, ...render(<AuthProvider session={session}><AddCatalogItemForm {...defaultProps} {...props} /></AuthProvider>) };
}

describe('AddCatalogItemForm', () => {
  beforeEach(() => fetchMock.mockReset());

  it('validates the title before creating an item', async () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Titre *'), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Ajouter au catalogue' }));

    expect(await screen.findByText('Le titre est obligatoire.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates an item with normalized fields and calls onCreated', async () => {
    const onCreated = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 201, json: vi.fn().mockResolvedValue(catalogItem) });
    renderForm({ onCreated });

    fireEvent.change(screen.getByLabelText('Titre *'), { target: { value: '  Nouveau câble  ' } });
    fireEvent.change(screen.getByLabelText('Référence'), { target: { value: '  CAB-2  ' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Description  ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter au catalogue' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(catalogItem));
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/catalogitems', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('"title":"Nouveau câble"'),
    }));
  });

  it('updates an existing item through the PUT endpoint', async () => {
    const onUpdated = vi.fn();
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: vi.fn().mockResolvedValue(catalogItem) });
    renderForm({ initialCatalogItem: catalogItem, onUpdated });

    fireEvent.change(screen.getByLabelText('Titre *'), { target: { value: 'Cable modifié' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(catalogItem));
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/catalogitems/item-1', expect.objectContaining({ method: 'PUT' }));
  });
});
