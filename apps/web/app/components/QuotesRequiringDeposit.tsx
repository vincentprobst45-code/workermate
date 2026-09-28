'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

export type DepositQuote = {
  id: string;
  number: string;
  title: string;
  customerName?: string;
  currency: string;
  depositAmount: number;
  depositReceived: number;
  depositRemaining: number;
  depositInvoiceNumber?: string;
};

type Props = { onSelect: (quote: DepositQuote) => void; onClose: () => void };

export default function QuotesRequiringDeposit({ onSelect, onClose }: Props) {
  const api = useApiClient();
  const [quotes, setQuotes] = useState<DepositQuote[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    void api.get('/quotes/requiring-deposit').then(async (response) => {
      if (!response.ok) throw new Error();
      const data = await response.json() as DepositQuote[];
      if (!cancelled) setQuotes(data);
    }).catch(() => { if (!cancelled) setError('Impossible de charger les devis nécessitant un acompte.'); });
    return () => { cancelled = true; };
  }, [api]);

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="deposit-quotes-title">
      <div className="mb-4 flex items-center justify-between"><h2 id="deposit-quotes-title" className="text-lg font-semibold text-slate-900">Devis nécessitant un acompte</h2><button type="button" onClick={onClose} className="text-sm text-slate-500">Fermer</button></div>
      {error && <p className="mb-3 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {quotes.length === 0 && !error && <p className="py-8 text-center text-sm text-slate-500">Aucun acompte restant à enregistrer.</p>}
      <div className="space-y-2">{quotes.map((quote) => <button type="button" key={quote.id} onClick={() => onSelect(quote)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 text-left hover:border-indigo-400 hover:bg-indigo-50"><span><strong className="block text-slate-900">{quote.number} · {quote.title}</strong><span className="text-sm text-slate-500">{quote.customerName || 'Client'}</span></span><span className="text-right text-sm"><strong className="block text-indigo-700">{quote.depositRemaining.toFixed(2)} {quote.currency}</strong><span className="text-slate-500">reste à recevoir</span></span></button>)}</div>
    </div>
  </div>;
}