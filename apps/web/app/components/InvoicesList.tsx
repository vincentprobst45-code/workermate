'use client';

import { useEffect, useRef, useState } from 'react';
import { InvoiceKind, InvoicePdpStatus, InvoiceStatus, PaymentMethod, VatCategory } from '@prisma/client';
import AddInvoiceForm from './AddInvoiceForm';
import type { Payment } from './AddPaymentForm';
import InvoicePaymentsList from './InvoicePaymentsList';
import { useApiClient } from '../api-client';

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
  vatCategory: VatCategory;
  vatRate?: number;
  reason?: string;
  reasonCode?: string;
}

export interface Invoice {
  id: string;
  tenantId: string;
  customerId: string;
  customer?: {
    firstName?: string | null;
    lastName?: string | null;
    company?: string | null;
  } | null;
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
  paidAmount?: number;
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
  onSendEmail?: ((id: string) => void | Promise<void>) | null;
  onUpdated?: ((invoice: Invoice) => void) | null;
  onCorrect?: ((invoice: Invoice, kind: 'CREDIT_NOTE' | 'CORRECTIVE') => void | Promise<void>) | null;
  handleSelectedInvoice?: ((invoice: Invoice) => void | Promise<void>) | null;
  initialInvoiceId?: string;
  initialInvoiceMode?: 'view' | 'edit';
  syncUrl?: boolean;
}

