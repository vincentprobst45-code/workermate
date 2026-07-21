"use client"
import { useApiClient } from '../api-client';
import { useEffect, useState } from 'react'

interface AddressOption {
  id: string;
  street1?: string;
  street2?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
}

type AddressMode = 'new' | 'existing';

function formatAddressLabel(address: AddressOption): string {
  const line1 = [address.street1, address.street2].filter(Boolean).join(' ');
  const line2 = [address.postalCode, address.city].filter(Boolean).join(' ');
  const line3 = address.countryCode ?? '';
  const label = [line1, line2, line3].filter(Boolean).join(' - ');
  return label || address.id;
}

interface SelectExistingAddressProps {
  selectedAddressId: string;
  onAddressChange: (addressId: string) => void;
}

function SelectExistingAddress( {selectedAddressId, onAddressChange}: SelectExistingAddressProps){
  const api = useApiClient();
  const [addressOptions, setAddressOptions] = useState<AddressOption[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');

  useEffect(() => {
    if (addressOptions.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadAddresses() {
      setAddressesLoading(true);
      setAddressesError('');
      try {
        const res = await api.get('/addresses');
        if (!res.ok) throw new Error('Erreur');
        const data: AddressOption[] = await res.json();
        if (!cancelled) {
          setAddressOptions(data);
        }
      } catch {
        if (!cancelled) {
          setAddressesError('Erreur lors de la récupération des adresses');
        }
      } finally {
        if (!cancelled) {
          setAddressesLoading(false);
        }
      }
    }

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [api, addressOptions.length]);

    return(
        <div className="px-3 pb-3">
          {addressesLoading ? (
            <p>Chargement des adresses...</p>
          ) : (
            <select
              className="border px-3 py-2 rounded w-full"
              value={selectedAddressId}
              onChange={(e) => onAddressChange(e.target.value)}
              required
            >
              <option value="">--Veuillez choisir une adresse--</option>
              {addressOptions.map((address) => (
                <option key={address.id} value={address.id}>
                  {formatAddressLabel(address)}
                </option>
              ))}
            </select>
          )}
          {addressesError && <p className="text-red-700 mt-2">{addressesError}</p>}
        </div>
    )
}
export default SelectExistingAddress