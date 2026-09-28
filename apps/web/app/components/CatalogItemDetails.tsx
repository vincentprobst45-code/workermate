'use client';

import { useEffect, useRef } from 'react';
import type { CatalogItem } from './CatalogItemList';

type CatalogItemDetailsProps = {
  catalogItem: CatalogItem;
  onClose?: () => void;
  onSelect?: (catalogItem: CatalogItem) => void | Promise<void>;
  onEdit?: () => void;
  onToggleActive?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(toNumber(value));
}

function formatDate(value?: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function displayValue(value?: string | null): string {
  return value?.trim() || '-';
}

function stockStatus(catalogItem: CatalogItem): { label: string; className: string } {
  if (!catalogItem.trackStock) return { label: 'Stock non suivi', className: 'bg-stone-100 text-stone-600' };
  if (!catalogItem.stockItem) return { label: 'Stock suivi', className: 'bg-sky-50 text-sky-700' };
  const quantity = toNumber(catalogItem.stockItem.quantityOnHand);
  if (quantity <= 0) return { label: 'Hors stock', className: 'bg-red-50 text-red-700' };
  if (quantity <= 5) return { label: 'Stock faible', className: 'bg-amber-50 text-amber-700' };
  return { label: 'En stock', className: 'bg-emerald-50 text-emerald-700' };
}

export default function CatalogItemDetails({
  catalogItem,
  onClose,
  onSelect,
  onEdit,
  onToggleActive,
  onDelete,
}: CatalogItemDetailsProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  const quantity = toNumber(catalogItem.defaultQuantity);
  const unit = displayValue(catalogItem.unitLabel || catalogItem.unitCode || catalogItem.unit);
  const unitPrice = toNumber(catalogItem.unitPrice);
  const unitCost = catalogItem.unitCost == null ? null : toNumber(catalogItem.unitCost);
  const purchaseVatRate = catalogItem.purchaseVatRate == null ? null : toNumber(catalogItem.purchaseVatRate);
  const salesVatRate = toNumber(catalogItem.vatRate);
  const margin = unitCost === null ? null : unitPrice - unitCost;
  const itemStockStatus = stockStatus(catalogItem);
  const stockQuantity = catalogItem.stockItem ? toNumber(catalogItem.stockItem.quantityOnHand) : null;

  return (
    <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <header className="relative overflow-hidden bg-slate-950 px-6 py-7 text-white sm:px-8">
        <div className="absolute right-0 top-0 h-32 w-32 translate-x-10 -translate-y-10 rounded-full border-[18px] border-cyan-400/20" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <span>Article catalogue</span>
              <span className="text-slate-500">/</span>
              <span>{catalogItem.type === 'LABOR' ? 'Travaux' : catalogItem.type === 'MATERIAL' ? 'Matériel' : catalogItem.type === 'EQUIPMENT' ? 'Équipement' : catalogItem.type === 'TRAVEL' ? 'Déplacement' : catalogItem.type === 'SERVICE' ? 'Service' : 'Autre'}</span>
            </div>
            <h3 id="catalog-item-details-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{catalogItem.title}</h3>
            <p className="mt-2 text-sm text-slate-300">
              Référence: {displayValue(catalogItem.reference)}
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${catalogItem.isActive ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-200' : 'border-slate-500 bg-slate-700/60 text-slate-300'}`}>
            {catalogItem.isActive ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </header>

      <div className="space-y-6 p-6 sm:p-8">
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Description</p>
          <p className="min-h-12 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {displayValue(catalogItem.description)}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-cyan-50 p-4 ring-1 ring-cyan-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Prix de vente</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(unitPrice)}</p>
            <p className="mt-1 text-xs text-slate-500">par {unit}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Coût d&apos;achat</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{unitCost === null ? '-' : formatMoney(unitCost)}</p>
            <p className="mt-1 text-xs text-slate-500">par {unit}</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">TVA vente</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{salesVatRate.toFixed(2)}%</p>
            <p className="mt-1 text-xs text-slate-500">catégorie {catalogItem.vatCategory === 'STANDARD' ? 'Standard' : catalogItem.vatCategory === 'EXEMPT' ? 'Exonérée' : catalogItem.vatCategory === 'ZERO' ? 'Taux zéro' : 'Autoliquidation'}</p>
          </div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Stock</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {itemStockStatus.label}{stockQuantity !== null ? ` · ${stockQuantity} ${unit}` : ''}
            </p>
          </div>
          {margin !== null && <div className="text-right"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Marge estimée</p><p className={`mt-1 text-sm font-bold ${margin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{formatMoney(margin)}</p></div>}
        </section>

        <section className="grid gap-x-8 gap-y-4 border-y border-slate-200 py-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quantité par défaut</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{quantity} {unit}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total indicatif</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{formatMoney(quantity * unitPrice)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unité de base</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{displayValue(catalogItem.baseQuantityUnitCode)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">TVA achat</p>
            <p className="mt-1 text-sm font-medium text-slate-900">{purchaseVatRate === null ? '-' : `${purchaseVatRate.toFixed(2)}%`}</p>
          </div>
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>Créé le {formatDate(catalogItem.createdAt)}</span>
          <span>Mis à jour le {formatDate(catalogItem.updatedAt)}</span>
        </footer>

        {(onClose || onSelect || onEdit || onToggleActive || onDelete) && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-5">
            {onDelete && (
              <button type="button" className="mr-auto rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50" onClick={() => void onDelete()}>
                Supprimer
              </button>
            )}
            {onToggleActive && (
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => void onToggleActive()}>
                {catalogItem.isActive ? 'Désactiver' : 'Réactiver'}
              </button>
            )}
            {onEdit && (
              <button type="button" className="rounded-lg border border-cyan-300 px-4 py-2.5 text-sm font-semibold text-cyan-800 hover:bg-cyan-50" onClick={onEdit}>
                Modifier
              </button>
            )}
            {onClose && (
              <button
                type="button"
                ref={closeButtonRef}
                className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={onClose}
              >
                Fermer
              </button>
            )}
            {onSelect && (
              <button
                type="button"
                className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 active:bg-cyan-800"
                onClick={() => void onSelect(catalogItem)}
              >
                Sélectionner cet article
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
