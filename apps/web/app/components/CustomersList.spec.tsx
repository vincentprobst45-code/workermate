import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CustomersList, { type Customer } from './CustomersList';

vi.mock('./CustomersDetails', () => ({
  default: ({ customer, onClose }: { customer: Customer; onClose: () => void }) => (
    <div role="dialog">
      <span>{customer.firstName}</span>
      <button type="button" onClick={onClose}>Fermer le détail</button>
    </div>
  ),
}));

const customers: Customer[] = [
  {
    id: 'customer-1',
    tenantId: 'tenant-1',
    firstName: 'Jane',
    lastName: 'Doe',
    company: 'Acme',
    email: 'jane@example.com',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'customer-2',
    tenantId: 'tenant-1',
    firstName: 'Marc',
    lastName: 'Martin',
    createdAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('CustomersList', () => {
  it('filters customers and opens the selected customer details', () => {
    render(<CustomersList customers={customers} />);

    fireEvent.change(screen.getByPlaceholderText('Rechercher par nom, entreprise ou contact'), { target: { value: 'Jane' } });
    expect(screen.getAllByText('Jane Doe')).toHaveLength(2);
    expect(screen.queryByText('Marc Martin')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir le client Jane Doe' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Jane');
  });

  it('confirms deletion and reports the selected customer id', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<CustomersList customers={customers} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer le client Jane Doe' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Supprimer ce client ?');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('customer-1'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
