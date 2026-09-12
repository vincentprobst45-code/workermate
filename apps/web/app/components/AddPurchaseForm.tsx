'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';

type CatalogItem = { id: string; title: string; reference?: string | null; unitCode: string; unitCost?: number | null; trackStock: boolean };
type PurchaseLine = { title: string; type: 'MATERIAL' | 'SERVICE' | 'OTHER'; quantity: string; unitCode: string; taxExclusiveAmount: string; vatAmount: string; taxInclusiveAmount: string; deductibleVatAmount: string; addToStock: boolean; catalogItemMode: 'NEW' | 'EXISTING'; catalogItemId: string };
const emptyLine = (): PurchaseLine => ({ title: '', type: 'MATERIAL', quantity: '1', unitCode: 'C62', taxExclusiveAmount: '0', vatAmount: '0', taxInclusiveAmount: '0', deductibleVatAmount: '0', addToStock: false, catalogItemMode: 'NEW', catalogItemId: '' });

export default function AddPurchaseForm({ onCreated }: { onCreated: () => void }) {
  const api = useApiClient();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [supplierName, setSupplierName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/catalogitems').then(async (response) => {
      if (!response.ok) throw new Error();
      const data: CatalogItem[] = await response.json();
      if (!cancelled) setCatalogItems(data);
    }).catch(() => { if (!cancelled) setError('Impossible de charger les articles catalogue.'); });
    return () => { cancelled = true; };
  }, [api]);

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
    for (const line of lines) {
      if (line.addToStock && line.catalogItemMode === 'EXISTING' && !line.catalogItemId) { setError('Sélectionnez un article catalogue existant pour chaque ligne concernée.'); return; }
    }
    setSaving(true);
    const total = lines.reduce((sum, line) => sum + Number(line.taxInclusiveAmount), 0);
    const response = await api.post('/purchases', {
      supplierName: supplierName || undefined, purchaseDate: date,
      taxExclusiveAmount: lines.reduce((sum, line) => sum + Number(line.taxExclusiveAmount), 0),
      vatAmount: lines.reduce((sum, line) => sum + Number(line.vatAmount), 0),
      deductibleVatAmount: lines.reduce((sum, line) => sum + Number(line.deductibleVatAmount), 0), taxInclusiveAmount: total,
      items: lines.map((line) => ({ type: line.type, title: line.title, quantity: Number(line.quantity), unitCode: line.unitCode, taxExclusiveAmount: Number(line.taxExclusiveAmount), vatAmount: Number(line.vatAmount), taxInclusiveAmount: Number(line.taxInclusiveAmount), deductibleVatAmount: Number(line.deductibleVatAmount), addToStock: line.addToStock, catalogItemMode: line.addToStock ? line.catalogItemMode : undefined, catalogItemId: line.addToStock && line.catalogItemMode === 'EXISTING' ? line.catalogItemId : undefined })),
    });
    setSaving(false);
    if (!response.ok) { setError('Vérifiez les lignes et la cible catalogue avant de valider.'); return; }
    setLines([emptyLine()]); setSupplierName(''); onCreated();
  }

  return <form onSubmit={submit} className="space-y-5 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 md:grid-cols-2"><label className="text-sm font-medium text-stone-700">Fournisseur (texte libre)<input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label><label className="text-sm font-medium text-stone-700">Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2" /></label></div>
    {lines.map((line, index) => <div key={index} className="grid gap-3 border-t border-stone-100 pt-4 md:grid-cols-8">
      <input required placeholder="Article / prestation" value={line.title} onChange={(event) => update(index, 'title', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2 md:col-span-2" />
      <input type="number" step="0.000001" placeholder="Quantité" value={line.quantity} onChange={(event) => update(index, 'quantity', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
      <input type="number" step="0.01" placeholder="HT" value={line.taxExclusiveAmount} onChange={(event) => update(index, 'taxExclusiveAmount', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
      <input type="number" step="0.01" placeholder="TVA" value={line.vatAmount} onChange={(event) => update(index, 'vatAmount', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
      <input type="number" step="0.01" placeholder="TTC" value={line.taxInclusiveAmount} onChange={(event) => update(index, 'taxInclusiveAmount', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2" />
      <label className="flex items-center gap-2 text-xs text-stone-600 md:col-span-2"><input type="checkbox" checked={line.addToStock} onChange={(event) => update(index, 'addToStock', event.target.checked)} /> Entrer en stock</label>
      {line.addToStock && <div className="grid gap-2 md:col-span-8 md:grid-cols-3"><select value={line.catalogItemMode} onChange={(event) => update(index, 'catalogItemMode', event.target.value)} className="rounded-md border border-stone-300 px-3 py-2 text-sm"><option value="NEW">Nouveau</option><option value="EXISTING">Existant</option></select>{line.catalogItemMode === 'EXISTING' && <select required value={line.catalogItemId} onChange={(event) => selectCatalogItem(index, event.target.value)} className="rounded-md border border-stone-300 px-3 py-2 text-sm md:col-span-2"><option value="">Choisir un article catalogue</option>{catalogItems.map((item) => <option key={item.id} value={item.id}>{item.title}{item.reference ? ` · ${item.reference}` : ''} ({item.unitCode})</option>)}</select>}{line.catalogItemMode === 'NEW' && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 md:col-span-2">Un article catalogue et son stock seront créés automatiquement.</p>}</div>}
    </div>)}
    <div className="flex flex-wrap gap-3"><button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} className="rounded-md border border-stone-300 px-4 py-2 font-semibold text-stone-700">Ajouter une ligne</button><button disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer l’achat'}</button></div>{error && <p className="text-sm text-red-600">{error}</p>}
  </form>;
}
