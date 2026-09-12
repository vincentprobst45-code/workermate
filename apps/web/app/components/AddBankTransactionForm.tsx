'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export interface BankTransaction {
  id: string;
  amount: number | string;
  direction: 'CREDIT' | 'DEBIT';
  currency: string;
  transactionType?: 'STANDARD' | 'TRANSFER' | 'FEE' | 'INTEREST' | 'REFUND' | 'CASH_WITHDRAWAL';
  reconciliationId?: string | null;
  transactionDate: string;
  label?: string | null;
  reference?: string | null;
  externalId?: string | null;
  paymentAccountId: string;
  paymentAccount?: { id: string; name: string };
  payments?: Array<{ id: string; invoice?: { number?: string | null } | null }>;
}

interface AddBankTransactionFormProps {
  paymentAccounts: Array<{ id: string; name: string }>;
  onCreated: (transaction: BankTransaction) => void;
  onCancel: () => void;
}

export default function AddBankTransactionForm({ paymentAccounts, onCreated, onCancel }: AddBankTransactionFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState({ paymentAccountId: paymentAccounts[0]?.id ?? '', amount: '', direction: 'CREDIT' as 'CREDIT' | 'DEBIT', currency: 'EUR', transactionDate: new Date().toISOString().slice(0, 10), label: '', reference: '', externalId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/bank-transactions', { ...form, amount: Number(form.amount), externalId: form.externalId.trim() || undefined });
      if (!response.ok) throw new Error('Erreur');
      onCreated(await response.json() as BankTransaction);
    } catch {
      setError('Impossible d’enregistrer la transaction bancaire.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Compte bancaire<select required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.paymentAccountId} onChange={(event) => setForm({ ...form, paymentAccountId: event.target.value })}>{paymentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Montant<input required min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Montant positif" /></label>
        <label className="text-sm font-medium text-slate-700">Type<select required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.direction} onChange={(event) => setForm({ ...form, direction: event.target.value as 'CREDIT' | 'DEBIT' })}><option value="CREDIT">Entrée</option><option value="DEBIT">Sortie</option></select></label>
        <label className="text-sm font-medium text-slate-700">Devise<input required maxLength={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 uppercase" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></label>
        <label className="text-sm font-medium text-slate-700">Date<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Libellé<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Référence<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Identifiant bancaire<input className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.externalId} onChange={(event) => setForm({ ...form, externalId: event.target.value })} /></label>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">Annuler</button><button type="submit" disabled={saving || paymentAccounts.length === 0} className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Enregistrement...' : 'Ajouter la transaction'}</button></div>
    </form>
  );
}
