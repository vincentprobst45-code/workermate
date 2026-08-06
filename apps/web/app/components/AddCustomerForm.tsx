'use client';
import { useState, type FormEvent } from 'react';
import AddressForm, { createEmptyAddress, type AddAddressFormData } from './AddressForm';
import SelectExistingAddress from './SelectExistingAddress';
import { useApiClient } from '../api-client';

interface AddressOneLine {
  street1?: string;
  postalCode?: string;
  city?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  createdById?: string;
  firstName: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  addressId?: string;
  address?: AddressOneLine;
  siret?: string;
  vatNumber?: string;
  notes?: string;
  createdAt: string;
}

type AddressMode = 'new' | 'existing' | 'none';

export type AddCustomerFormData = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  siret: string;
  vatNumber: string;
  notes: string;
  // addressMode: AddressMode;
  addressId: string;
  address: AddAddressFormData;
};

export type CreateCustomerDto  = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  siret: string;
  vatNumber: string;
  notes: string;
  addressId: string;
  address: AddAddressFormData;
};

export function createEmptyCustomer(): AddCustomerFormData {
  return {
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    mobile: '',
    siret: '',
    vatNumber: '',
    notes: '',
    // addressMode: 'none',
    addressId: '',
    address: createEmptyAddress(),
  };
}

type AddCustomerFormProps = {
  onCreated: (customer: Customer) => void;
  show: boolean;
};

export default function AddCustomerForm({ onCreated, show }: AddCustomerFormProps) {
  const api = useApiClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCustomer, setNewCustomer] = useState<AddCustomerFormData>(createEmptyCustomer());
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressMode, setAddressMode] = useState<AddressMode>("none");

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault();

    try {
      if (addressMode === 'existing' && !selectedAddressId) {
        setError('Veuillez sélectionner une adresse existante');
        return;
      }

      const customerToAdd: CreateCustomerDto  =
        addressMode === 'new'
          ? { ...newCustomer, address: newCustomer.address }
          : addressMode === 'existing'
            ? { ...newCustomer, addressId: selectedAddressId }
            : { ...newCustomer };

      const res = await api.post('/customers', customerToAdd);
      if (!res.ok) throw new Error('Erreur');

      const data = await res.json();
      onCreated(data);
      setNewCustomer(createEmptyCustomer());
      setAddressMode("none");
      setSelectedAddressId('');
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch (err) {
      setError(`Erreur lors de l'ajout: ${err}`);
    }
  }

  return (
    <form
      onSubmit={handleAddCustomer}
      className={`mb-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ${!show ? 'hidden' : ''}`}
    >
      <h3 className="text-lg font-semibold text-zinc-900">Ajouter un client</h3>
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Informations client</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Prénom</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Prénom"
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Nom</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Nom"
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Entreprise</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Entreprise"
              value={newCustomer.company}
              onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Email</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Téléphone</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Téléphone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Téléphone secondaire</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Téléphone 2"
              value={newCustomer.mobile}
              onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
      <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Adresse</h4>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          // className={`border py-2 px-3 rounded ${newCustomer.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
          className={`rounded-md border px-3 py-2 text-sm transition ${addressMode === 'new' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
          // onClick={() => setNewCustomer({ ...newCustomer, addressMode: 'new' })}
          onClick={() => setAddressMode('new')}
        >
          Nouvelle adresse
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-2 text-sm transition ${addressMode === 'existing' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
          // onClick={() => setNewCustomer({ ...newCustomer, addressMode: 'existing' })}
          onClick={() => setAddressMode('existing')}
        >
          Utiliser une adresse existante
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-2 text-sm transition ${addressMode === 'none' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
          // onClick={() => setNewCustomer({ ...newCustomer, addressMode: 'none' })}
          onClick={() => setAddressMode('none')}
        >
          Ne pas ajouter d&apos;adresse
        </button>
      </div>

      {/* {newCustomer.addressMode === 'new' ? ( */}
      {addressMode === 'new' ? (
        <AddressForm
          address={newCustomer.address}
          onChange={(address) => setNewCustomer({ ...newCustomer, address })}
        />
      // ) : newCustomer.addressMode === 'existing' ? (
      ) : addressMode === 'existing' ? (
        <SelectExistingAddress
          selectedAddressId={selectedAddressId}
          onAddressChange={setSelectedAddressId}
        />
      ) : (
        <span />
      )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Entreprise</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Numéro SIRET</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Numéro SIRET"
              value={newCustomer.siret}
              onChange={(e) => setNewCustomer({ ...newCustomer, siret: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Numéro TVA</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Numéro TVA"
              value={newCustomer.vatNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 lg:col-span-1 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Notes</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Notes additionnelles"
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
            />
          </label>
        </div>
      </section>

      <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
        Ajouter
      </button>
    </form>
  );
}