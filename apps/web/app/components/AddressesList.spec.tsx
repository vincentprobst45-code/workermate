import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddressesList, { type AddressOption } from './AddressesList';

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));

vi.mock('../api-client', () => ({
  useApiClient: () => ({ get: getMock }),
}));

const addresses: AddressOption[] = [
  {
    id: 'address-1',
    street1: '14 rue des Acacias',
    street2: 'Bâtiment A',
    postalCode: '75001',
    city: 'Paris',
    countryCode: 'FR',
  },
  {
    id: 'address-2',
    street1: '20 avenue des Lilas',
    postalCode: '69001',
    city: 'Lyon',
  },
];

describe('AddressesList', () => {
  it('loads and formats addresses, then reports the selected address', async () => {
    getMock.mockResolvedValue({ ok: true, json: async () => addresses });
    const onSelect = vi.fn();
    render(<AddressesList onSelect={onSelect} />);

    expect(screen.getByText('Chargement des adresses...')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('14 rue des Acacias Bâtiment A - 75001 Paris - FR')).toBeInTheDocument());
    expect(screen.getByText('20 avenue des Lilas - 69001 Lyon')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /14 rue des Acacias/ }));
    expect(onSelect).toHaveBeenCalledWith(addresses[0]);
    expect(getMock).toHaveBeenCalledWith('/addresses');
  });

  it('renders the empty and error states', async () => {
    getMock.mockResolvedValueOnce({ ok: true, json: async () => [] });
    const { unmount } = render(<AddressesList onSelect={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Aucune adresse enregistrée.')).toBeInTheDocument());
    unmount();

    getMock.mockRejectedValueOnce(new Error('network'));
    render(<AddressesList onSelect={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Impossible de charger les adresses.'));
  });
});
