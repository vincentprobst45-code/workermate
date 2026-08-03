'use client';

import { useState } from 'react';
import { InvoicePdpStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
import NewInvoice from './NewInvoice';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  position: number;
  title: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  tenantId: string;
  customerId: string;
  projectId?: string;
  number: string;
  issueDate: string;
  dueDate?: string;
  projectReference: string;
  projectTitle: string;
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
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;
  depositAmount?: number;
  discountAmount?: number;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
  pdfFileId?: string;
  pdpStatus: InvoicePdpStatus;
  pdpMessageId?: string;
  quoteId?: string;
  quoteNumber?: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
}

interface InvoicesListProps {
  invoices: Invoice[];
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

export default function InvoicesList({ invoices, onDelete }: InvoicesListProps) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');

  const sortedInvoices = [...invoices].sort((a, b) => {
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

  const totalPages = Math.max(1, Math.ceil(sortedInvoices.length / invoicesPerPage));
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const firstItemIndex = (effectiveCurrentPage - 1) * invoicesPerPage;
  const currentInvoices = sortedInvoices.slice(firstItemIndex, firstItemIndex + invoicesPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end items-center gap-2">
        <label htmlFor="invoices-sort" className="text-sm text-slate-700">
          Trier
        </label>
        <select
          id="invoices-sort"
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

        <label htmlFor="invoices-per-page" className="text-sm text-slate-700">
          Factures par page
        </label>
        <select
          id="invoices-per-page"
          className="border px-2 py-1 rounded bg-white"
          value={invoicesPerPage}
          onChange={(e) => {
            setInvoicesPerPage(Number(e.target.value));
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
        {currentInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="hover:bg-gray-100 active:bg-gray-400 p-4 bg-white rounded-lg shadow flex justify-between items-center border-2 border-gray-700"
            onClick={() => {
              setShowInvoiceDetails(true);
              setSelectedInvoice(invoice);
            }}
          >
            <div>
              <p className="font-semibold">{invoice.number}</p>
              <p className="text-sm text-slate-600">
                {invoice.customerFirstName} {invoice.customerLastName}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(invoice.issueDate)} - {formatMoney(invoice.total, invoice.currency)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void onDelete(invoice.id);
              }}
              className="text-red-600 hover:text-red-800"
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      {sortedInvoices.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucune facture a afficher.</p>
      )}

      {sortedInvoices.length > 0 && (
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

      {showInvoiceDetails && selectedInvoice && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => {
            setShowInvoiceDetails(false);
            setSelectedInvoice(null);
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
                  setShowInvoiceDetails(false);
                  setSelectedInvoice(null);
                }}
              >
                Fermer X
              </button>
            </div>
                <NewInvoice invoice={selectedInvoice} />
            <p>id : {selectedInvoice.id}</p>
            <p>numero : {selectedInvoice.number}</p>
            <p>statut : {selectedInvoice.status}</p>
            <p>date emission : {formatDate(selectedInvoice.issueDate)}</p>
            <p>date echeance : {formatDate(selectedInvoice.dueDate)}</p>

            <p className="mt-4 font-semibold">Client</p>
            <p>nom : {selectedInvoice.customerFirstName} {selectedInvoice.customerLastName}</p>
            <p>email : {selectedInvoice.customerEmail || '-'}</p>
            <p>telephone : {selectedInvoice.customerPhoneNumber || '-'}</p>
            <p>
              adresse : {selectedInvoice.customerStreet1} {selectedInvoice.customerStreet2 || ''} {selectedInvoice.customerPostalCode} {selectedInvoice.customerCity}
            </p>

            <p className="mt-4 font-semibold">Projet</p>
            <p>reference : {selectedInvoice.projectReference || '-'}</p>
            <p>titre : {selectedInvoice.projectTitle || '-'}</p>

            <p className="mt-4 font-semibold">Montants</p>
            <p>sous-total HT : {formatMoney(selectedInvoice.subtotal, selectedInvoice.currency)}</p>
            <p>TVA : {formatMoney(selectedInvoice.vatAmount, selectedInvoice.currency)}</p>
            <p>remise : {formatMoney(selectedInvoice.discountAmount || 0, selectedInvoice.currency)}</p>
            <p>acompte : {formatMoney(selectedInvoice.depositAmount || 0, selectedInvoice.currency)}</p>
            <p>total TTC : {formatMoney(selectedInvoice.total, selectedInvoice.currency)}</p>

            <p className="mt-4">conditions de paiement : {selectedInvoice.paymentTerms || '-'}</p>
            <p>notes : {selectedInvoice.notes || '-'}</p>

            <div className="mt-4">
              <p className="font-semibold">Lignes de facture</p>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {selectedInvoice.items.map((item) => (
                    <li key={item.id}>
                      {item.position + 1}. {item.title} - {item.quantity} {item.unit || ''} x {formatMoney(item.unitPrice, selectedInvoice.currency)} - TVA {item.vatRate}% - Total {formatMoney(item.total, selectedInvoice.currency)}
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
