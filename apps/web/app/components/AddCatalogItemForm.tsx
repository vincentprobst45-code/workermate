'use client';

import { LineItemType as WorkOrderItemType, VatCategory } from '@prisma/client';
import { type FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export interface CatalogItem {
  id: string;
  tenantId: string;
  type: WorkOrderItemType;
  title: string;
  reference?: string;
  isActive: boolean;
  description?: string;
  defaultQuantity: number;
  unit?: string;
  unitCode: string;
  unitLabel?: string;
  baseQuantity?: number;
  baseQuantityUnitCode?: string;
  unitPrice: number;
  unitCost?: number;
  purchaseVatRate?: number;
  vatRate: number;
  vatCategory: VatCategory;
  createdAt: string;
  updatedAt: string;
}

export interface AddCatalogItemFormData {
  type: WorkOrderItemType;
  title: string;
  description: string;
  reference: string;
  isActive: boolean;
  defaultQuantity: number;
  unit: string;
  unitCode: string;
  unitLabel: string;
  baseQuantity: number;
  baseQuantityUnitCode: string;
  unitPrice: number;
  unitCost: number | '';
  purchaseVatRate: number | '';
  vatRate: number;
  vatCategory: VatCategory;
}

export interface CreateCatalogItemDto {
  type: WorkOrderItemType;
  title: string;
  reference?: string;
  isActive?: boolean;
  description?: string;
  defaultQuantity?: number;
  unit?: string;
  unitCode: string;
  unitLabel?: string;
  baseQuantity?: number;
  baseQuantityUnitCode?: string;
  unitPrice: number;
  unitCost?: number;
  purchaseVatRate?: number;
  vatRate?: number;
  vatCategory: VatCategory;
}

const catalogItemTypeOptions: Array<{ value: WorkOrderItemType; label: string }> = [
  { value: 'LABOR', label: 'Travaux' },
  { value: 'MATERIAL', label: 'Materiel' },
  { value: 'EQUIPMENT', label: 'Equipement' },
  { value: 'TRAVEL', label: 'Deplacement' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Autre' },
];

function createEmptyCatalogItem(): AddCatalogItemFormData {
  return {
    type: 'OTHER',
    title: '',
    reference: '',
    isActive: true,
    description: '',
    defaultQuantity: 1,
    unit: '',
    unitCode: 'C62',
    unitLabel: '',
    baseQuantity: 1,
    baseQuantityUnitCode: 'C62',
    unitPrice: 0,
    unitCost: '',
    purchaseVatRate: '',
    vatRate: 20,
    vatCategory: 'STANDARD',
  };
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

type AddCatalogItemFormProps = {
  onCreated: (catalogItem: CatalogItem) => void;
  show: boolean;
};

export default function AddCatalogItemForm({ onCreated, show }: AddCatalogItemFormProps) {
  const api = useApiClient();
  const [newCatalogItem, setNewCatalogItem] =
    useState<AddCatalogItemFormData>(createEmptyCatalogItem());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleAddCatalogItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!newCatalogItem.title.trim()) {
        setError('Le titre est obligatoire.');
        return;
      }

      const payload: CreateCatalogItemDto = {
        type: newCatalogItem.type,
        title: newCatalogItem.title.trim(),
        reference: trimToUndefined(newCatalogItem.reference),
        isActive: newCatalogItem.isActive,
        description: trimToUndefined(newCatalogItem.description),
        defaultQuantity: Number.isFinite(newCatalogItem.defaultQuantity)
          ? newCatalogItem.defaultQuantity
          : 1,
        unitCode: newCatalogItem.unitCode.trim() || 'C62',
        unitLabel: trimToUndefined(newCatalogItem.unitLabel || newCatalogItem.unit),
        baseQuantity: newCatalogItem.baseQuantity || 1,
        baseQuantityUnitCode: trimToUndefined(newCatalogItem.baseQuantityUnitCode),
        unitPrice: Number.isFinite(newCatalogItem.unitPrice) ? newCatalogItem.unitPrice : 0,
        unitCost: newCatalogItem.unitCost === '' ? undefined : newCatalogItem.unitCost,
        purchaseVatRate:
          newCatalogItem.purchaseVatRate === '' ? undefined : newCatalogItem.purchaseVatRate,
        vatRate: Number.isFinite(newCatalogItem.vatRate) ? newCatalogItem.vatRate : undefined,
        vatCategory: newCatalogItem.vatCategory,
      };

      const response = await api.post('/catalogitems', payload);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      const data: CatalogItem = await response.json();
      onCreated(data);
      setNewCatalogItem(createEmptyCatalogItem());
      setSuccess('Article catalogue ajoute avec succes');
    } catch {
      setError('Erreur lors de la creation de l\'article catalogue');
    }
  }

  return (
    <form
      onSubmit={handleAddCatalogItem}
      className={`mb-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ${!show ? 'hidden' : ''}`}
    >
      <h3 className="text-lg font-semibold text-zinc-900">Ajouter un article catalogue</h3>

      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Fiche article</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Type</span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              value={newCatalogItem.type}
              onChange={(event) =>
                setNewCatalogItem({
                  ...newCatalogItem,
                  type: event.target.value as WorkOrderItemType,
                })
              }
            >
              {catalogItemTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Titre</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Titre"
              value={newCatalogItem.title}
              onChange={(event) =>
                setNewCatalogItem({ ...newCatalogItem, title: event.target.value })
              }
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Référence</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Référence interne"
              value={newCatalogItem.reference}
              onChange={(event) => setNewCatalogItem({ ...newCatalogItem, reference: event.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-zinc-700">Description</span>
            <textarea
              className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Description"
              value={newCatalogItem.description}
              onChange={(event) =>
                setNewCatalogItem({ ...newCatalogItem, description: event.target.value })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Quantité par défaut</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Quantite par defaut"
              value={newCatalogItem.defaultQuantity}
              onChange={(event) =>
                setNewCatalogItem({
                  ...newCatalogItem,
                  defaultQuantity: Number.isNaN(event.target.valueAsNumber)
                    ? 1
                    : event.target.valueAsNumber,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Unité</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Unite"
              value={newCatalogItem.unit}
              onChange={(event) => setNewCatalogItem({ ...newCatalogItem, unit: event.target.value })}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Code unité</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="C62, HUR, KGM..."
              value={newCatalogItem.unitCode}
              onChange={(event) => setNewCatalogItem({ ...newCatalogItem, unitCode: event.target.value })}
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Prix de vente unitaire</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Prix de vente unitaire"
              value={newCatalogItem.unitPrice}
              onChange={(event) =>
                setNewCatalogItem({
                  ...newCatalogItem,
                  unitPrice: Number.isNaN(event.target.valueAsNumber)
                    ? 0
                    : event.target.valueAsNumber,
                })
              }
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Coût d&apos;achat unitaire</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Coût d'achat unitaire"
              value={newCatalogItem.unitCost}
              onChange={(event) =>
                setNewCatalogItem({
                  ...newCatalogItem,
                  unitCost: Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">TVA achat (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="TVA achat"
              value={newCatalogItem.purchaseVatRate}
              onChange={(event) =>
                setNewCatalogItem({
                  ...newCatalogItem,
                  purchaseVatRate: Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber,
                })
              }
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">TVA (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="TVA %"
              value={newCatalogItem.vatRate}
              onChange={(event) =>
                setNewCatalogItem({
                  ...newCatalogItem,
                  vatRate: Number.isNaN(event.target.valueAsNumber)
                    ? 0
                    : event.target.valueAsNumber,
                })
              }
              required
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Catégorie TVA</span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
              value={newCatalogItem.vatCategory}
              onChange={(event) => setNewCatalogItem({ ...newCatalogItem, vatCategory: event.target.value as VatCategory })}
            >
              <option value="STANDARD">Standard</option>
              <option value="EXEMPT">Exonérée</option>
              <option value="REVERSE_CHARGE">Autoliquidation</option>
              <option value="ZERO">Taux zéro</option>
            </select>
          </label>

          <label className="flex items-center gap-2 self-end pb-2 text-sm text-zinc-700">
            <input
              type="checkbox"
              checked={newCatalogItem.isActive}
              onChange={(event) => setNewCatalogItem({ ...newCatalogItem, isActive: event.target.checked })}
            />
            Article actif
          </label>
        </div>
      </section>

      <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
        Ajouter
      </button>
    </form>
  );
}
