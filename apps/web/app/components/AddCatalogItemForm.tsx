'use client';

import { ProjectItemType } from '@prisma/client';
import { type FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';

export interface CatalogItem {
  id: string;
  tenantId: string;
  type: ProjectItemType;
  title: string;
  description?: string;
  defaultQuantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddCatalogItemFormData {
  type: ProjectItemType;
  title: string;
  description: string;
  defaultQuantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
}

export interface CreateCatalogItemDto {
  type: ProjectItemType;
  title: string;
  description?: string;
  defaultQuantity?: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
}

const catalogItemTypeOptions: Array<{ value: ProjectItemType; label: string }> = [
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
    description: '',
    defaultQuantity: 1,
    unit: '',
    unitPrice: 0,
    vatRate: 20,
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
        description: trimToUndefined(newCatalogItem.description),
        defaultQuantity: Number.isFinite(newCatalogItem.defaultQuantity)
          ? newCatalogItem.defaultQuantity
          : 1,
        unit: trimToUndefined(newCatalogItem.unit),
        unitPrice: Number.isFinite(newCatalogItem.unitPrice) ? newCatalogItem.unitPrice : 0,
        vatRate: Number.isFinite(newCatalogItem.vatRate) ? newCatalogItem.vatRate : 0,
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
                  type: event.target.value as ProjectItemType,
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
            <span className="text-sm font-medium text-zinc-700">Prix unitaire</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Prix unitaire"
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
        </div>
      </section>

      <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
        Ajouter
      </button>
    </form>
  );
}
