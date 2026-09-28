'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export type Supplier = { id: string; name: string; reference?: string | null; email?: string | null; phone?: string | null; city?: string | null; _count?: { purchases: number; invoices: number } };

type SupplierForm = {
  name: string;
  legalName: string;
  siretNumber: string;
  vatNumber: string;
  email: string;
  phone: string;
  street1: string;
  sirenNumber: string;
  contactName: string;
  website: string;
  street2: string;
  postalCode: string;
  city: string;
  countryCode: string;
  notes: string;
};

const emptyForm: SupplierForm = { name: '', legalName: '', siretNumber: '', vatNumber: '', email: '', phone: '', street1: '', sirenNumber: '', contactName: '', website: '', street2: '', postalCode: '', city: '', countryCode: 'FR', notes: '' };

export default function AddSupplierForm({ onCreated }: { onCreated: (supplier: Supplier) => void }) {
  const api = useApiClient();
  const [form, setForm] = useState<SupplierForm>(emptyForm);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field: keyof SupplierForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Le nom est obligatoire.'); return; }
    setSaving(true);
    try {
      const response = await api.post('/suppliers', Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || undefined])));
      if (!response.ok) throw new Error();
      onCreated(await response.json());
      setForm(emptyForm);
      setShowAdvanced(false);
    } catch { setError('Impossible de créer le fournisseur.'); } finally { setSaving(false); }
  }

  const inputClass = 'mt-1 w-full rounded-md border border-stone-300 px-3 py-2';
  const field = (label: string, key: keyof SupplierForm, type = 'text', required = false) => <label className="text-sm font-medium text-stone-700">{label}<input required={required} type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} className={inputClass} /></label>;

  return <form onSubmit={submit} className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 md:grid-cols-2">
      {field('Nom', 'name', 'text', true)}
      {field('Raison sociale', 'legalName')}
      {field('SIRET', 'siretNumber')}
      {field('Numéro de TVA', 'vatNumber')}
      {field('Email', 'email', 'email')}
      {field('Téléphone', 'phone', 'tel')}
    </div>
    <section className="space-y-4 rounded-lg border border-stone-200 bg-stone-50 p-4">
      <h2 className="text-base font-semibold text-stone-800">Adresse</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">{field('Rue', 'street1')}</div>
        {field('Complément d’adresse', 'street2')}
        {field('Code postal', 'postalCode')}
        {field('Ville', 'city')}
        {field('Pays', 'countryCode')}
      </div>
    </section>
    <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="text-sm font-semibold text-blue-700 hover:underline">{showAdvanced ? 'Masquer les options avancées' : 'Options avancées'}</button>
    {showAdvanced && <div className="grid gap-4 border-t border-stone-100 pt-4 md:grid-cols-2">
      {field('SIREN', 'sirenNumber')}
      {field('Nom du contact', 'contactName')}
      {field('Site web', 'website', 'url')}
      <label className="text-sm font-medium text-stone-700 md:col-span-2">Notes<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className={`${inputClass} min-h-20`} /></label>
    </div>}
    <div className="flex items-center justify-between gap-4"><button disabled={saving} className="rounded-md bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Création...' : 'Ajouter'}</button>{error && <p className="text-sm text-red-600">{error}</p>}</div>
  </form>;
}
