'use client';

import { useState } from 'react';
import { type WorkOrderItemType } from '@prisma/client';

export interface CatalogItem {
  id: string;
  tenantId: string;
  type: WorkOrderItemType;
  title: string;
  description?: string;
  defaultQuantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  createdAt: string;
  updatedAt: string;
}

interface CatalogItemListProps {
  catalogItems: CatalogItem[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  handleSelectedCatalogItem?: ((catalogItem: CatalogItem) => void | Promise<void>) | null;
}

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'titleAsc' | 'titleDesc';

function formatDate(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleDateString('fr-FR');
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

  const sortedItems = [...catalogItems].sort((a, b) => {
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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
        <label htmlFor="catalogitem-sort" className="text-sm text-slate-700">
          Trier
        </label>
        <select
          id="catalogitem-sort"
          className="rounded border bg-white px-2 py-1"
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

        <label htmlFor="catalogitem-per-page" className="text-sm text-slate-700">
          Articles par page
        </label>
        <select
          id="catalogitem-per-page"
          className="rounded border bg-white px-2 py-1"
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

      <section className="grid gap-4">
        <p>Cliquez sur un article pour obtenir les details</p>
        {currentItems.map((catalogItem) => (
          <div
            key={catalogItem.id}
            className="flex items-center justify-between rounded-lg border-2 border-gray-700 bg-white p-4 shadow hover:bg-gray-100 active:bg-gray-400"
            onClick={() => {
              setShowDetails(true);
              setSelectedItem(catalogItem);
            }}
          >
            <div>
              <p className="font-semibold">{catalogItem.title}</p>
              <p className="text-sm text-slate-600">Type: {catalogItem.type}</p>
              <p className="text-sm text-slate-600">
                Qte: {toNumber(catalogItem.defaultQuantity)} {catalogItem.unit || '-'} | PU: {toNumber(catalogItem.unitPrice).toFixed(2)} | TVA: {toNumber(catalogItem.vatRate).toFixed(2)}%
              </p>
            </div>
            {onDelete && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  void onDelete(catalogItem.id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                Supprimer
              </button>
            )}
          </div>
        ))}
      </section>

      {sortedItems.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucun article a afficher.</p>
      )}

      {sortedItems.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded border px-3 py-1 ${pageNumber === effectiveCurrentPage ? 'bg-slate-900 text-white' : 'bg-white'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded border px-3 py-1 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {showDetails && selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => {
            setShowDetails(false);
            setSelectedItem(null);
          }}
        >
          <div className="rounded-lg bg-white p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center pb-4">
              <h3 className="inline-block text-2xl">
                <strong>Details article</strong>
              </h3>
              <button
                className="ml-auto inline-block rounded-md border-2 px-3 py-2"
                onClick={() => {
                  setShowDetails(false);
                  setSelectedItem(null);
                }}
              >
                Fermer X
              </button>
            </div>

            <p>id : {selectedItem.id}</p>
            <p>tenantId : {selectedItem.tenantId}</p>
            <p>type : {selectedItem.type}</p>
            <p>titre : {selectedItem.title}</p>
            <p>description : {selectedItem.description || '-'}</p>
            <p>quantite par defaut : {toNumber(selectedItem.defaultQuantity)}</p>
            <p>unite : {selectedItem.unit || '-'}</p>
            <p>prix unitaire : {toNumber(selectedItem.unitPrice).toFixed(2)}</p>
            <p>tva : {toNumber(selectedItem.vatRate).toFixed(2)}%</p>
            <p>createdAt : {formatDate(selectedItem.createdAt)}</p>
            <p>updatedAt : {formatDate(selectedItem.updatedAt)}</p>

            {handleSelectedCatalogItem && (
              <button
                onClick={() => {
                  void handleSelectedCatalogItem(selectedItem);
                }}
                className="mt-4 rounded-sm border-2 border-double border-gray-700 bg-blue-400 px-3 py-2 text-xl text-white shadow-md hover:bg-blue-600 active:bg-blue-900"
              >
                Selectionner cet article
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
