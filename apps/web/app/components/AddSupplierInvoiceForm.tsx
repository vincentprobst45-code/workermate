'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';
import type { Supplier } from './AddSupplierForm';
import type { SupplierInvoice } from './SupplierInvoicesList';

type SupplierInvoiceForm = {
  number: string;
  issueDate: string;
  receivedDate: string;
  dueDate: string;
  kind: 'INVOICE' | 'CREDIT_NOTE';
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
  currency: string;
  allowanceTotal: string;
  chargeTotal: string;
  taxExclusiveAmount: string;
  vatAmount: string;
  taxInclusiveAmount: string;
  deductibleVatAmount: string;
  notes: string;
  internalNotes: string;
};

type SupplierInvoiceItemForm = {
  title: string;
  description: string;
  quantity: string;
  unitCode: string;
  unitLabel: string;
  unitPrice: string;
  taxExclusiveAmount: string;
  vatRate: string;
  vatAmount: string;
  deductibleVatAmount: string;
  taxInclusiveAmount: string;
};

type SupplierInvoiceVatBreakdownForm = {
  vatCategory: string;
  vatRate: string;
  taxableAmount: string;
  vatAmount: string;
  deductibleVatAmount: string;
};

const emptyForm: SupplierInvoiceForm = {
  number: '',
  issueDate: new Date().toISOString().slice(0, 10),
  receivedDate: '',
  dueDate: '',
  kind: 'INVOICE',
  status: 'CONFIRMED',
  currency: 'EUR',
  allowanceTotal: '0',
  chargeTotal: '0',
  taxExclusiveAmount: '0',
  vatAmount: '0',
  taxInclusiveAmount: '0',
  deductibleVatAmount: '0',
  notes: '',
  internalNotes: '',
};

const emptyItem: SupplierInvoiceItemForm = {
  title: '',
  description: '',
  quantity: '1',
  unitCode: '',
  unitLabel: '',
  unitPrice: '',
  taxExclusiveAmount: '0',
  vatRate: '',
  vatAmount: '0',
  deductibleVatAmount: '0',
  taxInclusiveAmount: '0',
};

const emptyVatBreakdown: SupplierInvoiceVatBreakdownForm = {
  vatCategory: 'STANDARD',
  vatRate: '',
  taxableAmount: '0',
  vatAmount: '0',
  deductibleVatAmount: '0',
};

type AddSupplierInvoiceFormProps = {
  supplier: Supplier;
  initialInvoice?: SupplierInvoice;
  onCreated: () => void;
  onUpdated?: () => void;
};

function dateValue(value?: string | null) {
  return value ? value.slice(0, 10) : '';
}

