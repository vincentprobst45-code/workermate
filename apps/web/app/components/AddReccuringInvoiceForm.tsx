'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

interface Option { id: string; name?: string; firstName?: string | null; lastName?: string | null; company?: string | null; title?: string; reference?: string | null; }
interface Item { title: string; description: string; quantity: number; unitCode: string; unitLabel: string; unitPrice: number; type: string; vatCategory: string; vatRate: number; }

interface AddReccuringInvoiceFormProps {
  onCreated: (recurringInvoice: unknown) => void;
  onCancel: () => void;
}

const emptyItem = (): Item => ({ title: '', description: '', quantity: 1, unitCode: 'C62', unitLabel: 'unité', unitPrice: 0, type: 'SERVICE', vatCategory: 'STANDARD', vatRate: 20 });

function optionLabel(option: Option) {
  return option.company || [option.firstName, option.lastName].filter(Boolean).join(' ') || option.name || option.title || option.id;
}

export default function AddReccuringInvoiceForm({ onCreated, onCancel }: AddReccuringInvoiceFormProps) {
  const api = useApiClient();
  const [customers, setCustomers] = useState<Option[]>([]);
  const [projects, setProjects] = useState<Option[]>([]);
  const [paymentAccounts, setPaymentAccounts] = useState<Option[]>([]);
  const [form, setForm] = useState({ name: '', customerId: '', projectId: '', recurrenceUnit: 'MONTH', interval: 1, startDate: new Date().toISOString().slice(0, 10), endDate: '', operationCategory: 'SERVICES', currency: 'EUR', paymentAccountId: '', paymentTerms: '', internalNotes: '' });
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/customers'), api.get('/projects'), api.get('/payment-accounts')]).then(async ([customerResponse, projectResponse, accountResponse]) => {
      if (customerResponse.ok) setCustomers(await customerResponse.json());
      if (projectResponse.ok) setProjects(await projectResponse.json());
      if (accountResponse.ok) setPaymentAccounts(await accountResponse.json());
    }).catch(() => setError('Impossible de charger les options de facturation.'));
  }, [api]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.post('/recurring-invoices', {
        ...form,
        interval: Number(form.interval),
        projectId: form.projectId || undefined,
        endDate: form.endDate || undefined,
        paymentAccountId: form.paymentAccountId || undefined,
        items: items.map((item, index) => ({ ...item, position: index, quantity: Number(item.quantity), unitPrice: Number(item.unitPrice), vatRate: Number(item.vatRate) })),
      });
      if (!response.ok) throw new Error('Erreur');
      onCreated(await response.json());
    } catch {
      setError('Impossible de créer la facture récurrente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">Nom de la récurrence<input required className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Client<select required className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}><option value="">Sélectionner</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{optionLabel(customer)}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Projet (optionnel)<select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}><option value="">Aucun projet</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.reference ? `${project.reference} - ` : ''}{optionLabel(project)}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Fréquence<div className="mt-1 flex gap-2"><input type="number" min={1} required className="w-24 rounded border border-slate-300 bg-white px-3 py-2" value={form.interval} onChange={(e) => setForm({ ...form, interval: Number(e.target.value) })} /><select className="flex-1 rounded border border-slate-300 bg-white px-3 py-2" value={form.recurrenceUnit} onChange={(e) => setForm({ ...form, recurrenceUnit: e.target.value })}><option value="DAY">jour(s)</option><option value="WEEK">semaine(s)</option><option value="MONTH">mois</option><option value="YEAR">an(s)</option></select></div></label>
        <label className="text-sm font-medium text-slate-700">Première occurrence<input type="date" required className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Fin (optionnelle)<input type="date" className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} /></label>
        <label className="text-sm font-medium text-slate-700">Compte bancaire<select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.paymentAccountId} onChange={(e) => setForm({ ...form, paymentAccountId: e.target.value })}><option value="">Compte principal de l&apos;entreprise</option>{paymentAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      </div>

      <div className="mt-6 border-t border-indigo-200 pt-5"><div className="mb-3 flex items-center justify-between"><h4 className="font-semibold text-slate-900">Lignes récurrentes</h4><button type="button" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm" onClick={() => setItems([...items, emptyItem()])}>Ajouter une ligne</button></div>
        <div className="space-y-3">{items.map((item, index) => <div key={index} className="grid grid-cols-1 gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-6"><input required className="rounded border border-slate-300 px-2 py-2 sm:col-span-2" placeholder="Libellé" value={item.title} onChange={(e) => setItems(items.map((current, itemIndex) => itemIndex === index ? { ...current, title: e.target.value } : current))} /><input className="rounded border border-slate-300 px-2 py-2 sm:col-span-2" placeholder="Description" value={item.description} onChange={(e) => setItems(items.map((current, itemIndex) => itemIndex === index ? { ...current, description: e.target.value } : current))} /><input type="number" min={0} step="0.01" required className="rounded border border-slate-300 px-2 py-2" placeholder="Quantité" value={item.quantity} onChange={(e) => setItems(items.map((current, itemIndex) => itemIndex === index ? { ...current, quantity: Number(e.target.value) } : current))} /><input type="number" min={0} step="0.01" required className="rounded border border-slate-300 px-2 py-2" placeholder="Prix HT" value={item.unitPrice} onChange={(e) => setItems(items.map((current, itemIndex) => itemIndex === index ? { ...current, unitPrice: Number(e.target.value) } : current))} />{items.length > 1 && <button type="button" className="text-left text-sm text-red-700" onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}>Supprimer</button>}</div>)}</div>
      </div>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded border border-slate-300 bg-white px-4 py-2 text-sm">Annuler</button><button type="submit" disabled={saving} className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Création...' : 'Créer la facture récurrente'}</button></div>
    </form>
  );
}