'use client';

import { LineItemType as WorkLogItemType } from '@prisma/client';
import { type FormEvent, useState } from 'react';
import { useApiClient } from '../../api-client';

export type WorkLogItem = {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  unit?: string;
  reference?: string;
  position: number;
  unitCode: string;
  unitLabel?: string;
  baseQuantity: number;
  baseQuantityUnitCode?: string;
  workOrderItemId?: string;
  unitCost: number;
  purchaseVatRate?: number;
  totalCost: number;
  type: WorkLogItemType;
  createdAt: string;
};

type CatalogItem = {
  id: string;
  type: WorkLogItemType;
  title: string;
  description?: string;
  defaultQuantity: number;
  unit?: string;
  reference?: string;
  unitCode: string;
  unitLabel?: string;
  unitCost?: number;
  purchaseVatRate?: number;
};

type WorkOrderItem = {
  id: string;
  type: WorkLogItemType;
  title: string;
  description?: string;
  quantity: number;
  unit?: string;
  unitCode: string;
  unitLabel?: string;
  reference?: string;
  baseQuantity?: number;
  baseQuantityUnitCode?: string;
  unitPrice: number;
  purchaseVatRate?: number;
};

type AddWorkLogItemFormProps = {
  workLogId: string;
  workOrderId: string;
  onCreated: (item: WorkLogItem) => void;
};

const itemTypes: Array<{ value: WorkLogItemType; label: string }> = [
  { value: 'LABOR', label: 'Travaux' }, { value: 'MATERIAL', label: 'Matériel' },
  { value: 'EQUIPMENT', label: 'Équipement' }, { value: 'TRAVEL', label: 'Déplacement' },
  { value: 'SERVICE', label: 'Service' }, { value: 'OTHER', label: 'Autre' },
];

