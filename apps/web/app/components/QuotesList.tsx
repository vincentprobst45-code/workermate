'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { QuoteStatus } from '@prisma/client';
import { Search, X } from 'lucide-react';
import NewQuote from './NewQuote';
import UpdateQuoteForm from './UpdateQuoteForm';

export interface QuoteItem {
  id: string;
  quoteId: string;
  position: number;
  title: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  total: number;
  lineIdentifier?: string;
  sellerItemIdentifier?: string;
  unitCode?: string;
  unitLabel?: string;
  subtotal?: number;
  vatCategory?: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  customerId: string;
  workOrderId?: string;

  title: string;

  number: string;
  issueDate: string;
  validUntil?: string;

  workOrderReference?: string;
  workOrderTitle?: string;

  tenantName: string;
  tenantStreet1: string;
  tenantStreet2?: string;
  tenantPostalCode: string;
  tenantCity: string;
  tenantSiretNumber: string;
  tenantVatNumber: string;
  tenantEmail: string;
  tenantPhoneNumber: string;
  tenantIban?: string;
  tenantBic?: string;

  customerFirstName: string;
  customerLastName: string;
  customerStreet1: string;
  customerStreet2?: string;
  customerPostalCode: string;
  customerCity: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerVatNumber?: string;

  workOrderStartDate?: string;
  workOrderEndDate?: string;
  workOrderAddress?: string;
  workOrderPostalCode?: string;
  workOrderCity?: string;

  status: QuoteStatus;

  currency: string;

  subtotal: number;
  vatAmount: number;
  total: number;

  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;

  depositAmount?: number;
  
  pdfFileId?: string;
  
  createdAt: string;
  updatedAt: string;

  items: QuoteItem[];
  tenantLegalName?: string;
  tenantSirenNumber?: string;
  tenantCountryCode?: string;
  customerName?: string;
  customerCountryCode?: string;
  lineNetTotal?: number;
  taxExclusiveAmount?: number;
  taxInclusiveAmount?: number;
  allowanceTotal?: number;
}

interface QuotesListProps {
  quotes: Quote[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  onDisassociate?: ((id: string) => void | Promise<void>) | null;
  handleSelectedQuote?: ((quote: Quote) => void | Promise<void>) | null;
}

type SortBy = 'createdAtDesc' | 'createdAtAsc' | 'numberAsc' | 'numberDesc';

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(Number(value || 0));
}

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

function getClientName(quote: Quote) {
  return quote.customerName?.trim() || [quote.customerFirstName, quote.customerLastName].filter(Boolean).join(' ') || '-';
}

const QUOTE_STATUS_STYLES: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-slate-100 text-slate-700' },
  SENT: { label: 'Envoyé', className: 'bg-sky-50 text-sky-700' },
  ACCEPTED: { label: 'Accepté', className: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Refusé', className: 'bg-red-50 text-red-700' },
  EXPIRED: { label: 'Expiré', className: 'bg-amber-50 text-amber-700' },
};

