'use client';

import { PaymentMethod } from '@prisma/client';
import { type FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export interface Payment {
  id: string;
  invoiceId: string;
  tenantId: string;
  amount: number;
  paidAt: string;
  method?: PaymentMethod | null;
  reference?: string | null;
  notes?: string | null;
}

interface AddPaymentFormProps {
  invoiceId?: string;
  invoices?: Array<{ id: string; number: string; customerName?: string; customerFirstName?: string; customerLastName?: string }>;
  onCreated: (payment: Payment) => void;
  onCancel: () => void;
}

function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default function AddPaymentForm({ invoiceId, invoices = [], onCreated, onCancel }: AddPaymentFormProps) {
  const api = useApiClient();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId ?? '');
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(() => toDatetimeLocal(new Date()));
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Le montant doit être supérieur à 0.');
      return;
    }

    if (!paidAt) {
      setError('La date du paiement est obligatoire.');
      return;
    }

    if (!selectedInvoiceId) {
      setError('La facture est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      const response = await api.post(`/payments/invoice/${selectedInvoiceId}`, {
        amount: numericAmount,
        paidAt,
        method: method || undefined,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      if (!response.ok) {
        throw new Error('Erreur');
      }

      onCreated((await response.json()) as Payment);
    } catch {
      setError('Erreur lors de l’ajout du paiement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-emerald-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {!invoiceId && (
          <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-zinc-700">Facture *</span>
            <select className="rounded-md border border-zinc-300 px-3 py-2 text-sm" value={selectedInvoiceId} onChange={(event) => setSelectedInvoiceId(event.target.value)} required>
              <option value="">-- Sélectionner une facture --</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.number} - {invoice.customerName || [invoice.customerFirstName, invoice.customerLastName].filter(Boolean).join(' ') || 'Client'}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Montant *</span>
          <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Date du paiement *</span>
          <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} required />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Méthode</span>
          <select className="rounded-md border border-zinc-300 px-3 py-2 text-sm" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod | '')}>
            <option value="">Non précisée</option>
            <option value="BANK_TRANSFER">Virement</option>
            <option value="CARD">Carte</option>
            <option value="CASH">Espèces</option>
            <option value="CHECK">Chèque</option>
            <option value="OTHER">Autre</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-zinc-700">Référence</span>
          <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" value={reference} onChange={(event) => setReference(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Notes</span>
          <input className="rounded-md border border-zinc-300 px-3 py-2 text-sm" value={notes} onChange={(event) => setNotes(event.target.value)} />
        </label>
      </div>
      {error && <p className="mt-3 rounded bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
          {saving ? 'Ajout...' : 'Enregistrer le paiement'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100">
          Annuler
        </button>
      </div>
    </form>
  );
}
