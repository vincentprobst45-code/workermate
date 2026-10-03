import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CatalogItemList, { type CatalogItem } from './CatalogItemList';

function item(overrides: Partial<CatalogItem>): CatalogItem {
  return {
    id: 'item-1', tenantId: 'tenant-1', type: 'MATERIAL', title: 'Cable cuivre', reference: 'CAB-1',
    isActive: true, description: 'Câble électrique', defaultQuantity: 1, unitCode: 'MTR', unitLabel: 'm',
    baseQuantity: 1, baseQuantityUnitCode: 'MTR', unitPrice: 10, unitCost: 4, purchaseVatRate: 20,
    vatRate: 20, vatCategory: 'STANDARD', trackStock: true, stockItem: { quantityOnHand: 10 },
    createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z',
    ...overrides,
  };
}

describe('CatalogItemList', () => {
  it('filters items by search, status and stock state', () => {
    const items = [
      item({ id: 'in-stock', title: 'Cable cuivre', stockItem: { quantityOnHand: 10 } }),
      item({ id: 'low-stock', title: 'Raccord cuivre', stockItem: { quantityOnHand: 3 } }),
      item({ id: 'inactive', title: 'Ancien câble', isActive: false, stockItem: null }),
    ];
    render(<CatalogItemList catalogItems={items} onDelete={null} />);

    expect(screen.getByText('Cable cuivre')).toBeInTheDocument();
    expect(screen.getByText('Raccord cuivre')).toBeInTheDocument();
    expect(screen.getByText('Ancien câble')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Rechercher un article, une référence...'), { target: { value: 'raccord' } });
    expect(screen.getByText('Raccord cuivre')).toBeInTheDocument();
    expect(screen.queryByText('Cable cuivre')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Stock'), { target: { value: 'low' } });
    expect(screen.getByText('Raccord cuivre')).toBeInTheDocument();
  });

  it('opens item details and invokes edit, toggle, and delete actions', () => {
    const onEdit = vi.fn();
    const onToggleActive = vi.fn();
    const onDelete = vi.fn();
    const catalogItem = item({});
    render(<CatalogItemList catalogItems={[catalogItem]} onDelete={onDelete} onEdit={onEdit} onToggleActive={onToggleActive} />);

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le détail de Cable cuivre' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cable cuivre' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(onEdit).toHaveBeenCalledWith(catalogItem);
  });
});
