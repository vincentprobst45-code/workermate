'use client';

import { useState } from 'react';
import { QuoteStatus } from '@prisma/client';
import NewQuote from './NewQuote';

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
}

export interface Quote {
  id: string;
  tenantId: string;
  customerId: string;
  projectId?: string;

  title: string;

  number: string;
  issueDate: string;
  validUntil?: string;

  projectReference?: string;
  projectTitle?: string;

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

  projectStartDate?: string;
  projectEndDate?: string;
  projectAddress?: string;
  projectPostalCode?: string;
  projectCity?: string;

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

  items?: QuoteItem[];
}

interface QuotesListProps {
  quotes: Quote[];
  onDelete: (id: string) => void | Promise<void>;
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


export default function QuotesList({ quotes, onDelete }: QuotesListProps) {
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
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

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end items-center gap-2">
        <label htmlFor="quotes-sort" className="text-sm text-slate-700">
          Trier
        </label>
        <select
          id="quotes-sort"
          className="border px-2 py-1 rounded bg-white"
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

        <label htmlFor="quotes-per-page" className="text-sm text-slate-700">
          Factures par page
        </label>
        <select
          id="quotes-per-page"
          className="border px-2 py-1 rounded bg-white"
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

      <section className="grid gap-4">
        <p>Cliquez sur une facture pour obtenir les details</p>
        {currentQuotes.map((quote) => (
          <div
            key={quote.id}
            className="hover:bg-gray-100 active:bg-gray-400 p-4 bg-white rounded-lg shadow flex justify-between items-center border-2 border-gray-700"
            onClick={() => {
              setShowQuoteDetails(true);
              setSelectedQuote(quote);
            }}
          >
            <div>
              <p className="font-semibold">{quote.number}</p>
              <p className="text-sm text-slate-600">
                {quote.customerFirstName} {quote.customerLastName}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(quote.issueDate)} - {formatMoney(quote.total, quote.currency)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void onDelete(quote.id);
              }}
              className="text-red-600 hover:text-red-800"
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      {sortedQuotes.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucune facture a afficher.</p>
      )}

      {sortedQuotes.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`border px-3 py-1 rounded ${pageNumber === effectiveCurrentPage ? 'bg-slate-900 text-white' : 'bg-white'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="border px-3 py-1 rounded disabled:opacity-50"
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
                <strong>Details facture</strong>
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
                <NewQuote quote={selectedQuote} />
            <p>id : {selectedQuote.id}</p>
            <p>numero : {selectedQuote.number}</p>
            <p>statut : {selectedQuote.status}</p>
            <p>date emission : {formatDate(selectedQuote.issueDate)}</p>
            {/* <p>date echeance : {formatDate(selectedQuote.dueDate)}</p> */}

            <p className="mt-4 font-semibold">Client</p>
            <p>nom : {selectedQuote.customerFirstName} {selectedQuote.customerLastName}</p>
            <p>email : {selectedQuote.customerEmail || '-'}</p>
            <p>telephone : {selectedQuote.customerPhoneNumber || '-'}</p>
            <p>
              adresse : {selectedQuote.customerStreet1} {selectedQuote.customerStreet2 || ''} {selectedQuote.customerPostalCode} {selectedQuote.customerCity}
            </p>

            <p className="mt-4 font-semibold">Projet</p>
            <p>reference : {selectedQuote.projectReference || '-'}</p>
            <p>titre : {selectedQuote.projectTitle || '-'}</p>

            <p className="mt-4 font-semibold">Montants</p>
            <p>sous-total HT : {formatMoney(selectedQuote.subtotal, selectedQuote.currency)}</p>
            <p>TVA : {formatMoney(selectedQuote.vatAmount, selectedQuote.currency)}</p>
            {/* <p>remise : {formatMoney(selectedQuote.discountAmount || 0, selectedQuote.currency)}</p> */}
            <p>acompte : {formatMoney(selectedQuote.depositAmount || 0, selectedQuote.currency)}</p>
            <p>total TTC : {formatMoney(selectedQuote.total, selectedQuote.currency)}</p>

            <p className="mt-4">conditions de paiement : {selectedQuote.paymentTerms || '-'}</p>
            <p>notes : {selectedQuote.notes || '-'}</p>

            <div className="mt-4">
              <p className="font-semibold">Lignes de facture</p>
              {selectedQuote.items && selectedQuote.items.length > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {selectedQuote.items.map((item) => (
                    <li key={item.id}>
                      {item.position + 1}. {item.title} - {item.quantity} {item.unit || ''} x {formatMoney(item.unitPrice, selectedQuote.currency)} - TVA {item.vatRate}% - Total {formatMoney(item.total, selectedQuote.currency)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600 mt-1">Aucune ligne chargee.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
