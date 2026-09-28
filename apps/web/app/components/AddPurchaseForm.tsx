'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useApiClient } from '../api-client';

type SupplierOption = { id: string; name: string; reference?: string | null };
type CatalogItem = { id: string; title: string; reference?: string | null; unitCode: string; trackStock: boolean };
type PurchaseLine = { title: string; type: 'MATERIAL' | 'SERVICE' | 'OTHER'; quantity: string; unitCode: string; unitPrice: string; vatRate: string; deductibleRate: string; addToStock: boolean; catalogItemMode: 'NEW' | 'EXISTING'; catalogItemId: string };
export type PurchaseInitialData = { supplierId?: string | null; supplierName?: string | null; label?: string | null; purchaseDate: string; dueDate?: string | null; paidAt?: string | null; items: Array<{ title: string; type: 'MATERIAL' | 'SERVICE' | 'OTHER'; quantity: number | string; unitCode: string; unitPrice?: number | string | null; vatRate?: number | string | null; vatAmount?: number | string | null; deductibleVatAmount?: number | string | null; addToStock: boolean; catalogItemId?: string | null }> };
const emptyLine = (): PurchaseLine => ({ title: '', type: 'MATERIAL', quantity: '1', unitCode: 'C62', unitPrice: '0', vatRate: '20', deductibleRate: '100', addToStock: false, catalogItemMode: 'NEW', catalogItemId: '' });

