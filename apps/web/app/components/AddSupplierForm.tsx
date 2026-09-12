'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export type Supplier = { id: string; name: string; reference?: string | null; email?: string | null; phone?: string | null; city?: string | null; _count?: { purchases: number; invoices: number } };

export default function AddSupplierForm({ onCreated }: { onCreated: (supplier: Supplier) => void }) {
  const api = useApiClient();
  const [name, setName] = useState('');
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError('');
    if (!name.trim()) { setError('Le nom est obligatoire.'); return; }
    setSaving(true);
    try {
      const response = await api.post('/suppliers', { name, reference: reference || undefined, email: email || undefined, phone: phone || undefined });
      if (!response.ok) throw new Error();
      onCreated(await response.json()); setName(''); setReference(''); setEmail(''); setPhone('');
    } catch { setError('Impossible de créer le fournisseur.'); } finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="grid gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm md:grid-cols-5">
    <label className="text-sm font-medium text-stone-700">Nom<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
    <label className="text-sm font-medium text-stone-700">Référence<input value={reference} onChange={(event) => setReference(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
    <label className="text-sm font-medium text-stone-700">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
    <label className="text-sm font-medium text-stone-700">Téléphone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>
    <div className="flex items-end"><button disabled={saving} className="w-full rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Création...' : 'Ajouter'}</button></div>
    {error && <p className="text-sm text-red-600 md:col-span-5">{error}</p>}
  </form>;
}