export default function AddWorkLogItemForm({ workLogId, workOrderId, onCreated }: AddWorkLogItemFormProps) {
  const api = useApiClient();
  const [type, setType] = useState<WorkLogItemType>('MATERIAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [unitCode, setUnitCode] = useState('C62');
  const [baseQuantity, setBaseQuantity] = useState(1);
  const [reference, setReference] = useState('');
  const [workOrderItemId, setWorkOrderItemId] = useState('');
  const [unitCost, setUnitCost] = useState(0);
  const [purchaseVatRate, setPurchaseVatRate] = useState<number | ''>('');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItem[]>([]);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showWorkOrderItems, setShowWorkOrderItems] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function fill(values: { type: WorkLogItemType; title: string; description?: string; quantity: number; unit?: string; unitCode?: string; reference?: string; unitCost: number; purchaseVatRate?: number; baseQuantity?: number; workOrderItemId?: string }) {
    setType(values.type); setTitle(values.title); setDescription(values.description ?? '');
    setQuantity(Number(values.quantity) || 0); setUnit(values.unit ?? ''); setUnitCost(Number(values.unitCost) || 0);
    setUnitCode(values.unitCode || 'C62'); setReference(values.reference ?? ''); setBaseQuantity(Number(values.baseQuantity) || 1);
    setWorkOrderItemId(values.workOrderItemId ?? '');
    setPurchaseVatRate(values.purchaseVatRate === undefined || values.purchaseVatRate === null ? '' : Number(values.purchaseVatRate));
    setShowCatalog(false); setShowWorkOrderItems(false); setError('');
  }

  async function openCatalog() {
    setShowCatalog(true); setShowWorkOrderItems(false); setError('');
    try {
      const response = await api.get('/catalogitems');
      if (!response.ok) throw new Error('Erreur');
      setCatalogItems(await response.json() as CatalogItem[]);
    } catch { setError('Erreur lors de la récupération du catalogue.'); }
  }

  async function openWorkOrderItems() {
    setShowWorkOrderItems(true); setShowCatalog(false); setError('');
    try {
      const response = await api.get(`/workOrders/${workOrderId}`);
      if (!response.ok) throw new Error('Erreur');
      const workOrder = await response.json() as { items: WorkOrderItem[] };
      setWorkOrderItems(workOrder.items ?? []);
    } catch { setError('Erreur lors de la récupération des étapes du chantier.'); }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      const response = await api.post(`/worklogs/${workLogId}/items`, { type, title: title.trim(), description: description.trim() || undefined, quantity, workOrderItemId: workOrderItemId || undefined, unitCode: unitCode.trim() || 'C62', unitLabel: unit.trim() || undefined, reference: reference.trim() || undefined, baseQuantity, unitCost, purchaseVatRate: purchaseVatRate === '' ? undefined : purchaseVatRate });
      if (!response.ok) throw new Error('Erreur');
      onCreated(await response.json() as WorkLogItem);
      setWorkOrderItemId('');
    } catch { setError('Erreur lors de la création de l’élément de suivi.'); }
    finally { setSubmitting(false); }
  }

  return <form onSubmit={handleSubmit} className="space-y-4">
    <div className="flex flex-wrap gap-2"><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => void openCatalog()}>Remplir à partir du catalogue</button><button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => void openWorkOrderItems()}>Remplir à partir d&apos;une étape du chantier</button></div>
    {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {showCatalog && <div className="max-h-48 overflow-y-auto border border-zinc-200 p-2">{catalogItems.length ? catalogItems.map((item) => <button key={item.id} type="button" className="block w-full border-b border-zinc-100 px-2 py-2 text-left text-sm hover:bg-zinc-50" onClick={() => fill({ ...item, unitCost: item.unitCost ?? 0, quantity: item.defaultQuantity })}>{item.title}</button>) : <p className="p-2 text-sm text-zinc-600">Aucun article catalogue.</p>}</div>}
    {showWorkOrderItems && <div className="max-h-48 overflow-y-auto border border-zinc-200 p-2">{workOrderItems.length ? workOrderItems.map((item) => <button key={item.id} type="button" className="block w-full border-b border-zinc-100 px-2 py-2 text-left text-sm hover:bg-zinc-50" onClick={() => fill({ ...item, unitCost: 0 })}>{item.title}</button>) : <p className="p-2 text-sm text-zinc-600">Aucune étape sur ce chantier.</p>}</div>}
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm"><span>Type</span><select className="rounded border border-zinc-300 px-3 py-2" value={type} onChange={(event) => setType(event.target.value as WorkLogItemType)}>{itemTypes.map((itemType) => <option key={itemType.value} value={itemType.value}>{itemType.label}</option>)}</select></label>
      <label className="flex flex-col gap-1 text-sm"><span>Titre</span><input required className="rounded border border-zinc-300 px-3 py-2" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2"><span>Description</span><textarea className="min-h-20 rounded border border-zinc-300 px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>Quantité</span><input required min="0" step="0.01" type="number" className="rounded border border-zinc-300 px-3 py-2" value={quantity} onChange={(event) => setQuantity(event.target.valueAsNumber || 0)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>Référence</span><input className="rounded border border-zinc-300 px-3 py-2" value={reference} onChange={(event) => setReference(event.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>Unité</span><input className="rounded border border-zinc-300 px-3 py-2" value={unit} onChange={(event) => setUnit(event.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>Code unité</span><input required className="rounded border border-zinc-300 px-3 py-2" value={unitCode} onChange={(event) => setUnitCode(event.target.value)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>Quantité de base</span><input required min="0.000001" step="0.01" type="number" className="rounded border border-zinc-300 px-3 py-2" value={baseQuantity} onChange={(event) => setBaseQuantity(event.target.valueAsNumber || 1)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>Coût unitaire</span><input required min="0" step="0.01" type="number" className="rounded border border-zinc-300 px-3 py-2" value={unitCost} onChange={(event) => setUnitCost(event.target.valueAsNumber || 0)} /></label>
      <label className="flex flex-col gap-1 text-sm"><span>TVA achat (%)</span><input min="0" step="0.01" type="number" className="rounded border border-zinc-300 px-3 py-2" value={purchaseVatRate} onChange={(event) => setPurchaseVatRate(Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber)} /></label>
    </div>
    <button type="submit" disabled={submitting} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? 'Création...' : 'Ajouter l’élément'}</button>
  </form>;
}