function StatusBadge({ status }: { status: QuoteStatus }) {
  const style = QUOTE_STATUS_STYLES[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}


export default function QuotesList({ quotes, onDelete, onDisassociate = null, handleSelectedQuote = null }: QuotesListProps) {
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [quoteBeingEdited, setQuoteBeingEdited] = useState<Quote | null>(null);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
  const [quotesPerPage, setQuotesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');
  const [searchTerm, setSearchTerm] = useState('');
  const [quoteToDelete, setQuoteToDelete] = useState<Quote | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [deletionError, setDeletionError] = useState('');
  const deleteCancelRef = useRef<HTMLButtonElement>(null);

  const sortedQuotes = useMemo(() => [...quotes].filter((quote) => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr');
    return !normalizedSearch || [quote.number, quote.title, getClientName(quote), quote.workOrderReference]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase('fr').includes(normalizedSearch));
  }).sort((a, b) => {
    if (sortBy === 'createdAtDesc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'createdAtAsc') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'numberAsc') {
      return a.number.localeCompare(b.number, 'fr', { sensitivity: 'base' });
    }
    return b.number.localeCompare(a.number, 'fr', { sensitivity: 'base' });
  }), [quotes, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sortedQuotes.length / quotesPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * quotesPerPage;
  const currentQuotes = sortedQuotes.slice(firstItemIndex, firstItemIndex + quotesPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  const openQuote = (quote: Quote) => {
    if (handleSelectedQuote) {
      void handleSelectedQuote(quote);
    } else {
      setShowQuoteDetails(true);
      setSelectedQuote(quote);
    }
  };

  const hasRowActions = Boolean(onDelete || onDisassociate);

  useEffect(() => {
    if (!quoteToDelete) return;
    deleteCancelRef.current?.focus();
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deletingQuoteId) setQuoteToDelete(null);
    }
    document.addEventListener('keydown', closeWithEscape);
    return () => document.removeEventListener('keydown', closeWithEscape);
  }, [quoteToDelete, deletingQuoteId]);

  async function confirmDelete() {
    if (!quoteToDelete || !onDelete) return;
    setDeletingQuoteId(quoteToDelete.id);
    setDeletionError('');
    try {
      await onDelete(quoteToDelete.id);
      setQuoteToDelete(null);
    } catch {
      setDeletionError('La suppression a échoué. Le devis est toujours présent.');
    } finally {
      setDeletingQuoteId(null);
    }
  }

  return (
    <>
      <div className="mb-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
          <label className="relative block">
            <span className="sr-only">Rechercher un devis</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Rechercher par numéro, titre ou client" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none" />
          </label>
        <label htmlFor="quotes-sort" className="flex flex-col gap-1 text-sm text-slate-500"><span>Trier par</span>
        <select
          id="quotes-sort"
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as SortBy);
            setCurrentPage(1);
          }}
        >
          <option value="createdAtDesc">Date d&apos;ajout: plus recent</option>
          <option value="createdAtAsc">Date d&apos;ajout: plus ancien</option>
          <option value="numberAsc">Numero: A - Z</option>
          <option value="numberDesc">Numero: Z - A</option>
        </select></label>

        <label htmlFor="quotes-per-page" className="flex flex-col gap-1 text-sm text-slate-500"><span>Devis par page</span>
        <select
          id="quotes-per-page"
          className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
          value={quotesPerPage}
          onChange={(e) => {
            setQuotesPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select></label>
          </div>
          <div className="flex flex-wrap gap-2" role="status" aria-label="Statistiques des devis">
            <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{quotes.length} devis</span>
            {searchTerm && <button type="button" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Effacer la recherche</button>}
          </div>
      </div>

      {sortedQuotes.length > 0 && (
          <p className="mb-3 text-sm text-slate-500">Ouvrez un devis pour consulter ou modifier son détail.</p>
      )}

      {/* Desktop / tablet: full table */}
      <section className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><span className="sr-only">Ouvrir</span></th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">N° devis</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Titre</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Émission</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total TTC</th>
                {hasRowActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentQuotes.map((quote) => (
                <tr
                  key={quote.id}
                  className="transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3"><button type="button" onClick={() => openQuote(quote)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" aria-label={`Ouvrir le devis ${quote.number}`}>Ouvrir</button></td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{quote.number}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-slate-700">{quote.title}</td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-slate-700">{getClientName(quote)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(quote.issueDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={quote.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(quote.taxInclusiveAmount ?? quote.total, quote.currency)}
                  </td>
                  {hasRowActions && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-medium">
                        {onDisassociate && (
                          <button
                            type="button"
                            onClick={() => void onDisassociate(quote.id)}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                          >
                            Désassocier
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={() => setQuoteToDelete(quote)}
                            className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Mobile: stacked cards */}
      <section className="grid gap-3 sm:hidden">
        {currentQuotes.map((quote) => (
          <article
            key={quote.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{quote.number}</p>
                <p className="mt-0.5 truncate text-sm text-slate-600">{quote.title}</p>
              </div>
              <StatusBadge status={quote.status} />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-700">{getClientName(quote)}</p>
                <p className="text-xs text-slate-500">{formatDate(quote.issueDate)}</p>
              </div>
              <p className="shrink-0 text-base font-semibold text-slate-900">
                {formatMoney(quote.taxInclusiveAmount ?? quote.total, quote.currency)}
              </p>
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button type="button" onClick={() => openQuote(quote)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" aria-label={`Ouvrir le devis ${quote.number}`}>Ouvrir</button>
              {hasRowActions && (
              <div className="flex gap-2">
                {onDisassociate && (
                  <button
                    type="button"
                    onClick={() => void onDisassociate(quote.id)}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    Désassocier du projet
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => setQuoteToDelete(quote)}
                    className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
            </div>
          </article>
        ))}
      </section>

      {sortedQuotes.length === 0 && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
          <p className="font-semibold text-slate-800">{quotes.length === 0 ? 'Aucun devis' : 'Aucun résultat'}</p>
          <p className="mt-1 text-sm text-slate-500">{quotes.length === 0 ? 'Créez votre premier devis pour commencer.' : 'Modifiez votre recherche.'}</p>
        </div>
      )}

      {sortedQuotes.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination des devis">
          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            aria-label="Page précédente"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pageNumber === effectiveCurrentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
            aria-label="Page suivante"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {quoteToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-quote-title" aria-describedby="delete-quote-description">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="delete-quote-title" className="text-lg font-bold text-slate-900">Supprimer ce devis ?</h2><p id="delete-quote-description" className="mt-2 text-sm text-slate-600">Le devis <strong>{quoteToDelete.number}</strong> sera supprimé. Cette action est irréversible.</p></div>
              <button type="button" onClick={() => setQuoteToDelete(null)} aria-label="Fermer la confirmation" disabled={Boolean(deletingQuoteId)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X className="h-5 w-5" aria-hidden="true" /></button>
            </div>
            {deletionError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{deletionError}</p>}
            <div className="mt-6 flex justify-end gap-3"><button ref={deleteCancelRef} type="button" onClick={() => setQuoteToDelete(null)} disabled={Boolean(deletingQuoteId)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Annuler</button><button type="button" onClick={() => void confirmDelete()} disabled={Boolean(deletingQuoteId)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60">{deletingQuoteId ? 'Suppression...' : 'Supprimer définitivement'}</button></div>
          </div>
        </div>
      )}

      {showQuoteDetails && selectedQuote && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => {
            setShowQuoteDetails(false);
            setSelectedQuote(null);
          }}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-3xl w-[92vw] max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pb-4 flex items-center">
              <h3 className="inline-block text-2xl">
                <strong>Details devis</strong>
              </h3>
              <button
                className="border-2 rounded-md px-3 py-2 ml-auto inline-block"
                onClick={() => {
                  setShowQuoteDetails(false);
                  setSelectedQuote(null);
                }}
              >
                Fermer X
              </button>
            </div>
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                onClick={() => {
                  setQuoteBeingEdited(selectedQuote);
                  setIsPreviewCollapsed(false);
                }}
              >
                Modifier le devis
              </button>
            </div>
            <NewQuote quote={selectedQuote} />
            <p>id : {selectedQuote.id}</p>
            <p>numero : {selectedQuote.number}</p>
            <p>statut : {selectedQuote.status}</p>
            <p>date emission : {formatDate(selectedQuote.issueDate)}</p>
            {/* <p>date echeance : {formatDate(selectedQuote.dueDate)}</p> */}

            <p className="mt-4 font-semibold">Client</p>
            <p>nom : {selectedQuote.customerName || `${selectedQuote.customerFirstName} ${selectedQuote.customerLastName}`}</p>
            <p>email : {selectedQuote.customerEmail || '-'}</p>
            <p>telephone : {selectedQuote.customerPhoneNumber || '-'}</p>
            <p>
              adresse : {selectedQuote.customerStreet1} {selectedQuote.customerStreet2 || ''} {selectedQuote.customerPostalCode} {selectedQuote.customerCity}
            </p>

            <p className="mt-4 font-semibold">Chantier</p>
            <p>reference : {selectedQuote.workOrderReference || '-'}</p>
            <p>titre : {selectedQuote.workOrderTitle || '-'}</p>

            <p className="mt-4 font-semibold">Montants</p>
            <p>sous-total HT : {formatMoney(selectedQuote.taxExclusiveAmount ?? selectedQuote.subtotal, selectedQuote.currency)}</p>
            <p>TVA : {formatMoney(selectedQuote.vatAmount, selectedQuote.currency)}</p>
            {/* <p>remise : {formatMoney(selectedQuote.discountAmount || 0, selectedQuote.currency)}</p> */}
            <p>acompte : {formatMoney(selectedQuote.depositAmount || 0, selectedQuote.currency)}</p>
            <p>total TTC : {formatMoney(selectedQuote.taxInclusiveAmount ?? selectedQuote.total, selectedQuote.currency)}</p>

            <p className="mt-4">conditions de paiement : {selectedQuote.paymentTerms || '-'}</p>
            <p>notes : {selectedQuote.notes || '-'}</p>

            <div className="mt-4">
              <p className="font-semibold">Lignes de devis</p>
              {selectedQuote.items && selectedQuote.items.length > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {selectedQuote.items.map((item) => (
                    <li key={item.id}>
                      {item.lineIdentifier || item.position + 1}. {item.title} - {item.quantity} {item.unitLabel || item.unitCode || item.unit || ''} x {formatMoney(item.unitPrice, selectedQuote.currency)} - TVA {item.vatRate}% - Total {formatMoney(item.subtotal ?? item.total, selectedQuote.currency)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Aucune ligne chargee.</p>
              )}
            </div>
            {handleSelectedQuote && (
              <button
                onClick={() => {
                  void handleSelectedQuote(selectedQuote);
                }}
                className="mt-4 rounded-sm border-2 border-double border-gray-700 bg-blue-400 px-3 py-2 text-xl text-white shadow-md hover:bg-blue-600 active:bg-blue-900"
              >
                Selectionner ce devis
              </button>
            )}
          </div>
        </div>
      )}

      {quoteBeingEdited && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
          onClick={() => setQuoteBeingEdited(null)}
        >
          <div
            className="flex w-full max-w-7xl flex-col gap-6 xl:flex-row xl:items-start"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0 flex-1 rounded-xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-zinc-900">Modifier le devis</h3>
                <button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setQuoteBeingEdited(null)}>
                  Fermer
                </button>
              </div>
              <UpdateQuoteForm
                quote={quoteBeingEdited}
                onChange={setQuoteBeingEdited}
                onUpdated={(updatedQuote) => {
                  setQuoteBeingEdited(null);
                  setSelectedQuote(updatedQuote);
                }}
              />
            </div>

            <div className="flex min-w-0 xl:sticky xl:top-6 xl:self-start">
              <button
                type="button"
                aria-label={isPreviewCollapsed ? 'Réélargir l’aperçu du devis' : 'Réduire l’aperçu du devis'}
                title={isPreviewCollapsed ? 'Réélargir l’aperçu' : 'Réduire l’aperçu'}
                onClick={() => setIsPreviewCollapsed((current) => !current)}
                className="hidden w-10 shrink-0 self-stretch rounded-l-xl border border-r-0 border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-100 xl:block"
              >
                {isPreviewCollapsed ? '<-' : '->'}
              </button>
              <div className={`overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm transition-[width] duration-200 xl:rounded-l-none ${isPreviewCollapsed ? 'xl:w-0 xl:overflow-hidden xl:border-l-0 xl:p-0' : 'w-full p-4 xl:w-[min(58rem,calc(100vw-8rem))]'}`}>
                <NewQuote quote={quoteBeingEdited} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
