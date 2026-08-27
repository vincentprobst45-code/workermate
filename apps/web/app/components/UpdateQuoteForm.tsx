'use client';

import { QuoteStatus, WorkOrderItemType } from '@prisma/client';
import { LineItemType as WorkOrderItemType, QuoteStatus } from '@prisma/client';
import { type FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import type { Quote, QuoteItem } from './QuotesList';

export type UpdateQuoteFormProps = {
  quote: Quote;
  onUpdated: (quote: Quote) => void;
  onChange?: (quote: Quote) => void;
};

type EditableQuote = Quote & { items: QuoteItem[] };

const quoteStatuses: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'ACCEPTED', label: 'Accepté' },
  { value: 'REJECTED', label: 'Refusé' },
  { value: 'EXPIRED', label: 'Expiré' },
];

const itemTypes: Array<{ value: WorkOrderItemType; label: string }> = [
  { value: 'LABOR', label: 'Travaux' },
  { value: 'MATERIAL', label: 'Matériel' },
  { value: 'EQUIPMENT', label: 'Équipement' },
  { value: 'TRAVEL', label: 'Déplacement' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Autre' },
];

const inputClass = 'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

function toDateTimeLocal(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function createEmptyItem(position: number): QuoteItem {
  return {
    id: `draft-${crypto.randomUUID()}`,
    quoteId: 'draft-quote',
    position,
    title: '',
    description: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    vatRate: 20,
    total: 0,
  };
}

function recomputeQuote(quote: EditableQuote): EditableQuote {
  let subtotal = 0;
  let vatAmount = 0;
  const items = quote.items.map((item, position) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const vatRate = Number(item.vatRate) || 0;
    const lineSubtotal = roundMoney(quantity * unitPrice);
    const lineVat = roundMoney(lineSubtotal * vatRate / 100);
    subtotal += lineSubtotal;
    vatAmount += lineVat;
    return { ...item, position, quantity, unitPrice, vatRate, subtotal: lineSubtotal, total: roundMoney(lineSubtotal + lineVat) };
  });
  subtotal = roundMoney(subtotal);
  vatAmount = roundMoney(vatAmount);
  return { ...quote, items, subtotal, vatAmount, total: roundMoney(subtotal + vatAmount) };
  return {
    ...quote,
    items,
    subtotal,
    vatAmount,
    total: roundMoney(subtotal + vatAmount),
    lineNetTotal: subtotal,
    taxExclusiveAmount: subtotal,
    taxInclusiveAmount: roundMoney(subtotal + vatAmount),
  };
}

function normalizeQuote(quote: Quote): EditableQuote {
  return recomputeQuote({
    ...quote,
    issueDate: toDateTimeLocal(quote.issueDate),
    validUntil: toDateTimeLocal(quote.validUntil),
    workOrderStartDate: toDateTimeLocal(quote.workOrderStartDate),
    workOrderEndDate: toDateTimeLocal(quote.workOrderEndDate),
    items: quote.items.map((item) => ({ ...item })),
  });
}

export default function UpdateQuoteForm({ quote, onUpdated, onChange }: UpdateQuoteFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState<EditableQuote>(() => normalizeQuote(quote));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    onChange?.(form);
  }, [form, onChange]);

  function updateForm(patch: Partial<EditableQuote>) {
    setForm((current) => recomputeQuote({ ...current, ...patch }));
  }

  function updateItem(itemId: string, patch: Partial<QuoteItem>) {
    setForm((current) => recomputeQuote({
      ...current,
      items: current.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await api.put(`/quotes/${form.id}`, {
        title: form.title,
        issueDate: form.issueDate,
        validUntil: form.validUntil || undefined,
        workOrderReference: form.workOrderReference,
        workOrderTitle: form.workOrderTitle,
        tenantName: form.tenantName,
        tenantStreet1: form.tenantStreet1,
        tenantStreet2: form.tenantStreet2,
        tenantPostalCode: form.tenantPostalCode,
        tenantCity: form.tenantCity,
        tenantSiretNumber: form.tenantSiretNumber,
          tenantSirenNumber: form.tenantSirenNumber || form.tenantSiretNumber.replace(/\D/g, '').slice(0, 9),
          tenantCountryCode: form.tenantCountryCode || 'FR',
        tenantVatNumber: form.tenantVatNumber,
        tenantEmail: form.tenantEmail,
        tenantPhoneNumber: form.tenantPhoneNumber,
        tenantIban: form.tenantIban,
        tenantBic: form.tenantBic,
        customerFirstName: form.customerFirstName,
        customerLastName: form.customerLastName,
          customerName: form.customerName || `${form.customerFirstName} ${form.customerLastName}`.trim(),
          customerCountryCode: form.customerCountryCode || 'FR',
        customerStreet1: form.customerStreet1,
        customerStreet2: form.customerStreet2,
        customerPostalCode: form.customerPostalCode,
        customerCity: form.customerCity,
        customerEmail: form.customerEmail,
        customerPhoneNumber: form.customerPhoneNumber,
        customerVatNumber: form.customerVatNumber,
        workOrderStartDate: form.workOrderStartDate || undefined,
        workOrderEndDate: form.workOrderEndDate || undefined,
        status: form.status,
        currency: form.currency,
        subtotal: form.subtotal,
        vatAmount: form.vatAmount,
        total: form.total,
        paymentTerms: form.paymentTerms,
        legalMentions: form.legalMentions,
        notes: form.notes,
        depositAmount: form.depositAmount,
        pdfFileId: form.pdfFileId,
        quoteItems: form.items.map((item, position) => ({
          ...item,
          position,
          sellerItemIdentifier: item.sellerItemIdentifier,
          unitCode: item.unitCode || 'C62',
          subtotal: item.subtotal ?? item.quantity * item.unitPrice,
          vatCategory: item.vatCategory || 'STANDARD',
        })),
      });
      if (!response.ok) throw new Error('Erreur');
      const updatedQuote: Quote = await response.json();
      onUpdated(updatedQuote);
    } catch (err) {
      setError('Erreur lors de la mise à jour du devis.');
      console.log(err)
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} className="space-y-5">
      {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm"><span>Titre</span><input className={inputClass} value={form.title} onChange={(event) => updateForm({ title: event.target.value })} required /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Statut</span><select className={inputClass} value={form.status} onChange={(event) => updateForm({ status: event.target.value as QuoteStatus })}>{quoteStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-sm"><span>Date d&apos;émission</span><input type="datetime-local" className={inputClass} value={form.issueDate} onChange={(event) => updateForm({ issueDate: event.target.value })} required /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Valide jusqu&apos;au</span><input type="datetime-local" className={inputClass} value={form.validUntil} onChange={(event) => updateForm({ validUntil: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Référence chantier</span><input className={inputClass} value={form.workOrderReference || ''} onChange={(event) => updateForm({ workOrderReference: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-sm"><span>Titre chantier</span><input className={inputClass} value={form.workOrderTitle || ''} onChange={(event) => updateForm({ workOrderTitle: event.target.value })} /></label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2"><span>Notes</span><textarea className={`${inputClass} min-h-20`} value={form.notes || ''} onChange={(event) => updateForm({ notes: event.target.value })} /></label>
      </div>

      <section className="space-y-3 border-t border-zinc-200 pt-4">
        <div className="flex items-center justify-between"><h4 className="font-medium text-zinc-900">Lignes du devis</h4><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => updateForm({ items: [...form.items, createEmptyItem(form.items.length)] })}>Ajouter une ligne</button></div>
        {form.items.map((item) => <div key={item.id} className="grid gap-2 border border-zinc-200 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-sm lg:col-span-2"><span>Titre</span><input className={inputClass} value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} required /></label>
          <label className="flex flex-col gap-1 text-sm"><span>Type</span><select className={inputClass} value={item.type} onChange={(event) => updateItem(item.id, { type: event.target.value as WorkOrderItemType })}>{itemTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <label className="flex flex-col gap-1 text-sm"><span>Quantité</span><input type="number" min="0" step="0.01" className={inputClass} value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: event.target.valueAsNumber || 0 })} /></label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2"><span>Description</span><input className={inputClass} value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm"><span>Unité</span><input className={inputClass} value={item.unit || ''} onChange={(event) => updateItem(item.id, { unit: event.target.value })} /></label>
          <label className="flex flex-col gap-1 text-sm"><span>Prix unitaire</span><input type="number" min="0" step="0.01" className={inputClass} value={item.unitPrice} onChange={(event) => updateItem(item.id, { unitPrice: event.target.valueAsNumber || 0 })} /></label>
          <label className="flex flex-col gap-1 text-sm"><span>TVA (%)</span><input type="number" min="0" step="0.01" className={inputClass} value={item.vatRate} onChange={(event) => updateItem(item.id, { vatRate: event.target.valueAsNumber || 0 })} /></label>
          <div className="flex items-end justify-between gap-2 text-sm"><span>Total: {item.total.toFixed(2)} {form.currency}</span><button type="button" className="rounded border border-red-300 px-2 py-1 text-red-700" onClick={() => updateForm({ items: form.items.length === 1 ? [createEmptyItem(0)] : form.items.filter((current) => current.id !== item.id) })}>Supprimer</button></div>
        </div>)}
      </section>

      <div className="grid gap-3 sm:grid-cols-3"><label className="flex flex-col gap-1 text-sm"><span>Sous-total HT</span><input className={`${inputClass} bg-zinc-100`} value={form.subtotal} readOnly /></label><label className="flex flex-col gap-1 text-sm"><span>TVA</span><input className={`${inputClass} bg-zinc-100`} value={form.vatAmount} readOnly /></label><label className="flex flex-col gap-1 text-sm"><span>Total TTC</span><input className={`${inputClass} bg-zinc-100`} value={form.total} readOnly /></label></div>
      <button type="submit" disabled={submitting} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}</button>
    </form>
  );
}
