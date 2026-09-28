'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';
import type { DepositQuote } from './QuotesRequiringDeposit';

type Props = { quote: DepositQuote; onSaved: () => void; onClose: () => void };

const methods = [{ value: 'BANK_TRANSFER', label: 'Virement' }, { value: 'CARD', label: 'Carte bancaire' }, { value: 'CASH', label: 'Espèces' }, { value: 'CHECK', label: 'Chèque' }, { value: 'OTHER', label: 'Autre' }];

export default function AddDepositForm({ quote, onSaved, onClose }: Props) {
  const api = useApiClient();
  const [amount, setAmount] = useState(quote.depositRemaining.toFixed(2));
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState('BANK_TRANSFER');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const response = await api.post(`/quotes/${quote.id}/deposit`, { amount: Number(amount), paidAt, method });
      if (!response.ok) throw new Error();
      onSaved();
    } catch { setError('Impossible d’enregistrer cet acompte.'); } finally { setSaving(false); }
  }

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"><form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Enregistrer un acompte reçu</h2><button type="button" onClick={onClose} className="text-sm text-slate-500">Fermer</button></div><p className="mb-4 rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">Ce montant sera {quote.depositInvoiceNumber ? <>ajouté à la facture d’acompte <strong>{quote.depositInvoiceNumber}</strong></> : <>enregistré sur une nouvelle facture d’acompte brouillon</>}.</p><div className="mb-4 text-sm text-slate-600">{quote.number} · {quote.customerName || 'Client'}<br />Reste à recevoir : <strong>{quote.depositRemaining.toFixed(2)} {quote.currency}</strong></div><div className="space-y-3"><label className="block text-sm">Montant reçu<input required type="number" min="0.01" max={quote.depositRemaining} step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm">Date<input required type="date" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" /></label><label className="block text-sm">Mode de règlement<select value={method} onChange={(event) => setMethod(event.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2">{methods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Annuler</button><button disabled={saving} className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div></form></div>;
}