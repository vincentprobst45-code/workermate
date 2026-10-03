import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SelectExistingAddress from './SelectExistingAddress';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../api-client', () => ({
  useApiClient: () => ({ get: getMock }),
}));

describe('SelectExistingAddress', () => {
  it('loads addresses and forwards the selected id', async () => {
    getMock.mockResolvedValue({
      ok: true,
      json: async () => [{ id: 'address-1', street1: '14 rue A', postalCode: '75001', city: 'Paris', countryCode: 'FR' }],
    });
    const onAddressChange = vi.fn();
    render(<SelectExistingAddress selectedAddressId="" onAddressChange={onAddressChange} />);

    expect(screen.getByText('Chargement des adresses...')).toBeInTheDocument();
    const select = await screen.findByRole('combobox');
    expect(screen.getByRole('option', { name: '14 rue A - 75001 Paris - FR' })).toBeInTheDocument();

    fireEvent.change(select, { target: { value: 'address-1' } });
    expect(onAddressChange).toHaveBeenCalledWith('address-1');
    expect(select).toBeRequired();
  });

  it('renders an error when addresses cannot be loaded', async () => {
    getMock.mockRejectedValue(new Error('network'));
    render(<SelectExistingAddress selectedAddressId="" onAddressChange={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Erreur lors de la récupération des adresses')).toBeInTheDocument());
  });
});