export default function AddSupplierInvoiceForm({ supplier, initialInvoice, onCreated, onUpdated }: AddSupplierInvoiceFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState<SupplierInvoiceForm>(() => initialInvoice ? {
    number: initialInvoice.supplierInvoiceNumber,
    issueDate: dateValue(initialInvoice.issueDate),
    receivedDate: dateValue(initialInvoice.receivedDate),
    dueDate: dateValue(initialInvoice.dueDate),
    kind: initialInvoice.kind || 'INVOICE',
    status: initialInvoice.status,
    currency: initialInvoice.currency || 'EUR',
    allowanceTotal: String(initialInvoice.allowanceTotal || 0),
    chargeTotal: String(initialInvoice.chargeTotal || 0),
    taxExclusiveAmount: String(initialInvoice.taxExclusiveAmount),
    vatAmount: String(initialInvoice.vatAmount),
    taxInclusiveAmount: String(initialInvoice.taxInclusiveAmount),
    deductibleVatAmount: String(initialInvoice.deductibleVatAmount || 0),
    notes: initialInvoice.notes || '',
    internalNotes: initialInvoice.internalNotes || '',
  } : emptyForm);
  const [items, setItems] = useState<SupplierInvoiceItemForm[]>(() => initialInvoice?.items.map((item) => ({ title: item.title, description: item.description || '', quantity: String(item.quantity), unitCode: item.unitCode || '', unitLabel: item.unitLabel || '', unitPrice: item.unitPrice == null ? '' : String(item.unitPrice), taxExclusiveAmount: String(item.taxExclusiveAmount), vatRate: item.vatRate == null ? '' : String(item.vatRate), vatAmount: String(item.vatAmount || 0), deductibleVatAmount: String(item.deductibleVatAmount || 0), taxInclusiveAmount: String(item.taxInclusiveAmount) })) || []);
  const [multipleVatRates, setMultipleVatRates] = useState(Boolean(initialInvoice?.vatBreakdowns?.length));
  const [vatBreakdowns, setVatBreakdowns] = useState<SupplierInvoiceVatBreakdownForm[]>(() => initialInvoice?.vatBreakdowns?.map((breakdown) => ({ vatCategory: breakdown.vatCategory, vatRate: breakdown.vatRate == null ? '' : String(breakdown.vatRate), taxableAmount: String(breakdown.taxableAmount), vatAmount: String(breakdown.vatAmount), deductibleVatAmount: String(breakdown.deductibleVatAmount) })) || []);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [vatAmountMessage, setVatAmountMessage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function update(field: keyof SupplierInvoiceForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateItem(index: number, field: keyof SupplierInvoiceItemForm, value: string) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems((current) => [...current, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function updateVatBreakdown(index: number, field: keyof SupplierInvoiceVatBreakdownForm, value: string) {
    setVatBreakdowns((current) => current.map((breakdown, breakdownIndex) => breakdownIndex === index ? { ...breakdown, [field]: value } : breakdown));
  }

  function amount(field: keyof SupplierInvoiceForm) {
    return Number(form[field]) || 0;
  }

  const lineNetTotal = items.reduce((total, item) => total + (Number(item.taxExclusiveAmount) || 0), 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const response = await (initialInvoice ? api.put(`/supplier-invoices/${initialInvoice.id}`, {
        supplierId: supplier.id,
        supplierInvoiceNumber: form.number,
        issueDate: form.issueDate,
        receivedDate: form.receivedDate || undefined,
        dueDate: form.dueDate || undefined,
        kind: form.kind,
        status: form.status,
        currency: form.currency,
        lineNetTotal,
        allowanceTotal: amount('allowanceTotal'),
        chargeTotal: amount('chargeTotal'),
        taxExclusiveAmount: amount('taxExclusiveAmount'),
        vatAmount: amount('vatAmount'),
        taxInclusiveAmount: amount('taxInclusiveAmount'),
        deductibleVatAmount: amount('deductibleVatAmount'),
        notes: form.notes || undefined,
        internalNotes: form.internalNotes || undefined,
        items: items.map((item, index) => ({ title: item.title, description: item.description || undefined, lineIdentifier: String(index + 1), quantity: Number(item.quantity) || 0, unitCode: item.unitCode || undefined, unitLabel: item.unitLabel || undefined, unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined, taxExclusiveAmount: Number(item.taxExclusiveAmount) || 0, vatRate: item.vatRate ? Number(item.vatRate) : undefined, vatAmount: Number(item.vatAmount) || 0, deductibleVatAmount: Number(item.deductibleVatAmount) || 0, taxInclusiveAmount: Number(item.taxInclusiveAmount) || 0 })),
        vatBreakdowns: multipleVatRates ? vatBreakdowns.map((breakdown) => ({ vatCategory: breakdown.vatCategory, vatRate: breakdown.vatRate ? Number(breakdown.vatRate) : undefined, taxableAmount: Number(breakdown.taxableAmount) || 0, vatAmount: Number(breakdown.vatAmount) || 0, deductibleVatAmount: Number(breakdown.deductibleVatAmount) || 0 })) : undefined,
      }) : api.post('/supplier-invoices', {
        supplierId: supplier.id,
        supplierInvoiceNumber: form.number,
        issueDate: form.issueDate,
        receivedDate: form.receivedDate || undefined,
        dueDate: form.dueDate || undefined,
        kind: form.kind,
        status: form.status,
        currency: form.currency,
        lineNetTotal,
        allowanceTotal: amount('allowanceTotal'),
        chargeTotal: amount('chargeTotal'),
        taxExclusiveAmount: amount('taxExclusiveAmount'),
        vatAmount: amount('vatAmount'),
        taxInclusiveAmount: amount('taxInclusiveAmount'),
        deductibleVatAmount: amount('deductibleVatAmount'),
        notes: form.notes || undefined,
        internalNotes: form.internalNotes || undefined,
        items: items.map((item, index) => ({
          title: item.title,
          description: item.description || undefined,
          lineIdentifier: String(index + 1),
          quantity: Number(item.quantity) || 0,
          unitCode: item.unitCode || undefined,
          unitLabel: item.unitLabel || undefined,
          unitPrice: item.unitPrice ? Number(item.unitPrice) : undefined,
          taxExclusiveAmount: Number(item.taxExclusiveAmount) || 0,
          vatRate: item.vatRate ? Number(item.vatRate) : undefined,
          vatAmount: Number(item.vatAmount) || 0,
          deductibleVatAmount: Number(item.deductibleVatAmount) || 0,
          taxInclusiveAmount: Number(item.taxInclusiveAmount) || 0,
        })),
        vatBreakdowns: multipleVatRates ? vatBreakdowns.map((breakdown) => ({
          vatCategory: breakdown.vatCategory,
          vatRate: breakdown.vatRate ? Number(breakdown.vatRate) : undefined,
          taxableAmount: Number(breakdown.taxableAmount) || 0,
          vatAmount: Number(breakdown.vatAmount) || 0,
          deductibleVatAmount: Number(breakdown.deductibleVatAmount) || 0,
        })) : undefined,
      }));
      if (!response.ok) throw new Error();
      setForm({ ...emptyForm, issueDate: new Date().toISOString().slice(0, 10) });
      setItems([]);
      setMultipleVatRates(false);
      setVatBreakdowns([]);
      setVatAmountMessage(false);
      setShowAdvanced(false);
      if (initialInvoice) onUpdated?.();
      else onCreated();
    } catch {
      setError('Impossible d’enregistrer la facture.');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'mt-1 w-full rounded-md border border-stone-300 px-3 py-2';
  const field = (label: string, key: keyof SupplierInvoiceForm, type = 'text', required = false) => (
    <label className="text-sm font-medium text-stone-700">
      {label}
      <input required={required} type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} className={inputClass} />
    </label>
  );

  const itemField = (index: number, label: string, key: keyof SupplierInvoiceItemForm, type = 'text', required = false) => (
    <label className="text-sm font-medium text-stone-700">
      {label}
      <input required={required} type={type} value={items[index][key]} onChange={(event) => updateItem(index, key, event.target.value)} className={inputClass} />
    </label>
  );

  const vatBreakdownField = (index: number, label: string, key: keyof SupplierInvoiceVatBreakdownForm, type = 'number') => (
    <label className="text-sm font-medium text-stone-700">
      {label}
      <input type={type} value={vatBreakdowns[index][key]} onChange={(event) => updateVatBreakdown(index, key, event.target.value)} className={inputClass} />
    </label>
  );

  const vatAmountField = multipleVatRates ? <label className="text-sm font-medium text-stone-700" onClick={() => setVatAmountMessage(true)}>
    Montant de TVA
    <input type="number" value={form.vatAmount} disabled aria-describedby="vat-amount-help" className={`${inputClass} cursor-not-allowed bg-stone-100 text-stone-500`} />
    {vatAmountMessage && <span id="vat-amount-help" className="mt-1 block text-xs font-normal text-blue-700">Calculé à partir de la ventilation TVA</span>}
  </label> : field('Montant de TVA', 'vatAmount', 'number', true);

  return <form onSubmit={submit} className="space-y-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
    <div>
      <p className="text-sm font-semibold text-blue-900">{initialInvoice ? 'Modifier la facture fournisseur' : 'Nouvelle facture fournisseur'}</p>
      <p className="text-sm text-blue-800">{supplier.name}</p>
    </div>

    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {field('N° de facture', 'number', 'text', true)}
      {field('Date de facture', 'issueDate', 'date', true)}
      {field('Montant HT', 'taxExclusiveAmount', 'number', true)}
      {vatAmountField}
      {field('Montant TTC', 'taxInclusiveAmount', 'number', true)}
      {field('TVA déductible', 'deductibleVatAmount', 'number', true)}
    </div>

    <section className="space-y-4 rounded-lg border border-blue-100 bg-white/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-blue-900">Lignes de facture</h2>
          <p className="text-xs text-stone-500">Le total net est calculé à partir des montants HT des lignes.</p>
        </div>
        <button type="button" onClick={addItem} className="rounded-md border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">+ Ajouter une ligne</button>
      </div>
      {!items.length && <p className="text-sm text-stone-500">Aucune ligne ajoutée.</p>}
      {items.map((item, index) => <div key={index} className="space-y-3 rounded-md border border-stone-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-stone-800">Ligne {index + 1}</h3>
          <button type="button" onClick={() => removeItem(index)} className="text-sm font-semibold text-red-600 hover:underline">Supprimer</button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">{itemField(index, 'Désignation', 'title', 'text', true)}</div>
          {itemField(index, 'Quantité', 'quantity', 'number', true)}
          {itemField(index, 'Unité', 'unitLabel')}
          {itemField(index, 'Montant HT', 'taxExclusiveAmount', 'number', true)}
          {itemField(index, 'Montant TTC', 'taxInclusiveAmount', 'number', true)}
          {itemField(index, 'Taux de TVA', 'vatRate', 'number')}
          {itemField(index, 'TVA déductible', 'deductibleVatAmount', 'number')}
        </div>
      </div>)}
      <label className="block max-w-sm text-sm font-medium text-stone-700">Total net des lignes<input type="number" value={lineNetTotal.toFixed(2)} readOnly className={`${inputClass} bg-stone-100`} /></label>
    </section>

    <fieldset className="space-y-3">
      <legend className="text-sm font-semibold text-stone-800">TVA</legend>
      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="radio" name="vat-mode" checked={!multipleVatRates} onChange={() => { setMultipleVatRates(false); setVatBreakdowns([]); }} />
        Un seul taux de TVA
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
        <input type="radio" name="vat-mode" checked={multipleVatRates} onChange={() => { setMultipleVatRates(true); if (!vatBreakdowns.length) setVatBreakdowns([{ ...emptyVatBreakdown }, { ...emptyVatBreakdown }]); }} />
        Plusieurs taux de TVA
      </label>
      {multipleVatRates && <div className="space-y-3 rounded-lg border border-blue-100 bg-white/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-blue-900">Ventilation TVA</p>
          <button type="button" onClick={() => setVatBreakdowns((current) => [...current, { ...emptyVatBreakdown }])} className="rounded-md border border-blue-600 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">+ Ajouter un taux</button>
        </div>
        {vatBreakdowns.map((breakdown, index) => <div key={index} className="grid gap-4 rounded-md border border-stone-200 p-3 md:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm font-medium text-stone-700">Catégorie TVA<select value={breakdown.vatCategory} onChange={(event) => updateVatBreakdown(index, 'vatCategory', event.target.value)} className={inputClass}><option value="STANDARD">Taux normal</option><option value="ZERO">Taux zéro</option><option value="EXEMPT">Exonérée</option><option value="REVERSE_CHARGE">Autoliquidation</option><option value="INTRA_COMMUNITY_SUPPLY">Livraison intracommunautaire</option><option value="EXPORT">Export</option><option value="OUTSIDE_SCOPE">Hors champ</option></select></label>
          {vatBreakdownField(index, 'Taux de TVA', 'vatRate')}
          {vatBreakdownField(index, 'Base taxable', 'taxableAmount')}
          {vatBreakdownField(index, 'Montant de TVA', 'vatAmount')}
          {vatBreakdownField(index, 'TVA déductible', 'deductibleVatAmount')}
        </div>)}
      </div>}
    </fieldset>

    <button type="button" onClick={() => setShowAdvanced((value) => !value)} className="text-sm font-semibold text-blue-700 hover:underline">
      {showAdvanced ? 'Masquer les options avancées' : 'Options avancées'}
    </button>

    {showAdvanced && <div className="grid gap-4 border-t border-blue-100 pt-4 md:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-medium text-stone-700">Type de document<select value={form.kind} onChange={(event) => update('kind', event.target.value)} className={inputClass}><option value="INVOICE">Facture</option><option value="CREDIT_NOTE">Avoir</option></select></label>
      <label className="text-sm font-medium text-stone-700">Statut<select value={form.status} onChange={(event) => update('status', event.target.value)} className={inputClass}><option value="DRAFT">Brouillon</option><option value="CONFIRMED">Confirmée</option><option value="CANCELLED">Annulée</option></select></label>
      {field('Date de réception', 'receivedDate', 'date')}
      {field('Date d’échéance', 'dueDate', 'date')}
      {field('Devise', 'currency')}
      {field('Total des remises', 'allowanceTotal', 'number')}
      {field('Total des frais', 'chargeTotal', 'number')}
      <label className="text-sm font-medium text-stone-700 md:col-span-2">Notes<textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className={`${inputClass} min-h-20`} /></label>
      <label className="text-sm font-medium text-stone-700 md:col-span-2">Notes internes<textarea value={form.internalNotes} onChange={(event) => update('internalNotes', event.target.value)} className={`${inputClass} min-h-20`} /></label>
    </div>}

    <div className="flex items-center justify-between gap-4">
      <button disabled={saving} className="rounded-md bg-blue-600 px-5 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : initialInvoice ? 'Enregistrer les modifications' : 'Enregistrer'}</button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  </form>;
}
