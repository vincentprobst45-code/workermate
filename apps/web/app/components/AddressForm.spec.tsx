import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AddressForm, { createEmptyAddress, type AddAddressFormData } from './AddressForm';

describe('AddressForm', () => {
  it('creates an empty address with all supported fields', () => {
    expect(createEmptyAddress()).toEqual({
      street1: '',
      street2: '',
      postalCode: '',
      city: '',
      region: '',
      countryCode: '',
      latitude: '',
      longitude: '',
      accessCode: '',
      floor: '',
      apartment: '',
      note: '',
    });
  });

  it('forwards changes while preserving the rest of the address', () => {
    const address: AddAddressFormData = {
      ...createEmptyAddress(),
      street1: '14 rue A',
      city: 'Paris',
    };
    const onChange = vi.fn();
    render(<AddressForm address={address} onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText('Ex: 75001'), { target: { value: '69001' } });

    expect(onChange).toHaveBeenCalledWith({
      ...address,
      postalCode: '69001',
    });
  });
});
