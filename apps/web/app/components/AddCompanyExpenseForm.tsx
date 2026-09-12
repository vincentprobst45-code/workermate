'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export interface CompanyExpense {
  id: string;
  label: string;
  category: string;
  taxExclusiveAmount: number | string | null;
  vatAmount: number | string;
  taxInclusiveAmount: number | string;
  currency: string;
  dueDate: string;
  paidAt?: string | null;
  recurrenceUnit?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null;
  recurrenceInterval?: number | null;
  recurrenceStartDate?: string | null;
  recurrenceEndDate?: string | null;
  nextDueDate?: string | null;
  paymentAccountId?: string | null;
  bankTransactionId?: string | null;
}

interface AddCompanyExpenseFormProps {
  paymentAccounts?: Array<{ id: string; name: string }>;
  onCreated: (expense: CompanyExpense) => void;
  onCancel: () => void;
}

const categories = [
  ['PURCHASE', 'Achats'],
  ['SOCIAL_COST', 'Charges sociales'],
  ['RENT', 'Loyer'],
  ['INSURANCE', 'Assurance'],
  ['SUBSCRIPTION', 'Abonnement'],
  ['VAT_DUE', 'TVA à payer'],
  ['TAXES', 'Impôts et taxes'],
  ['LOAN_REPAYMENT', 'Remboursement d’emprunt'],
];

export default function AddCompanyExpenseForm({ paymentAccounts = [], onCreated, onCancel }: AddCompanyExpenseFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState({ label: '', category: 'PURCHASE', taxExclusiveAmount: '', vatAmount: '', currency: 'EUR', paymentAccountId: '', dueDate: new Date().toISOString().slice(0, 10), paidAt: '', recurring: false, recurrenceUnit: 'MONTHLY', recurrenceInterval: '1', recurrenceStartDate: new Date().toISOString().slice(0, 10), recurrenceEndDate: '', nextDueDate: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/company-expenses', {
        label: form.label.trim(),
        category: form.category,
        taxExclusiveAmount: Number(form.taxExclusiveAmount),
        vatAmount: Number(form.vatAmount || 0),
        taxInclusiveAmount: Number(form.taxExclusiveAmount) + Number(form.vatAmount || 0),
        currency: form.currency,
        paymentAccountId: form.paymentAccountId || undefined,
        dueDate: form.dueDate,
        paidAt: form.paidAt || undefined,
        recurrenceUnit: form.recurring ? form.recurrenceUnit : undefined,
        recurrenceInterval: form.recurring ? Number(form.recurrenceInterval) : undefined,
        recurrenceStartDate: form.recurring ? form.recurrenceStartDate : undefined,
        recurrenceEndDate: form.recurring && form.recurrenceEndDate ? form.recurrenceEndDate : undefined,
        nextDueDate: form.recurring ? form.nextDueDate : undefined,
      });
      if (!response.ok) throw new Error('Erreur');
      onCreated(await response.json() as CompanyExpense);
    } catch {
      setError('Impossible d’enregistrer la dépense.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Libellé<input required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Catégorie<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Montant HT<input required min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.taxExclusiveAmount} onChange={(event) => setForm({ ...form, taxExclusiveAmount: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Devise<input required maxLength={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 uppercase" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></label>
        <label className="text-sm font-medium text-slate-700">Compte bancaire<select className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.paymentAccountId} onChange={(event) => setForm({ ...form, paymentAccountId: event.target.value })}><option value="">Non renseigné</option>{paymentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Montant de TVA<input min="0" step="0.01" type="number" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.vatAmount} onChange={(event) => setForm({ ...form, vatAmount: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Échéance<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Payée le<input type="date" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2" value={form.paidAt} onChange={(event) => setForm({ ...form, paidAt: event.target.value })} /></label>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={form.recurring} onChange={(event) => setForm({ ...form, recurring: event.target.checked })} />Dépense récurrente</label>
      {form.recurring && <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-amber-200 bg-white p-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Récurrence<select required className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.recurrenceUnit} onChange={(event) => setForm({ ...form, recurrenceUnit: event.target.value as typeof form.recurrenceUnit })}><option value="DAILY">Tous les jours</option><option value="WEEKLY">Toutes les semaines</option><option value="MONTHLY">Tous les mois</option><option value="YEARLY">Tous les ans</option></select></label><label className="text-sm font-medium text-slate-700">Intervalle<input required min="1" step="1" type="number" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.recurrenceInterval} onChange={(event) => setForm({ ...form, recurrenceInterval: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Début de récurrence<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.recurrenceStartDate} onChange={(event) => setForm({ ...form, recurrenceStartDate: event.target.value })} /></label><label className="text-sm font-medium text-slate-700">Prochaine échéance<input required type="date" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.nextDueDate} onChange={(event) => setForm({ ...form, nextDueDate: event.target.value })} /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Fin de récurrence<input type="date" min={form.recurrenceStartDate} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" value={form.recurrenceEndDate} onChange={(event) => setForm({ ...form, recurrenceEndDate: event.target.value })} /></label></div>}
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700">Annuler</button><button type="submit" disabled={saving} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Enregistrement...' : 'Ajouter la dépense'}</button></div>
    </form>
  );
}
