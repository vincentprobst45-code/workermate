'use client';

import { useState } from 'react';
import { InvoiceKind, InvoicePdpStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
import NewInvoice from './NewInvoice';
import AddInvoiceForm from './AddInvoiceForm';
import type { Payment } from './AddPaymentForm';

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
  lineIdentifier?: string;
  unitCode?: string;
  unitLabel?: string;
  subtotal?: number;
  vatCategory?: string;
  adjustments?: InvoiceItemAdjustment[];
}

export interface InvoiceItemAdjustment {
  id: string;
  position: number;
  type: 'ALLOWANCE' | 'CHARGE';
  amount: number;
  baseAmount?: number;
  percentage?: number;
  reason?: string;
  reasonCode?: string;
}

export interface InvoiceAdjustment {
  id: string;
  position: number;
  type: 'ALLOWANCE' | 'CHARGE';
  amount: number;
  baseAmount?: number;
  percentage?: number;
  vatCategory: string;
  vatRate?: number;
  reason?: string;
  reasonCode?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  customerId: string;
  workOrderId?: string;
  number: string;
  issueDate: string;
  dueDate?: string;
  workOrderReference: string;
  workOrderTitle: string;
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
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string | Array<{ text: string }>;
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
  payments?: Payment[];
  kind?: string;
  correctedInvoiceId?: string;
  correctedInvoiceNumber?: string;
  correctedInvoiceIssueDate?: string;
  references?: Array<{
    referencedInvoiceId: string;
    referencedInvoiceNumber: string;
    referencedInvoiceIssueDate: string;
    referencedInvoiceKind: string;
    referencedInvoiceTaxInclusiveAmount?: number;
  }>;
  operationCategory?: string;
  tenantSirenNumber?: string;
  tenantCountryCode?: string;
  customerName?: string;
  customerCountryCode?: string;
  lineNetTotal?: number;
  taxExclusiveAmount?: number;
  taxInclusiveAmount?: number;
  prepaidAmount?: number;
  amountDue?: number;
  internalNotes?: string;
  allowanceTotal?: number;
  chargeTotal?: number;
  adjustments?: InvoiceAdjustment[];
}

