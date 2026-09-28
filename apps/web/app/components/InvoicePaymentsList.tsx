'use client';

import { PaymentMethod, PaymentStatus, InvoiceStatus } from '@prisma/client';
import { useState } from 'react';
import { useApiClient } from '../api-client';
import type { Invoice } from './InvoicesList';
import type { Payment } from './AddPaymentForm';

type Props = {
  invoice: Invoice;
  onChanged: (invoice: Invoice) => void;
};

const methodLabels: Partial<Record<PaymentMethod, string>> = {
  BANK_TRANSFER: 'Virement',
  CARD: 'Carte',
  CASH: 'Espèces',
  CHECK: 'Chèque',
  OTHER: 'Autre',
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(Number(value || 0));
}

function date(value: string) {
  return new Date(value).toLocaleDateString('fr-FR');
}

export default function InvoicePaymentsList({ invoice, onChanged }: Props) {
  const api = useApiClient();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dialogPayment, setDialogPayment] = useState<Payment | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [error, setError] = useState('');
  const payments = invoice.payments ?? [];
  const isDraft = invoice.status === InvoiceStatus.DRAFT;

  async function confirmPaymentAction() {
    if (!dialogPayment) return;
    const reason = cancellationReason.trim();
    if (!isDraft && !reason) {
      setError("La raison de l'annulation est obligatoire.");
      return;
    }
    setBusyId(dialogPayment.id);
    setError('');
    try {
      const response = isDraft
        ? await api.delete(`/payments/${dialogPayment.id}`)
        : await api.patch(`/payments/${dialogPayment.id}/cancel`, { reason });
      if (!response.ok) throw new Error();
      const refreshed = await api.get(`/invoices/${invoice.id}`);
      if (!refreshed.ok) throw new Error();
      onChanged(await refreshed.json() as Invoice);
      setDialogPayment(null);
      setCancellationReason('');
    } catch {
      setError('Impossible de modifier ce paiement.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-semibold text-slate-900">Paiements</h4>
        <span className="text-sm text-slate-600">{money(invoice.paidAmount ?? 0, invoice.currency)}</span>
      </div>
      {error && <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
      {payments.length === 0 ? <p className="mt-3 text-sm text-slate-600">Aucun paiement enregistré.</p> : (
        <ul className="mt-3 divide-y divide-slate-200">
          {payments.map((payment) => {
            const cancelled = payment.status === PaymentStatus.CANCELLED;
            return <li key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="text-sm">
                <p className={cancelled ? 'text-slate-400 line-through' : 'text-slate-800'}>{money(payment.amount, invoice.currency)} · {date(payment.paidAt)}</p>
                <p className="text-xs text-slate-500">{methodLabels[payment.method ?? 'OTHER'] ?? 'Autre'}{cancelled ? ' · Annulé' : ''}</p>
              </div>
              {!cancelled && <button type="button" disabled={busyId === payment.id} onClick={() => { setError(''); setCancellationReason(''); setDialogPayment(payment); }} className="text-sm font-medium text-red-700 hover:text-red-900 disabled:opacity-50">{isDraft ? 'Supprimer le paiement' : 'Annuler le paiement'}</button>}
            </li>;
          })}
        </ul>
      )}
      {dialogPayment && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"><h5 className="text-lg font-semibold text-slate-900">{isDraft ? 'Supprimer le paiement ?' : 'Annuler le paiement ?'}</h5>{isDraft ? <p className="mt-3 text-sm text-slate-600">Ce paiement sera supprimé définitivement et le total payé de la facture sera recalculé.</p> : <><p className="mt-3 text-sm text-slate-600">Un paiement d’une facture émise ne peut pas être supprimé. Il sera marqué comme annulé. Pour corriger la facture, créez une écriture inverse ou un avoir.</p><label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="payment-cancellation-reason">Raison de l’annulation<span className="text-red-700"> *</span><textarea id="payment-cancellation-reason" value={cancellationReason} onChange={(event) => { setCancellationReason(event.target.value); setError(''); }} rows={3} required placeholder="Indiquez pourquoi ce paiement est annulé" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal text-slate-900 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600" /></label></>}{error && <p className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setDialogPayment(null); setCancellationReason(''); setError(''); }} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Fermer</button><button type="button" disabled={busyId === dialogPayment.id || (!isDraft && !cancellationReason.trim())} onClick={() => void confirmPaymentAction()} className="rounded-md bg-red-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{isDraft ? 'Supprimer' : 'Annuler le paiement'}</button></div></div></div>}
    </section>
  );
}
