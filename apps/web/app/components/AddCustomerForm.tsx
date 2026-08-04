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
      className={`border-2 mb-8 p-5 bg-white rounded-lg shadow-l ${!show ? 'hidden' : ''}`}
    >
      <h3 className="font-semibold mb-4">Ajouter un client</h3>
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Prénom"
          value={newCustomer.firstName}
          onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
          required
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Nom"
          value={newCustomer.lastName}
          onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Entreprise"
          value={newCustomer.company}
          onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Téléphone"
          value={newCustomer.phone}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Téléphone 2"
          value={newCustomer.mobile}
          onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
        />
      </div>

      <h3 className="px-3 py-4">Adresse :</h3>
      <div className="flex flex-wrap gap-2 px-3 pb-3">
        <button
          type="button"
          // className={`border py-2 px-3 rounded ${newCustomer.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
          className={`border py-2 px-3 rounded ${addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
          // onClick={() => setNewCustomer({ ...newCustomer, addressMode: 'new' })}
          onClick={() => setAddressMode('new')}
        >
          Nouvelle adresse
        </button>
        <button
          type="button"
          className={`border py-2 px-3 rounded ${addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
          // onClick={() => setNewCustomer({ ...newCustomer, addressMode: 'existing' })}
          onClick={() => setAddressMode('existing')}
        >
          Utiliser une adresse existante
        </button>
        <button
          type="button"
          className={`border py-2 px-3 rounded ${addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
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

      <h3 className="px-3 py-4">Entreprise :</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Numéro Siret"
          value={newCustomer.siret}
          onChange={(e) => setNewCustomer({ ...newCustomer, siret: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Numéro TVA"
          value={newCustomer.vatNumber}
          onChange={(e) => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Notes additionnelles"
          value={newCustomer.notes}
          onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
        />
      </div>

      <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
        Ajouter
      </button>
    </form>
  );
}