interface EmailHistoryEntry {
  id: string;
  recipient: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  sentAt?: string | null;
  createdAt: string;
  errorMessage?: string | null;
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
  const relatedCustomerName = [invoice.customer?.firstName, invoice.customer?.lastName].filter(Boolean).join(' ');
  return relatedCustomerName || invoice.customer?.company?.trim() || invoice.customerName?.trim() || [invoice.customerFirstName, invoice.customerLastName].filter(Boolean).join(' ') || '-';
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
  onSendEmail = null,
  onUpdated = null,
  onCorrect = null,
  handleSelectedInvoice = null,
  initialInvoiceId,
  initialInvoiceMode = 'view',
  syncUrl = false,
}: InvoicesListProps) {
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceBeingEdited, setInvoiceBeingEdited] = useState<Invoice | null>(null);
  const [invoiceToCorrect, setInvoiceToCorrect] = useState<Invoice | null>(null);
  const [invoicesPerPage, setInvoicesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortBy>('createdAtDesc');
  const openedInvoiceIdRef = useRef<string | null>(null);
  const api = useApiClient();
  const [emailHistory, setEmailHistory] = useState<EmailHistoryEntry[]>([]);
  const [emailHistoryLoading, setEmailHistoryLoading] = useState(false);
  const [emailHistoryError, setEmailHistoryError] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [pdfDownloadError, setPdfDownloadError] = useState(false);
  const [invoicePreviewUrl, setInvoicePreviewUrl] = useState<string | null>(null);
  const [invoicePreviewId, setInvoicePreviewId] = useState<string | null>(null);
  const [invoicePreviewLoading, setInvoicePreviewLoading] = useState(false);
  const [invoicePreviewError, setInvoicePreviewError] = useState(false);

  useEffect(() => {
    if (!showInvoiceDetails || !selectedInvoice) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setInvoicePreviewLoading(true);
        setInvoicePreviewError(false);
      }
    });

    void api.get(`/invoices/${selectedInvoice.id}/preview-pdf`)
      .then(async (response) => {
        if (!response.ok) throw new Error('invoice-preview');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setInvoicePreviewId(selectedInvoice.id);
        setInvoicePreviewUrl(url);
      })
      .catch(() => {
        if (!cancelled) setInvoicePreviewError(true);
      })
      .finally(() => {
        if (!cancelled) setInvoicePreviewLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [api, selectedInvoice, showInvoiceDetails]);

  useEffect(() => () => {
    if (invoicePreviewUrl) URL.revokeObjectURL(invoicePreviewUrl);
  }, [invoicePreviewUrl]);

  useEffect(() => {
    if (!showInvoiceDetails || !selectedInvoice) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setEmailHistoryLoading(true);
        setEmailHistoryError(false);
      }
    });
    void api.get(`/invoices/${selectedInvoice.id}/email-history`)
      .then(async (response) => {
        if (!response.ok) throw new Error('history');
        const entries = await response.json() as EmailHistoryEntry[];
        if (!cancelled) setEmailHistory(entries);
      })
      .catch(() => {
        if (!cancelled) setEmailHistoryError(true);
      })
      .finally(() => {
        if (!cancelled) setEmailHistoryLoading(false);
      });
    return () => { cancelled = true; };
  }, [api, selectedInvoice, showInvoiceDetails]);

  const updateInvoiceUrl = (invoiceId?: string, mode: 'view' | 'edit' = 'view', replace = false) => {
    if (!syncUrl) return;
    const url = new URL(window.location.href);
    if (invoiceId) {
      url.searchParams.set('invoice', invoiceId);
      if (mode === 'edit') {
        url.searchParams.set('edit', '1');
      } else {
        url.searchParams.delete('edit');
      }
    } else {
      url.searchParams.delete('invoice');
      url.searchParams.delete('edit');
    }
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  };

  useEffect(() => {
    if (!syncUrl || !initialInvoiceId || showInvoiceDetails || invoiceBeingEdited || openedInvoiceIdRef.current === initialInvoiceId) return;
    const invoice = invoices.find((item) => item.id === initialInvoiceId);
    if (invoice) {
      const timer = window.setTimeout(() => {
        openedInvoiceIdRef.current = initialInvoiceId;
        setSelectedInvoice(invoice);
        if (initialInvoiceMode === 'edit') {
          setInvoiceBeingEdited(invoice);
        } else {
          setShowInvoiceDetails(true);
        }
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [initialInvoiceId, initialInvoiceMode, invoices, invoiceBeingEdited, showInvoiceDetails, syncUrl]);

  useEffect(() => {
    if (!syncUrl) return;

    const handleHistoryChange = () => {
      const url = new URL(window.location.href);
      const invoiceId = url.searchParams.get('invoice');
      const invoice = invoiceId ? invoices.find((item) => item.id === invoiceId) : null;

      if (!invoice) {
        setShowInvoiceDetails(false);
        setInvoiceBeingEdited(null);
        setSelectedInvoice(null);
        return;
      }

      openedInvoiceIdRef.current = invoice.id;
      setSelectedInvoice(invoice);
      if (url.searchParams.get('edit') === '1') {
        setShowInvoiceDetails(false);
        setInvoiceBeingEdited(invoice);
      } else {
        setInvoiceBeingEdited(null);
        setShowInvoiceDetails(true);
      }
    };

    window.addEventListener('popstate', handleHistoryChange);
    return () => window.removeEventListener('popstate', handleHistoryChange);
  }, [invoices, syncUrl]);

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
      updateInvoiceUrl(invoice.id);
    }
  };

  const downloadInvoicePdf = async () => {
    if (!selectedInvoice || pdfDownloading) return;
    setPdfDownloading(true);
    setPdfDownloadError(false);
    try {
      const response = await api.get(`/invoices/${selectedInvoice.id}/pdf`);
      if (!response.ok) throw new Error('pdf-download');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture-${selectedInvoice.number || selectedInvoice.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setPdfDownloadError(true);
    } finally {
      setPdfDownloading(false);
    }
  };

  const hasRowActions = Boolean(onDelete || onDisassociate || onCorrect);

  const updateSelectedInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    onUpdated?.(invoice);
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-end gap-3">
        <label htmlFor="invoices-sort" className="text-sm text-slate-600">
          Trier
        </label>
        <select
          id="invoices-sort"
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
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

      <section className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
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
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Paiements reçus</th>
                {hasRowActions && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  tabIndex={0}
                  className="cursor-pointer transition hover:bg-indigo-50/50 focus-visible:bg-indigo-50/50 focus-visible:outline-none"
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
                  <td className="whitespace-nowrap px-4 py-3 text-right text-slate-700">
                    {formatMoney(invoice.paidAmount ?? 0, invoice.currency)}
                  </td>
                  {hasRowActions && (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3 text-xs font-medium">
                        {onDisassociate && (
                          <button type="button" onClick={(event) => { event.stopPropagation(); void onDisassociate(invoice.id); }} className="text-amber-600 hover:text-amber-800">
                            Désassocier
                          </button>
                        )}
                        {onDelete && invoice.status === InvoiceStatus.DRAFT && (
                          <button type="button" onClick={(event) => { event.stopPropagation(); void onDelete(invoice.id); }} className="text-red-600 hover:text-red-800">
                            Supprimer
                          </button>
                        )}
                        {onCorrect && invoice.status === InvoiceStatus.ISSUED && (
                          <button type="button" onClick={(event) => { event.stopPropagation(); setInvoiceToCorrect(invoice); }} className="text-indigo-600 hover:text-indigo-800">
                            Corriger
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
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition active:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
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
                <div className="shrink-0 text-right"><p className="text-base font-semibold text-slate-900">{formatMoney(invoice.taxInclusiveAmount ?? invoice.total, invoice.currency)}</p><p className="text-xs text-slate-500">Reçu : {formatMoney(invoice.paidAmount ?? 0, invoice.currency)}</p></div>
            </div>
            {hasRowActions && (
              <div className="mt-3 flex justify-end gap-4 border-t border-slate-100 pt-3 text-xs font-medium">
                {onDisassociate && <button type="button" onClick={(event) => { event.stopPropagation(); void onDisassociate(invoice.id); }} className="text-amber-600 hover:text-amber-800">Désassocier du projet</button>}
                {onDelete && invoice.status === InvoiceStatus.DRAFT && <button type="button" onClick={(event) => { event.stopPropagation(); void onDelete(invoice.id); }} className="text-red-600 hover:text-red-800">Supprimer</button>}
                {onCorrect && invoice.status === InvoiceStatus.ISSUED && <button type="button" onClick={(event) => { event.stopPropagation(); setInvoiceToCorrect(invoice); }} className="text-indigo-600 hover:text-indigo-800">Corriger</button>}
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
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={effectiveCurrentPage === 1}
          >
            Precedent
          </button>

          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${pageNumber === effectiveCurrentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => setCurrentPage(pageNumber)}
              aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          ))}

          <button
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={effectiveCurrentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {showInvoiceDetails && selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => {
            setShowInvoiceDetails(false);
            setSelectedInvoice(null);
            updateInvoiceUrl(undefined, 'view', true);
          }}
        >
          <div
            className="max-h-[85vh] w-[92vw] max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pb-4 flex items-center">
              <h3 className="inline-block text-2xl">
                <strong>Details facture</strong>
              </h3>
                {onSendEmail && <button
                type="button"
                  className="ml-auto mr-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={() => void onSendEmail(selectedInvoice.id)}
              >
                Envoyer par email
              </button>}
                <button
                  type="button"
                  className="mr-2 rounded-lg border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => void downloadInvoicePdf()}
                  disabled={pdfDownloading}
                >
                  {pdfDownloading ? 'Génération...' : 'Télécharger la facture'}
                </button>
                <button
                type="button"
                  className="ml-auto mr-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                onClick={() => {
                  setInvoiceBeingEdited(selectedInvoice);
                  updateInvoiceUrl(selectedInvoice.id, 'edit');
                }}
              >
                Modifier la facture
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => {
                  setShowInvoiceDetails(false);
                  setSelectedInvoice(null);
                  updateInvoiceUrl(undefined, 'view', true);
                }}
              >
                Fermer X
              </button>
            </div>
                <section className="mb-6" aria-label="Aperçu PDF de la facture">
                  {invoicePreviewLoading && <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">Génération de l&apos;aperçu...</p>}
                  {invoicePreviewError && <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Aperçu PDF indisponible.</p>}
                  {invoicePreviewUrl && invoicePreviewId === selectedInvoice.id && !invoicePreviewLoading && (
                    <iframe
                      title={`Aperçu PDF de la facture ${selectedInvoice.number}`}
                      src={invoicePreviewUrl}
                      className="h-[70vh] min-h-[32rem] w-full rounded-lg border border-slate-200 bg-slate-100"
                    />
                  )}
                </section>
                <InvoicePaymentsList invoice={selectedInvoice} onChanged={updateSelectedInvoice} />
            <section className="mt-6 border-t border-slate-200 pt-4">
              {pdfDownloadError && <p className="mb-3 text-sm text-red-600">Téléchargement du PDF impossible.</p>}
              <h4 className="font-semibold text-slate-900">Historique des envois</h4>
              {emailHistoryLoading && <p className="mt-2 text-sm text-slate-500">Chargement...</p>}
              {emailHistoryError && <p className="mt-2 text-sm text-red-600">Historique indisponible.</p>}
              {!emailHistoryLoading && !emailHistoryError && emailHistory.length === 0 && <p className="mt-2 text-sm text-slate-500">Aucun envoi enregistré.</p>}
              <div className="mt-2 space-y-2">
                {emailHistory.map((entry) => (
                  <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm">
                    <span>{entry.recipient}</span>
                    <span className={entry.status === 'SENT' ? 'font-semibold text-emerald-700' : entry.status === 'FAILED' ? 'font-semibold text-red-700' : 'font-semibold text-amber-700'}>
                      {entry.status === 'SENT' ? 'Envoyé' : entry.status === 'FAILED' ? 'Échec' : 'En cours'}
                    </span>
                    <time dateTime={entry.sentAt ?? entry.createdAt} className="text-slate-500">{formatDate(entry.sentAt ?? entry.createdAt)}</time>
                    {entry.errorMessage && <span className="basis-full text-xs text-red-600">{entry.errorMessage}</span>}
                  </div>
                ))}
              </div>
            </section>
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
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:p-6"
          onClick={() => {
            setInvoiceBeingEdited(null);
            setShowInvoiceDetails(true);
            updateInvoiceUrl(selectedInvoice?.id, 'view', true);
          }}
        >
          <div
            className="flex w-full max-w-7xl flex-col gap-6 xl:flex-row xl:items-start"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
              <div className="mb-4 flex justify-end">
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={() => { setInvoiceBeingEdited(null); setShowInvoiceDetails(true); updateInvoiceUrl(selectedInvoice?.id, 'view', true); }}>
                  Fermer
                </button>
              </div>
              <AddInvoiceForm
                show={true}
                initialInvoice={invoiceBeingEdited}
                invoiceKind={(invoiceBeingEdited.kind as InvoiceKind | undefined) ?? InvoiceKind.STANDARD}
                onCreated={() => undefined}
                onUpdated={(updatedInvoice) => {
                  setSelectedInvoice(updatedInvoice);
                  setInvoiceBeingEdited(null);
                  setShowInvoiceDetails(true);
                  updateInvoiceUrl(updatedInvoice.id, 'view', true);
                  onUpdated?.(updatedInvoice);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {invoiceToCorrect && onCorrect && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Corriger la facture {invoiceToCorrect.number}</h3>
            <p className="mt-3 text-sm text-slate-600">Une facture émise ne peut pas être supprimée. Vous pouvez créer un avoir pour l’annuler financièrement ou une facture corrective pour remplacer ses informations.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setInvoiceToCorrect(null)} className="rounded-md border border-slate-300 px-3 py-2 text-sm">Fermer</button>
              <button type="button" onClick={() => { const invoice = invoiceToCorrect; setInvoiceToCorrect(null); void onCorrect(invoice, 'CREDIT_NOTE'); }} className="rounded-md border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-700">Créer un avoir</button>
              <button type="button" onClick={() => { const invoice = invoiceToCorrect; setInvoiceToCorrect(null); void onCorrect(invoice, 'CORRECTIVE'); }} className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white">Créer une corrective</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
