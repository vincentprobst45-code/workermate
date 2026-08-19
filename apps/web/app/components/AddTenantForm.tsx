'use client';

import { type FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';

type AddTenantFormProps = {
  onCreated: (tenant: { id: string; name: string }) => void;
  onCancel: () => void;
};

type TenantFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  siretNumber: string;
  vatNumber: string;
  defaultCurrency: string;
  defaultPaymentTerms: string;
  defaultLegalMentions: string;
  defaultInvoiceNotes: string;
  address: AddAddressFormData;
};

function createEmptyForm(): TenantFormData {
  return {
    name: '',
    email: '',
    phoneNumber: '',
    siretNumber: '',
    vatNumber: '',
    defaultCurrency: 'EUR',
    defaultPaymentTerms: '',
    defaultLegalMentions: '',
    defaultInvoiceNotes: '',
    address: createEmptyAddress(),
  };
}

export default function AddTenantForm({ onCreated, onCancel }: AddTenantFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState<TenantFormData>(createEmptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const response = await api.post('/tenants', {
        ...form,
        address: form.address.street1.trim() || form.address.postalCode.trim() || form.address.city.trim()
          ? form.address
          : undefined,
      });
      if (!response.ok) {
        let apiMessage = `Erreur HTTP ${response.status}`;
        try {
          const errorBody = await response.json() as { message?: string | string[] };
          if (Array.isArray(errorBody.message)) {
            apiMessage = errorBody.message.join(', ');
          } else if (errorBody.message) {
            apiMessage = errorBody.message;
          }
        } catch {
          // Keep the HTTP status when the API response is not JSON.
        }
        throw new Error(apiMessage);
      }
      const tenant = await response.json() as { id: string; name: string };
      onCreated(tenant);
      setForm(createEmptyForm());
    } catch (creationError) {
      setError(creationError instanceof Error ? creationError.message : 'Erreur lors de la création de l’entreprise.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-zinc-900">Créer une entreprise</h2><button type="button" className="rounded border px-3 py-2 text-sm" onClick={onCancel}>Fermer</button></div>
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"><h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Informations générales</h3><div className="grid gap-3 sm:grid-cols-2">
        {([['name', 'Nom', true], ['email', 'Email', false], ['phoneNumber', 'Téléphone', false], ['siretNumber', 'SIRET', false], ['vatNumber', 'TVA', false], ['defaultCurrency', 'Devise', true]] as const).map(([key, label, required]) => <label key={key} className="flex flex-col gap-1.5 text-sm"><span className="font-medium text-zinc-700">{label}{required ? ' *' : ''}</span><input required={required} className="rounded border border-zinc-300 px-3 py-2" value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
      </div></section>
      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4"><h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Adresse</h3><AddressForm address={form.address} onChange={(address) => setForm((current) => ({ ...current, address }))} /></section>
      <section className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-3"><label className="flex flex-col gap-1.5 text-sm"><span>Conditions de paiement</span><input className="rounded border px-3 py-2" value={form.defaultPaymentTerms} onChange={(event) => setForm((current) => ({ ...current, defaultPaymentTerms: event.target.value }))} /></label><label className="flex flex-col gap-1.5 text-sm"><span>Mentions légales</span><input className="rounded border px-3 py-2" value={form.defaultLegalMentions} onChange={(event) => setForm((current) => ({ ...current, defaultLegalMentions: event.target.value }))} /></label><label className="flex flex-col gap-1.5 text-sm"><span>Notes par défaut</span><input className="rounded border px-3 py-2" value={form.defaultInvoiceNotes} onChange={(event) => setForm((current) => ({ ...current, defaultInvoiceNotes: event.target.value }))} /></label></section>
      <button type="submit" disabled={saving} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving ? 'Création...' : 'Créer l’entreprise'}</button>
    </form>
  );
}
