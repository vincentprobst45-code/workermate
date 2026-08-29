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

// Ledger-style tokens, distinct from the rest of the app on purpose.
const sectionHeaderClass = 'flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-emerald-700';
const ruleClass = 'h-px flex-1 bg-stone-200';
const fieldWrapClass = 'flex flex-col gap-1';
const labelClass = 'text-xs font-semibold uppercase tracking-wide text-stone-500';
const underlineInputClass =
  'w-full border-0 border-b-2 border-stone-300 bg-transparent px-0.5 py-2 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-600';

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

  const unitCostValue = newCatalogItem.unitCost === '' ? null : newCatalogItem.unitCost;
  const margin = unitCostValue === null ? null : newCatalogItem.unitPrice - unitCostValue;
  const marginPct = margin === null || newCatalogItem.unitPrice <= 0 ? null : (margin / newCatalogItem.unitPrice) * 100;

  return (
    <form
      onSubmit={handleAddCatalogItem}
      className={`mb-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm ${!show ? 'hidden' : ''}`}
    >
      <div className="h-1.5 bg-emerald-600" />
      <div className="space-y-8 p-6 sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Catalogue</p>
          <h3 className="mt-1 text-xl font-bold text-stone-900">Nouvel article ou prestation</h3>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        <section>
          <div className={sectionHeaderClass}>
            <span>Identification</span>
            <span className={ruleClass} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className={fieldWrapClass}>
              <span className={labelClass}>Type</span>
              <select
                className={underlineInputClass}
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

            <label className={`${fieldWrapClass} sm:col-span-2`}>
              <span className={labelClass}>Titre *</span>
              <input
                className={underlineInputClass}
                placeholder="Ex: Pose de prise électrique"
                value={newCatalogItem.title}
                onChange={(event) =>
                  setNewCatalogItem({ ...newCatalogItem, title: event.target.value })
                }
                required
              />
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>Référence</span>
              <input
                className={underlineInputClass}
                placeholder="Réf. interne"
                value={newCatalogItem.reference}
                onChange={(event) => setNewCatalogItem({ ...newCatalogItem, reference: event.target.value })}
              />
            </label>

            <label className={`${fieldWrapClass} sm:col-span-2 lg:col-span-4`}>
              <span className={labelClass}>Description</span>
              <textarea
                className={`${underlineInputClass} min-h-16 resize-y`}
                placeholder="Description visible sur les devis et factures"
                value={newCatalogItem.description}
                onChange={(event) =>
                  setNewCatalogItem({ ...newCatalogItem, description: event.target.value })
                }
              />
            </label>

            <div className="flex items-center gap-3 sm:col-span-2 lg:col-span-4">
              <button
                type="button"
                role="switch"
                aria-checked={newCatalogItem.isActive}
                aria-label="Article actif"
                onClick={() => setNewCatalogItem({ ...newCatalogItem, isActive: !newCatalogItem.isActive })}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${newCatalogItem.isActive ? 'bg-emerald-600' : 'bg-stone-300'}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${newCatalogItem.isActive ? 'left-5' : 'left-0.5'}`}
                />
              </button>
              <span className="text-sm font-medium text-stone-700">
                {newCatalogItem.isActive
                  ? 'Article actif — visible dans les devis et factures'
                  : 'Article inactif — masqué des nouveaux documents'}
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className={sectionHeaderClass}>
            <span>Unités</span>
            <span className={ruleClass} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <label className={fieldWrapClass}>
              <span className={labelClass}>Quantité par défaut</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={underlineInputClass}
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

            <label className={fieldWrapClass}>
              <span className={labelClass}>Unité</span>
              <input
                className={underlineInputClass}
                placeholder="heure, m², kg..."
                value={newCatalogItem.unit}
                onChange={(event) => setNewCatalogItem({ ...newCatalogItem, unit: event.target.value })}
              />
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>Code unité *</span>
              <input
                className={underlineInputClass}
                placeholder="C62, HUR, KGM..."
                value={newCatalogItem.unitCode}
                onChange={(event) => setNewCatalogItem({ ...newCatalogItem, unitCode: event.target.value })}
                required
              />
            </label>
          </div>
        </section>

        <section>
          <div className={sectionHeaderClass}>
            <span>Tarification</span>
            <span className={ruleClass} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className={fieldWrapClass}>
              <span className={labelClass}>Prix de vente unitaire (HT) *</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${underlineInputClass} font-mono text-lg font-bold text-emerald-700`}
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
                <span className="text-sm text-stone-400">€</span>
              </div>
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>Coût d&apos;achat unitaire</span>
              <div className="flex items-baseline gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${underlineInputClass} font-mono`}
                  value={newCatalogItem.unitCost}
                  onChange={(event) =>
                    setNewCatalogItem({
                      ...newCatalogItem,
                      unitCost: Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber,
                    })
                  }
                />
                <span className="text-sm text-stone-400">€</span>
              </div>
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>TVA achat (%)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={underlineInputClass}
                value={newCatalogItem.purchaseVatRate}
                onChange={(event) =>
                  setNewCatalogItem({
                    ...newCatalogItem,
                    purchaseVatRate: Number.isNaN(event.target.valueAsNumber) ? '' : event.target.valueAsNumber,
                  })
                }
              />
            </label>

            <label className={fieldWrapClass}>
              <span className={labelClass}>TVA vente (%) *</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className={underlineInputClass}
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

            <label className={`${fieldWrapClass} sm:col-span-2`}>
              <span className={labelClass}>Catégorie TVA</span>
              <select
                className={underlineInputClass}
                value={newCatalogItem.vatCategory}
                onChange={(event) => setNewCatalogItem({ ...newCatalogItem, vatCategory: event.target.value as VatCategory })}
              >
                <option value="STANDARD">Standard</option>
                <option value="EXEMPT">Exonérée</option>
                <option value="REVERSE_CHARGE">Autoliquidation</option>
                <option value="ZERO">Taux zéro</option>
              </select>
            </label>

            <div className="flex flex-col justify-end gap-1 rounded-lg bg-stone-50 px-4 py-3 sm:col-span-2">
              <span className={labelClass}>Marge estimée</span>
              {margin === null ? (
                <span className="text-sm text-stone-400">Renseignez un coût d&apos;achat pour estimer la marge.</span>
              ) : (
                <span className={`font-mono text-lg font-bold ${margin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {margin.toFixed(2)} €
                  {marginPct !== null && (
                    <span className="ml-1 text-sm font-medium text-stone-400">({marginPct.toFixed(0)}%)</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-end border-t border-stone-100 pt-6">
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            Ajouter au catalogue
          </button>
        </div>
      </div>
    </form>
  );
}
