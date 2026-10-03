'use client';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddCustomerForm from './AddCustomerForm';

const { api } = vi.hoisted(() => ({
  api: {
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('../api-client', () => ({
  useApiClient: () => api,
}));

vi.mock('./AddressForm', () => ({
  default: () => null,
  createEmptyAddress: () => ({ street1: '', street2: '', postalCode: '', city: '', countryCode: 'FR' }),
}));

vi.mock('./SelectExistingAddress', () => ({
  default: () => null,
}));

describe('AddCustomerForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.post.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'customer-1', firstName: 'Jane' }),
    });
  });

  it('blocks submission without a first name', () => {
    render(<AddCustomerForm show onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }));

    expect(screen.getByRole('button', { name: 'Étape 1 : Identité' })).toHaveAttribute('aria-current', 'step');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('creates a customer without an address after completing the three steps', async () => {
    const onCreated = vi.fn();
    render(<AddCustomerForm show onCreated={onCreated} />);

    fireEvent.change(screen.getByPlaceholderText('Prénom'), { target: { value: 'Jane' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Continuer →' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter le client' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/customers', expect.objectContaining({
      firstName: 'Jane',
      addressId: '',
      address: expect.objectContaining({ street1: '', postalCode: '', city: '' }),
    })));
    expect(onCreated).toHaveBeenCalledWith({ id: 'customer-1', firstName: 'Jane' });
    expect(screen.getByRole('status')).toHaveTextContent('Client ajouté avec succès');
  });
});