interface InvoicesListProps {
  invoices: Invoice[];
  onDelete: ((id: string) => void | Promise<void>) | null;
  onDisassociate?: ((id: string) => void | Promise<void>) | null;
  onUpdated?: ((invoice: Invoice) => void) | null;
  handleSelectedInvoice?: ((invoice: Invoice) => void | Promise<void>) | null;
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

function getClientName(invoice: Invoice) {
  return invoice.customerName?.trim() || [invoice.customerFirstName, invoice.customerLastName].filter(Boolean).join(' ') || '-';
}

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Brouillon', className: 'bg-slate-100 text-slate-700' },
  ISSUED: { label: 'Émise', className: 'bg-sky-50 text-sky-700' },
  REPLACED: { label: 'Remplacée', className: 'bg-amber-50 text-amber-700' },
  CANCELLED: { label: 'Annulée', className: 'bg-red-50 text-red-700' },
};

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const style = INVOICE_STATUS_STYLES[status] ?? { label: status, className: 'bg-slate-100 text-slate-700' };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style.className}`}>
      {style.label}
    </span>
  );
}

export default function InvoicesList({
  invoices,
  onDelete,
  onDisassociate = null,
  onUpdated = null,
  handleSelectedInvoice = null,
}: InvoicesListProps) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceBeingEdited, setInvoiceBeingEdited] = useState<Invoice | null>(null);
  const [invoiceEditPreview, setInvoiceEditPreview] = useState<Invoice | null>(null);
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);
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

  const openInvoice = (invoice: Invoice) => {
    if (handleSelectedInvoice) {
      void handleSelectedInvoice(invoice);
    } else {
      setShowInvoiceDetails(true);
      setSelectedInvoice(invoice);
    }
  };

  const hasRowActions = Boolean(onDelete || onDisassociate);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <label htmlFor="invoices-sort" className="text-sm text-slate-600">
          Trier
        </label>
        <select
          id="invoices-sort"
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

        <label htmlFor="invoices-per-page" className="text-sm text-slate-600">
          Factures par page
        </label>
        <select
          id="invoices-per-page"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700"
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

      {sortedInvoices.length > 0 && (
        <p className="mb-3 text-sm text-slate-500">Cliquez sur une facture pour en voir le détail.</p>
      )}

      <section className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">N° facture</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Titre</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Client</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Émission</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total TTC</th>
                {hasRowActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  tabIndex={0}
                  className="cursor-pointer transition hover:bg-sky-50/60 focus-visible:bg-sky-50/60 focus-visible:outline-none"
                  onClick={() => openInvoice(invoice)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openInvoice(invoice);
                    }
                  }}
                >
                  <td className="px-4 py-3 font-semibold text-slate-900">{invoice.number}</td>
                  <td className="max-w-[16rem] truncate px-4 py-3 text-slate-700">{invoice.workOrderTitle || '-'}</td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-slate-700">{getClientName(invoice)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(invoice.issueDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={invoice.status} /></td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-900">
                    {formatMoney(invoice.taxInclusiveAmount ?? invoice.total, invoice.currency)}
                  </td>
                  {hasRowActions && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-medium">
                        {onDisassociate && (
                          <button type="button" onClick={(event) => { event.stopPropagation(); void onDisassociate(invoice.id); }} className="text-amber-600 hover:text-amber-800">
                            Désassocier
                          </button>
                        )}
                        {onDelete && (
                          <button type="button" onClick={(event) => { event.stopPropagation(); void onDelete(invoice.id); }} className="text-red-600 hover:text-red-800">
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

      <section className="grid gap-3 sm:hidden">
        {currentInvoices.map((invoice) => (
          <div
            key={invoice.id}
            role="button"
            tabIndex={0}
            onClick={() => openInvoice(invoice)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openInvoice(invoice);
              }
            }}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900">{invoice.number}</p>
                <p className="mt-0.5 truncate text-sm text-slate-600">{invoice.workOrderTitle || '-'}</p>
              </div>
              <StatusBadge status={invoice.status} />
            </div>
            <div className="mt-3 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm text-slate-700">{getClientName(invoice)}</p>
                <p className="text-xs text-slate-500">{formatDate(invoice.issueDate)}</p>
              </div>
              <p className="shrink-0 text-base font-semibold text-slate-900">{formatMoney(invoice.taxInclusiveAmount ?? invoice.total, invoice.currency)}</p>
            </div>
            {hasRowActions && (
              <div className="mt-3 flex justify-end gap-4 border-t border-slate-100 pt-3 text-xs font-medium">
                {onDisassociate && <button type="button" onClick={(event) => { event.stopPropagation(); void onDisassociate(invoice.id); }} className="text-amber-600 hover:text-amber-800">Désassocier du projet</button>}
                {onDelete && <button type="button" onClick={(event) => { event.stopPropagation(); void onDelete(invoice.id); }} className="text-red-600 hover:text-red-800">Supprimer</button>}
              </div>
            )}
          </div>
        ))}
      </section>

      {sortedInvoices.length === 0 && (
        <p className="mt-4 text-sm text-slate-600">Aucune facture a afficher.</p>
      )}

      {sortedInvoices.length > 0 && (
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
                type="button"
                className="ml-auto mr-2 rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700"
                onClick={() => {
                  setInvoiceBeingEdited(selectedInvoice);
                  setInvoiceEditPreview(selectedInvoice);
                  setIsPreviewCollapsed(false);
                }}
              >
                Modifier la facture
              </button>
              <button
                type="button"
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
            <p>nom : {selectedInvoice.customerName || `${selectedInvoice.customerFirstName} ${selectedInvoice.customerLastName}`}</p>
            <p>email : {selectedInvoice.customerEmail || '-'}</p>
            <p>telephone : {selectedInvoice.customerPhoneNumber || '-'}</p>
            <p>
              adresse : {selectedInvoice.customerStreet1} {selectedInvoice.customerStreet2 || ''} {selectedInvoice.customerPostalCode} {selectedInvoice.customerCity}
            </p>

            <p className="mt-4 font-semibold">Chantier</p>
            <p>reference : {selectedInvoice.workOrderReference || '-'}</p>
            <p>titre : {selectedInvoice.workOrderTitle || '-'}</p>

            <p className="mt-4 font-semibold">Montants</p>
            <p>sous-total HT : {formatMoney(selectedInvoice.taxExclusiveAmount ?? selectedInvoice.subtotal, selectedInvoice.currency)}</p>
            <p>TVA : {formatMoney(selectedInvoice.vatAmount, selectedInvoice.currency)}</p>
            <p>remise : {formatMoney(selectedInvoice.allowanceTotal || 0, selectedInvoice.currency)}</p>
            <p>acompte : {formatMoney(selectedInvoice.prepaidAmount || selectedInvoice.depositAmount || 0, selectedInvoice.currency)}</p>
            <p>total TTC : {formatMoney(selectedInvoice.taxInclusiveAmount ?? selectedInvoice.total, selectedInvoice.currency)}</p>

            <p className="mt-4">conditions de paiement : {selectedInvoice.paymentTerms || '-'}</p>
            <p>notes : {selectedInvoice.internalNotes || (Array.isArray(selectedInvoice.notes) ? selectedInvoice.notes.map((note) => note.text).join(' ') : selectedInvoice.notes) || '-'}</p>

            <div className="mt-4">
              <p className="font-semibold">Lignes de facture</p>
              {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {selectedInvoice.items.map((item) => (
                    <li key={item.id}>
                      {item.lineIdentifier || item.position + 1}. {item.title} - {item.quantity} {item.unitLabel || item.unitCode || item.unit || ''} x {formatMoney(item.unitPrice, selectedInvoice.currency)} - TVA {item.vatRate}% - Total {formatMoney(item.subtotal ?? item.total, selectedInvoice.currency)}
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

      {invoiceBeingEdited && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
          onClick={() => setInvoiceBeingEdited(null)}
        >
          <div
            className="flex w-full max-w-7xl flex-col gap-6 xl:flex-row xl:items-start"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0 flex-1 rounded-xl bg-white p-5 shadow-xl">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-zinc-900">Modifier la facture</h3>
                <button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setInvoiceBeingEdited(null)}>
                  Fermer
                </button>
              </div>
              <AddInvoiceForm
                show={true}
                initialInvoice={invoiceBeingEdited}
                invoiceKind={(invoiceBeingEdited.kind as InvoiceKind | undefined) ?? InvoiceKind.STANDARD}
                onCreated={() => undefined}
                onChange={setInvoiceEditPreview}
                onUpdated={(updatedInvoice) => {
                  setSelectedInvoice(updatedInvoice);
                  setInvoiceEditPreview(updatedInvoice);
                  setInvoiceBeingEdited(null);
                  onUpdated?.(updatedInvoice);
                }}
              />
            </div>

            <div className="flex min-w-0 xl:sticky xl:top-6 xl:self-start">
              <button
                type="button"
                aria-label={isPreviewCollapsed ? 'Réélargir l’aperçu de la facture' : 'Réduire l’aperçu de la facture'}
                title={isPreviewCollapsed ? 'Réélargir l’aperçu' : 'Réduire l’aperçu'}
                onClick={() => setIsPreviewCollapsed((current) => !current)}
                className="hidden w-10 shrink-0 self-stretch rounded-l-xl border border-r-0 border-zinc-300 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-100 xl:block"
              >
                {isPreviewCollapsed ? '<-' : '->'}
              </button>
              <div className={`overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm transition-[width] duration-200 xl:rounded-l-none ${isPreviewCollapsed ? 'xl:w-0 xl:overflow-hidden xl:border-l-0 xl:p-0' : 'w-full p-4 xl:w-[min(58rem,calc(100vw-8rem))]'}`}>
                <NewInvoice invoice={invoiceEditPreview ?? invoiceBeingEdited} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
