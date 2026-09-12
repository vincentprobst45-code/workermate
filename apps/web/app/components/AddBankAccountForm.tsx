'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export interface PaymentAccount {
  id: string;
  name: string;
  bankName?: string | null;
  accountHolderName: string;
  iban: string;
  bic?: string | null;
  currency: string;
  openingBalance: number | string;
  openingBalanceDate?: string | null;
  archivedAt?: string | null;
}

interface AddBankAccountFormProps {
  initialAccount?: PaymentAccount;
  onCreated: (account: PaymentAccount) => void;
  onUpdated?: (account: PaymentAccount) => void;
  onCancel: () => void;
}

export default function AddBankAccountForm({ initialAccount, onCreated, onUpdated, onCancel }: AddBankAccountFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState(() => ({
    name: initialAccount?.name ?? '',
    bankName: initialAccount?.bankName ?? '',
    accountHolderName: initialAccount?.accountHolderName ?? '',
    iban: initialAccount?.iban ?? '',
    bic: initialAccount?.bic ?? '',
    currency: initialAccount?.currency ?? 'EUR',
    openingBalance: initialAccount?.openingBalance?.toString() ?? '',
    openingBalanceDate: initialAccount?.openingBalanceDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    isDefault: false,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = { ...form, openingBalance: Number(form.openingBalance || 0) };
      const response = initialAccount
        ? await api.put(`/payment-accounts/${initialAccount.id}`, payload)
        : await api.post('/payment-accounts', payload);
      if (!response.ok) {
        throw new Error('Erreur');
      }
      const account = await response.json() as PaymentAccount;
      if (initialAccount) onUpdated?.(account);
      else onCreated(account);
    } catch {
      setError('Impossible de créer le compte bancaire.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Nom du compte
          <input required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Banque
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.bankName} onChange={(event) => setForm({ ...form, bankName: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Titulaire
          <input required className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.accountHolderName} onChange={(event) => setForm({ ...form, accountHolderName: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          IBAN
          <input required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 uppercase" value={form.iban} onChange={(event) => setForm({ ...form, iban: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          BIC
          <input className="mt-1 w-full rounded border border-slate-300 px-3 py-2 uppercase" value={form.bic} onChange={(event) => setForm({ ...form, bic: event.target.value })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Devise
          <input required maxLength={3} className="mt-1 w-full rounded border border-slate-300 px-3 py-2 uppercase" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Solde initial
          <input required step="0.01" type="number" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.openingBalance} onChange={(event) => setForm({ ...form, openingBalance: event.target.value })} placeholder="0,00" />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Solde au
          <input required type="date" className="mt-1 w-full rounded border border-slate-300 px-3 py-2" value={form.openingBalanceDate} onChange={(event) => setForm({ ...form, openingBalanceDate: event.target.value })} />
        </label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />
        Utiliser comme compte bancaire principal
      </label>
      {error && <p className="mt-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700">Annuler</button>
        <button type="submit" disabled={saving} className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Enregistrement...' : initialAccount ? 'Enregistrer les modifications' : 'Ajouter le compte'}</button>
      </div>
    </form>
  );
}