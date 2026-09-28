'use client';

import { useEffect, useRef, useState } from 'react';
import { MoreHorizontal, Search } from 'lucide-react';
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
  trackStock?: boolean;
  stockItem?: {
    quantityOnHand: number;
    averageUnitCost?: number | null;
  } | null;
}

interface CatalogItemListProps {
  catalogItems: CatalogItem[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  onEdit?: ((catalogItem: CatalogItem) => void) | null;
  onToggleActive?: ((catalogItem: CatalogItem) => void | Promise<void>) | null;
  handleSelectedCatalogItem?: ((catalogItem: CatalogItem) => void | Promise<void>) | null;
  // Opens this item's details automatically once loaded (used for deep-linking via `?item=<id>`).
  initialItemId?: string | null;
  initialItemMode?: 'view' | 'edit';
  syncUrl?: boolean;
}

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'titleAsc' | 'titleDesc';
type StatusFilter = 'all' | 'active' | 'inactive';
type StockFilter = 'all' | 'tracked' | 'untracked' | 'inStock' | 'low' | 'out';

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value: unknown): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(toNumber(value));
}

function stockStatus(item: CatalogItem): { label: string; className: string } {
  if (!item.trackStock) return { label: 'Stock non suivi', className: 'bg-stone-100 text-stone-600' };
  if (!item.stockItem) return { label: 'Stock suivi', className: 'bg-sky-50 text-sky-700' };
  const quantity = toNumber(item.stockItem.quantityOnHand);
  if (quantity <= 0) return { label: 'Hors stock', className: 'bg-red-50 text-red-700' };
  if (quantity <= 5) return { label: 'Stock faible', className: 'bg-amber-50 text-amber-700' };
  return { label: 'En stock', className: 'bg-emerald-50 text-emerald-700' };
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
  onEdit = null,
  onToggleActive = null,
  handleSelectedCatalogItem = null,
  initialItemId = null,
  initialItemMode = 'view',
  syncUrl = false,
}: CatalogItemListProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const appliedInitialItemId = useRef<string | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<WorkOrderItemType | 'all'>('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  function updateItemUrl(itemId?: string, mode: 'view' | 'edit' = 'view', replace = false) {
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    if (itemId) {
      url.searchParams.set('item', itemId);
      if (mode === 'edit') url.searchParams.set('edit', '1');
      else url.searchParams.delete('edit');
    } else {
      url.searchParams.delete('item');
      url.searchParams.delete('edit');
    }
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = catalogItems.filter((item) => {
    const matchesQuery = !normalizedQuery || [item.title, item.reference, item.description, item.type]
      .some((value) => value?.toLowerCase().includes(normalizedQuery));
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? item.isActive : !item.isActive);
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const quantity = toNumber(item.stockItem?.quantityOnHand);
    const matchesStock = stockFilter === 'all'
      || (stockFilter === 'tracked' && item.trackStock)
      || (stockFilter === 'untracked' && !item.trackStock)
      || (stockFilter === 'inStock' && item.trackStock && quantity > 5)
      || (stockFilter === 'low' && item.trackStock && quantity > 0 && quantity <= 5)
      || (stockFilter === 'out' && item.trackStock && quantity <= 0);
    return matchesQuery && matchesStatus && matchesType && matchesStock;
  });

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
  const rangeStart = sortedItems.length === 0 ? 0 : firstItemIndex + 1;
  const rangeEnd = Math.min(firstItemIndex + itemsPerPage, sortedItems.length);
  const hasFilters = Boolean(normalizedQuery) || statusFilter !== 'all' || typeFilter !== 'all' || stockFilter !== 'all';

  function resetFilters() {
    setQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
    setStockFilter('all');
    setCurrentPage(1);
  }

  function openDetails(catalogItem: CatalogItem) {
    setShowDetails(true);
    setSelectedItem(catalogItem);
    updateItemUrl(catalogItem.id);
  }

  useEffect(() => {
    if (!showDetails) return undefined;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowDetails(false);
        setSelectedItem(null);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showDetails]);

  useEffect(() => {
    if (!initialItemId) {
      appliedInitialItemId.current = null;
      return;
    }
    if (appliedInitialItemId.current === initialItemId) return;
    const item = catalogItems.find((catalogItem) => catalogItem.id === initialItemId);
    if (!item) return;
    appliedInitialItemId.current = initialItemId;
    void Promise.resolve().then(() => {
      setSelectedItem(item);
      if (initialItemMode === 'edit' && onEdit) onEdit(item);
      else setShowDetails(true);
    });
  }, [initialItemId, initialItemMode, catalogItems, onEdit]);

  useEffect(() => {
    if (!syncUrl) return;
    const handleHistoryChange = () => {
      const url = new URL(window.location.href);
      const item = catalogItems.find((catalogItem) => catalogItem.id === url.searchParams.get('item'));
      if (!item) {
        setShowDetails(false);
        setSelectedItem(null);
        return;
      }
      setSelectedItem(item);
      if (url.searchParams.get('edit') === '1' && onEdit) {
        setShowDetails(false);
        onEdit(item);
      } else setShowDetails(true);
    };
    window.addEventListener('popstate', handleHistoryChange);
    return () => window.removeEventListener('popstate', handleHistoryChange);
  }, [catalogItems, onEdit, syncUrl]);

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
          <label htmlFor="catalogitem-status" className="sr-only">Statut</label>
          <select
            id="catalogitem-status"
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
          </select>
          <label htmlFor="catalogitem-stock" className="sr-only">Stock</label>
          <select
            id="catalogitem-stock"
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
            value={stockFilter}
            onChange={(event) => {
              setStockFilter(event.target.value as StockFilter);
              setCurrentPage(1);
            }}
          >
            <option value="all">Tous les stocks</option>
            <option value="tracked">Stock suivi</option>
            <option value="untracked">Stock non suivi</option>
            <option value="inStock">En stock</option>
            <option value="low">Stock faible</option>
            <option value="out">Hors stock</option>
          </select>
          <label htmlFor="catalogitem-type" className="sr-only">Type</label>
          <select
            id="catalogitem-type"
            className="rounded-lg border border-stone-300 bg-white px-2 py-1.5 text-stone-700"
            value={typeFilter}
            onChange={(event) => {
              setTypeFilter(event.target.value as WorkOrderItemType | 'all');
              setCurrentPage(1);
            }}
          >
            <option value="all">Tous les types</option>
            {Object.entries(TYPE_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
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
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
        <span>{rangeStart}–{rangeEnd} sur {sortedItems.length} article{sortedItems.length > 1 ? 's' : ''}</span>
        {hasFilters && <button type="button" onClick={resetFilters} className="font-semibold text-emerald-700 hover:text-emerald-800">Réinitialiser les filtres</button>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {currentItems.map((catalogItem) => {
          const meta = TYPE_META[catalogItem.type] ?? TYPE_META.OTHER;
          const unitLabel = catalogItem.unitLabel || catalogItem.unitCode || catalogItem.unit || 'unité';
          const itemStockStatus = stockStatus(catalogItem);
          const margin = catalogItem.unitCost == null || catalogItem.unitPrice == null ? null : toNumber(catalogItem.unitPrice) - toNumber(catalogItem.unitCost);

          return (
            <div
              key={catalogItem.id}
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

              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${catalogItem.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                  {catalogItem.isActive ? 'Actif' : 'Inactif'}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${itemStockStatus.className}`}>
                  {itemStockStatus.label}
                  {catalogItem.trackStock && catalogItem.stockItem ? ` · ${toNumber(catalogItem.stockItem.quantityOnHand)} ${unitLabel}` : ''}
                </span>
              </div>

              <p className="mt-3 font-mono text-xl font-bold tabular-nums text-emerald-700">
                {formatMoney(catalogItem.unitPrice)}
              </p>
              <p className="text-xs text-stone-500">
                / {unitLabel} · TVA {catalogItem.vatRate == null ? '-' : `${toNumber(catalogItem.vatRate).toFixed(0)}%`}
              </p>
              {margin !== null && <p className={`mt-1 text-xs font-semibold ${margin >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>Marge {formatMoney(margin)}</p>}

              <div className="mt-3 flex items-center justify-between border-t border-stone-100 pt-2 text-xs text-stone-500">
                <span>Qté déf. {toNumber(catalogItem.defaultQuantity)}</span>
                {!catalogItem.isActive && <span className="font-semibold text-stone-400">Inactif</span>}
              </div>

              <button
                type="button"
                aria-label={`Ouvrir le détail de ${catalogItem.title}`}
                onClick={() => openDetails(catalogItem)}
                className="absolute inset-0 z-0"
              />
              <div className="relative z-10 flex justify-end">
                <button
                  type="button"
                  aria-label={`Actions pour ${catalogItem.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    openDetails(catalogItem);
                  }}
                  className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sortedItems.length === 0 && (
        <div className="mt-4 flex flex-col items-start gap-2 text-sm text-stone-500">
          <p>{catalogItems.length === 0 ? 'Aucun article à afficher.' : 'Aucun article ne correspond aux filtres.'}</p>
          {hasFilters && <button type="button" onClick={resetFilters} className="font-semibold text-emerald-700 hover:text-emerald-800">Effacer les filtres</button>}
        </div>
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
          role="dialog"
          aria-modal="true"
          aria-labelledby="catalog-item-details-title"
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm sm:p-6"
          onClick={() => {
            setShowDetails(false);
            setSelectedItem(null);
            updateItemUrl(undefined, 'view', true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setShowDetails(false);
              setSelectedItem(null);
            }
          }}
        >
          <div onClick={(event) => event.stopPropagation()}>
            <CatalogItemDetails
              catalogItem={selectedItem}
              onEdit={onEdit ? () => { onEdit(selectedItem); setShowDetails(false); updateItemUrl(selectedItem.id, 'edit'); } : undefined}
              onToggleActive={onToggleActive ? () => {
                setShowDetails(false);
                setSelectedItem(null);
                return onToggleActive(selectedItem);
              } : undefined}
              onDelete={onDelete ? () => {
                setShowDetails(false);
                setSelectedItem(null);
                return onDelete(selectedItem.id);
              } : undefined}
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
