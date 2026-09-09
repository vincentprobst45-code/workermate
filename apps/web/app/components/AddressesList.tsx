'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

export interface AddressOption {
  id: string;
  street1?: string;
  street2?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
}

type AddressesListProps = {
  onSelect: (address: AddressOption) => void;
};

function formatAddress(address: AddressOption): string {
  const street = [address.street1, address.street2].filter(Boolean).join(' ');
  const locality = [address.postalCode, address.city].filter(Boolean).join(' ');
  return [street, locality, address.countryCode].filter(Boolean).join(' - ') || address.id;
}

export default function AddressesList({ onSelect }: AddressesListProps) {
  const api = useApiClient();
  const [addresses, setAddresses] = useState<AddressOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadAddresses() {
      try {
        const response = await api.get('/addresses');
        if (!response.ok) throw new Error('Erreur');
        const data: AddressOption[] = await response.json();
        if (!cancelled) setAddresses(data);
      } catch {
        if (!cancelled) setError('Impossible de charger les adresses.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAddresses();
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (loading) return <p className="text-sm text-slate-500">Chargement des adresses...</p>;
  if (error) return <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (addresses.length === 0) return <p className="text-sm text-slate-500">Aucune adresse enregistrée.</p>;

  return (
    <div className="space-y-2">
      {addresses.map((address) => (
        <button
          key={address.id}
          type="button"
          className="flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-left text-sm text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          onClick={() => onSelect(address)}
        >
          <span className="min-w-0 break-words font-medium">{formatAddress(address)}</span>
          <span className="shrink-0 text-xs font-semibold text-teal-700">Sélectionner</span>
        </button>
      ))}
    </div>
  );
}