function amount(value: number) { return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

export default function AddPurchaseForm({ onCreated, onCancel, initialPurchase }: { onCreated: () => void; onCancel?: () => void; initialPurchase?: PurchaseInitialData | null }) {
  const api = useApiClient();
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [supplierId, setSupplierId] = useState(initialPurchase?.supplierId || '');
  const [supplierName, setSupplierName] = useState(initialPurchase?.supplierName || '');
  const [label, setLabel] = useState(initialPurchase?.label ? `${initialPurchase.label} - copie` : '');
  const [date, setDate] = useState(initialPurchase?.purchaseDate?.slice(0, 10) || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initialPurchase?.dueDate?.slice(0, 10) || '');
  const [paid, setPaid] = useState(Boolean(initialPurchase?.paidAt) || !initialPurchase?.dueDate);
  const [lines, setLines] = useState<PurchaseLine[]>(initialPurchase?.items.length ? initialPurchase.items.map((item) => {
    const vat = Number(item.vatAmount || 0);
    return { title: item.title, type: item.type, quantity: String(item.quantity), unitCode: item.unitCode, unitPrice: String(item.unitPrice || 0), vatRate: String(item.vatRate || 0), deductibleRate: vat ? String(Number(item.deductibleVatAmount || 0) / vat * 100) : '0', addToStock: item.addToStock, catalogItemMode: item.catalogItemId ? 'EXISTING' : 'NEW', catalogItemId: item.catalogItemId || '' };
  }) : [emptyLine()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/suppliers'), api.get('/catalogitems')]).then(async ([supplierResponse, catalogResponse]) => {
      if (!supplierResponse.ok || !catalogResponse.ok) throw new Error();
      const [supplierData, catalogData] = await Promise.all([supplierResponse.json(), catalogResponse.json()]);
      if (active) { setSuppliers(supplierData); setCatalogItems(catalogData); setCatalogLoading(false); }
    }).catch(() => { if (active) { setCatalogLoading(false); setError('Impossible de charger les fournisseurs et le catalogue.'); } });
    return () => { active = false; };
  }, [api]);

  const totals = useMemo(() => lines.reduce((result, line) => {
    const net = Number(line.quantity || 0) * Number(line.unitPrice || 0);
    const vat = net * Number(line.vatRate || 0) / 100;
    const deductible = vat * Number(line.deductibleRate || 0) / 100;
    return { net: result.net + net, vat: result.vat + vat, deductible: result.deductible + deductible, gross: result.gross + net + vat };
  }, { net: 0, vat: 0, deductible: 0, gross: 0 }), [lines]);

  function update(index: number, field: keyof PurchaseLine, value: string | boolean) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));
  }

  function selectCatalogItem(index: number, id: string) {
    const item = catalogItems.find((catalogItem) => catalogItem.id === id);
    if (!item) return;
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, catalogItemId: item.id, title: item.title, unitCode: item.unitCode } : line));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (!supplierId && !supplierName.trim()) { setError('Sélectionnez un fournisseur ou saisissez un fournisseur ponctuel.'); return; }
    if (lines.some((line) => Number(line.quantity) <= 0 || Number(line.unitPrice) < 0 || (line.addToStock && line.catalogItemMode === 'EXISTING' && !line.catalogItemId))) { setError('Vérifiez les quantités, les prix et les cibles catalogue des lignes.'); return; }
    setSaving(true);
    try {
      const response = await api.post('/purchases', {
        supplierId: supplierId || undefined, supplierName: supplierId ? undefined : supplierName.trim(), label: label.trim() || undefined, purchaseDate: date, dueDate: paid || !dueDate ? undefined : dueDate, paidAt: paid ? new Date().toISOString() : undefined,
        taxExclusiveAmount: totals.net, vatAmount: totals.vat, deductibleVatAmount: totals.deductible, taxInclusiveAmount: totals.gross,
        items: lines.map((line) => { const net = Number(line.quantity) * Number(line.unitPrice); const vat = net * Number(line.vatRate || 0) / 100; return { type: line.type, title: line.title.trim(), quantity: Number(line.quantity), unitCode: line.unitCode, unitPrice: Number(line.unitPrice), vatRate: Number(line.vatRate || 0), taxExclusiveAmount: net, vatAmount: vat, deductibleVatAmount: vat * Number(line.deductibleRate || 0) / 100, taxInclusiveAmount: net + vat, addToStock: line.addToStock, catalogItemMode: line.addToStock ? line.catalogItemMode : undefined, catalogItemId: line.addToStock && line.catalogItemMode === 'EXISTING' ? line.catalogItemId : undefined }; }),
      });
      if (!response.ok) throw new Error();
      setLines([emptyLine()]); setSupplierId(''); setSupplierName(''); setLabel(''); onCreated();
    } catch { setError('Impossible d’enregistrer cet achat. Vérifiez les informations saisies.'); } finally { setSaving(false); }
  }

  return <form onSubmit={submit} className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-stone-900">{initialPurchase ? 'Racheter cet achat' : 'Nouvel achat'}</h2><p className="text-sm text-stone-500">{initialPurchase ? 'Vérifiez les lignes et ajustez les quantités avant de valider.' : 'Les totaux sont calculés à partir des lignes.'}</p></div>{onCancel && <button type="button" onClick={onCancel} className="text-sm font-semibold text-stone-500 hover:text-stone-800">Fermer</button>}</div>
    <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-stone-700">Fournisseur<select value={supplierId} onChange={(event) => { setSupplierId(event.target.value); setSupplierName(''); }} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2"><option value="">Fournisseur ponctuel…</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}{supplier.reference ? ` · ${supplier.reference}` : ''}</option>)}</select></label>{!supplierId && <label className="text-sm font-medium text-stone-700">Nom du fournisseur<input required={!supplierId} value={supplierName} onChange={(event) => setSupplierName(event.target.value)} placeholder="Ex. Point.P" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label>}<label className="text-sm font-medium text-stone-700">Libellé<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Ex. Matériaux chantier" className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label><label className="text-sm font-medium text-stone-700">Date d’achat<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label></div>
    {lines.map((line, index) => <fieldset key={index} className="space-y-3 rounded-lg border border-stone-200 p-4"><legend className="px-1 text-sm font-semibold text-stone-700">Ligne {index + 1}</legend><div className="grid gap-3 md:grid-cols-6"><label className="text-xs font-semibold uppercase text-stone-500 md:col-span-2">Article / prestation<input required value={line.title} onChange={(event) => update(index, 'title', event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold uppercase text-stone-500">Type<select value={line.type} onChange={(event) => update(index, 'type', event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="MATERIAL">Matériel</option><option value="SERVICE">Service</option><option value="OTHER">Autre</option></select></label><label className="text-xs font-semibold uppercase text-stone-500">Quantité<input type="number" min="0.000001" step="0.000001" value={line.quantity} onChange={(event) => update(index, 'quantity', event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold uppercase text-stone-500">Prix HT / unité<input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(event) => update(index, 'unitPrice', event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label><label className="text-xs font-semibold uppercase text-stone-500">TVA %<input type="number" min="0" step="0.01" value={line.vatRate} onChange={(event) => update(index, 'vatRate', event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm" /></label></div><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-stone-600">HT <strong>{amount(Number(line.quantity || 0) * Number(line.unitPrice || 0))} €</strong> · TVA <strong>{amount(Number(line.quantity || 0) * Number(line.unitPrice || 0) * Number(line.vatRate || 0) / 100)} €</strong> · TTC <strong>{amount(Number(line.quantity || 0) * Number(line.unitPrice || 0) * (1 + Number(line.vatRate || 0) / 100))} €</strong></p><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" checked={line.addToStock} onChange={(event) => update(index, 'addToStock', event.target.checked)} /> Entrer en stock</label>{lines.length > 1 && <button type="button" onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== index))} className="text-sm font-semibold text-red-700 hover:underline">Supprimer</button>}</div></div>{line.addToStock && <div className="grid gap-2 md:grid-cols-3"><select value={line.catalogItemMode} onChange={(event) => update(index, 'catalogItemMode', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="NEW">Créer un article catalogue</option><option value="EXISTING">Utiliser un article existant</option></select>{line.catalogItemMode === 'EXISTING' && <select required value={line.catalogItemId} onChange={(event) => selectCatalogItem(index, event.target.value)} className="rounded-md border border-stone-300 px-3 py-2 text-sm md:col-span-2"><option value="">Choisir un article catalogue</option>{catalogItems.map((item) => <option key={item.id} value={item.id}>{item.title}{item.reference ? ` · ${item.reference}` : ''} ({item.unitCode})</option>)}</select>}{line.catalogItemMode === 'NEW' && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:col-span-2">Un article catalogue et son stock seront créés automatiquement.</p>}</div>}</fieldset>)}
    <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className="rounded-md border border-stone-300 px-4 py-2 font-semibold text-stone-700">Ajouter une ligne</button><label className="flex items-center gap-2 text-sm text-stone-600"><input type="checkbox" checked={paid} onChange={(event) => setPaid(event.target.checked)} /> Achat déjà payé</label>{!paid && <label className="text-sm text-stone-600">Échéance<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="ml-2 rounded-md border border-stone-300 px-2 py-1" /></label>}<button disabled={saving} className="ml-auto rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Enregistrement…' : 'Enregistrer l’achat'}</button></div><div className="grid gap-2 rounded-lg bg-stone-50 p-4 text-sm sm:grid-cols-4"><div><p className="text-stone-500">Total HT</p><p className="font-bold text-stone-900">{amount(totals.net)} €</p></div><div><p className="text-stone-500">TVA</p><p className="font-bold text-stone-900">{amount(totals.vat)} €</p></div><div><p className="text-stone-500">TVA déductible</p><p className="font-bold text-stone-900">{amount(totals.deductible)} €</p></div><div><p className="text-stone-500">Total TTC</p><p className="text-lg font-bold text-blue-700">{amount(totals.gross)} €</p></div></div>{catalogLoading && <p className="text-xs text-stone-500">Le catalogue est en cours de chargement pour les lignes destinées au stock.</p>}{error && <p role="alert" className="text-sm text-red-600">{error}</p>}</form>;
}
