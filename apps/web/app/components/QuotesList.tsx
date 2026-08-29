'use client';

import { useState } from 'react';
import { QuoteStatus } from '@prisma/client';
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

  const sortedQuotes = [...quotes].sort((a, b) => {
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
  });

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

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <label htmlFor="quotes-sort" className="text-sm text-slate-600">
          Trier
        </label>
        <select
          id="quotes-sort"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
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
        </select>

        <label htmlFor="quotes-per-page" className="text-sm text-slate-600">
          Devis par page
        </label>
        <select
          id="quotes-per-page"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
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
        </select>
      </div>

      {sortedQuotes.length > 0 && (
        <p className="mb-3 text-sm text-slate-500">Cliquez sur un devis pour en voir le détail.</p>
      )}

      {/* Desktop / tablet: full table */}
      <section className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
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
                  tabIndex={0}
                  className="cursor-pointer transition hover:bg-teal-50/60 focus-visible:bg-teal-50/60 focus-visible:outline-none"
                  onClick={() => openQuote(quote)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openQuote(quote);
                    }
                  }}
                >
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
                            onClick={(event) => {
                              event.stopPropagation();
                              void onDisassociate(quote.id);
                            }}
                            className="text-amber-600 hover:text-amber-800"
                          >
                            Désassocier
                          </button>
                        )}
                        {onDelete && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void onDelete(quote.id);
                            }}
                            className="text-red-600 hover:text-red-800"
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
          <div
            key={quote.id}
            role="button"
            tabIndex={0}
            onClick={() => openQuote(quote)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openQuote(quote);
              }
            }}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
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
            {hasRowActions && (
              <div className="mt-3 flex justify-end gap-4 border-t border-slate-100 pt-3 text-xs font-medium">
                {onDisassociate && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDisassociate(quote.id);
                    }}
                    className="text-amber-600 hover:text-amber-800"
                  >
                    Désassocier du projet
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      void onDelete(quote.id);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </section>

      {sortedQuotes.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucun devis a afficher.</p>
      )}

      {sortedQuotes.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded-lg border px-3 py-1.5 text-sm ${pageNumber === effectiveCurrentPage ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
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
