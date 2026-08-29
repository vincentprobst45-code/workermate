'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { type LineItemType as WorkOrderItemType, type VatCategory } from '@prisma/client';
import CatalogItemDetails from './CatalogItemDetails';

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

interface CatalogItemListProps {
  catalogItems: CatalogItem[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  handleSelectedCatalogItem?: ((catalogItem: CatalogItem) => void | Promise<void>) | null;
}

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'titleAsc' | 'titleDesc';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(toNumber(value));
}

const TYPE_META: Record<WorkOrderItemType, { label: string; barClass: string; badgeClass: string }> = {
  LABOR: { label: 'Travaux', barClass: 'bg-blue-500', badgeClass: 'bg-blue-50 text-blue-700' },
  MATERIAL: { label: 'Matériel', barClass: 'bg-orange-500', badgeClass: 'bg-orange-50 text-orange-700' },
  EQUIPMENT: { label: 'Équipement', barClass: 'bg-violet-500', badgeClass: 'bg-violet-50 text-violet-700' },
  TRAVEL: { label: 'Déplacement', barClass: 'bg-cyan-500', badgeClass: 'bg-cyan-50 text-cyan-700' },
  SERVICE: { label: 'Service', barClass: 'bg-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700' },
  OTHER: { label: 'Autre', barClass: 'bg-stone-400', badgeClass: 'bg-stone-100 text-stone-600' },
};

export default function CatalogItemList({
  catalogItems,
  onDelete,
  handleSelectedCatalogItem = null,
}: CatalogItemListProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? catalogItems.filter(
        (item) =>
          item.title.toLowerCase().includes(normalizedQuery) ||
          (item.reference || '').toLowerCase().includes(normalizedQuery),
      )
    : catalogItems;

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'createdAtDesc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'createdAtAsc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'titleAsc') {
      return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
    }
    return b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' });
  });

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * itemsPerPage;
  const currentItems = sortedItems.slice(firstItemIndex, firstItemIndex + itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  function openDetails(catalogItem: CatalogItem) {
    setShowDetails(true);
    setSelectedItem(catalogItem);
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher un article, une référence..."
            className="w-full rounded-lg border border-stone-300 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <label htmlFor="catalogitem-sort" className="text-stone-500">
            Trier
          </label>
          <select
            id="catalogitem-sort"
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
            value={sortBy}
            onChange={(event) => {
              setSortBy(event.target.value as SortBy);
              setCurrentPage(1);
            }}
          >
            <option value="createdAtDesc">Date d&apos;ajout: plus recent</option>
            <option value="createdAtAsc">Date d&apos;ajout: plus ancien</option>
            <option value="titleAsc">Titre: A - Z</option>
            <option value="titleDesc">Titre: Z - A</option>
          </select>

          <label htmlFor="catalogitem-per-page" className="text-stone-500">
            Par page
          </label>
          <select
            id="catalogitem-per-page"
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
            value={itemsPerPage}
            onChange={(event) => {
              setItemsPerPage(Number(event.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((catalogItem) => {
          const meta = TYPE_META[catalogItem.type] ?? TYPE_META.OTHER;
          const unitLabel = catalogItem.unitLabel || catalogItem.unitCode || catalogItem.unit || 'unité';

          return (
            <div
              key={catalogItem.id}
              role="button"
              tabIndex={0}
              onClick={() => openDetails(catalogItem)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDetails(catalogItem);
                }
              }}
              className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-stone-200 bg-white p-4 pl-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                !catalogItem.isActive ? 'opacity-60 grayscale' : ''
              }`}
            >
              <span className={`absolute inset-y-0 left-0 w-1.5 ${meta.barClass}`} />

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-900">{catalogItem.title}</p>
                  {catalogItem.reference && (
                    <p className="truncate text-xs text-stone-400">Réf. {catalogItem.reference}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.badgeClass}`}>
                  {meta.label}
                </span>
              </div>

              <p className="mt-3 font-mono text-xl font-bold tabular-nums text-emerald-700">
                {formatMoney(catalogItem.unitPrice)}
              </p>
              <p className="text-xs text-stone-500">
                / {unitLabel} · TVA {catalogItem.vatRate == null ? '-' : `${toNumber(catalogItem.vatRate).toFixed(0)}%`}
              </p>

              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs text-stone-500">
                <span>Qté déf. {toNumber(catalogItem.defaultQuantity)}</span>
                {!catalogItem.isActive && <span className="font-semibold text-stone-400">Inactif</span>}
              </div>

              {onDelete && (
                <button
                  type="button"
                  aria-label={`Supprimer ${catalogItem.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onDelete(catalogItem.id);
                  }}
                  className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold text-red-600 opacity-0 shadow-sm transition hover:bg-red-50 focus-visible:opacity-100 group-hover:opacity-100"
                >
                  Supprimer
                </button>
              )}
            </div>
          );
        })}
      </div>

      {sortedItems.length === 0 && (
        <p className="mt-4 text-sm text-stone-500">
          {catalogItems.length === 0 ? 'Aucun article a afficher.' : 'Aucun article ne correspond a la recherche.'}
        </p>
      )}

      {sortedItems.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded-lg border px-3 py-1.5 text-sm ${pageNumber === effectiveCurrentPage ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-stone-300 bg-white text-stone-700 hover:bg-stone-50'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {showDetails && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => {
            setShowDetails(false);
            setSelectedItem(null);
          }}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <CatalogItemDetails
              catalogItem={selectedItem}
              onClose={() => {
                setShowDetails(false);
                setSelectedItem(null);
              }}
              onSelect={handleSelectedCatalogItem ?? undefined}
            />
          </div>
        </div>
      )}
    </>
  );
}
