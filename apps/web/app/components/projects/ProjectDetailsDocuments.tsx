'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../../api-client';
import type { Project } from '../AddProjectForm';
import QuotesList, { type Quote } from '../QuotesList';
import InvoicesList, { type Invoice } from '../InvoicesList';
import AddQuoteForm from '../AddQuoteForm';
import AddInvoiceForm from '../AddInvoiceForm';
import { alertError, btnGhost, btnPrimary, cardClass } from './theme';

type ProjectDetailsDocumentsProps = {
  project: Project;
};

type ProjectData = {
  quotes: Quote[];
  invoices: Invoice[];
};

type DocumentSelection = {
  id: string;
  number: string;
  title?: string;
  customerFirstName?: string;
  customerLastName?: string;
};

export default function ProjectDetailsDocuments({ project }: ProjectDetailsDocumentsProps) {
  const api = useApiClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  const [showQuotesList, setShowQuotesList] = useState(false);
  const [showInvoicesList, setShowInvoicesList] = useState(false);

  // Quote modal states
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [quoteAddMode, setQuoteAddMode] = useState<'existing' | 'new'>('existing');
  const [availableQuotes, setAvailableQuotes] = useState<DocumentSelection[]>([]);
  const [availableQuotesLoading, setAvailableQuotesLoading] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [quoteAssociationError, setQuoteAssociationError] = useState('');
  const [associatingQuote, setAssociatingQuote] = useState(false);

  // Invoice modal states
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [invoiceAddMode, setInvoiceAddMode] = useState<'existing' | 'new'>('existing');
  const [availableInvoices, setAvailableInvoices] = useState<DocumentSelection[]>([]);
  const [availableInvoicesLoading, setAvailableInvoicesLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [invoiceAssociationError, setInvoiceAssociationError] = useState('');
  const [associatingInvoice, setAssociatingInvoice] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      try {
        const response = await api.get(`/projects/${project.id}`);
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data = (await response.json()) as ProjectData;
        if (!cancelled) {
          setQuotes(data.quotes || []);
          setInvoices(data.invoices || []);
          setError('');
        }
      } catch {
        if (!cancelled) {
          setQuotes([]);
          setInvoices([]);
          setError('Erreur lors de la récupération des documents du projet.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [api, project.id, reloadVersion]);

  // Load available quotes when opening quote modal in 'existing' mode
  useEffect(() => {
    if (!showAddQuoteModal || quoteAddMode !== 'existing') {
      return;
    }

    let cancelled = false;

    async function loadAvailableQuotes() {
      setAvailableQuotesLoading(true);
      try {
        const response = await api.get('/quotes');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data = (await response.json()) as DocumentSelection[];
        if (!cancelled) {
          setAvailableQuotes(data);
        }
      } catch {
        if (!cancelled) {
          setQuoteAssociationError('Erreur lors de la récupération des devis.');
        }
      } finally {
        if (!cancelled) {
          setAvailableQuotesLoading(false);
        }
      }
    }

    void loadAvailableQuotes();

    return () => {
      cancelled = true;
    };
  }, [api, quoteAddMode, showAddQuoteModal]);

  // Load available invoices when opening invoice modal in 'existing' mode
  useEffect(() => {
    if (!showAddInvoiceModal || invoiceAddMode !== 'existing') {
      return;
    }

    let cancelled = false;

    async function loadAvailableInvoices() {
      setAvailableInvoicesLoading(true);
      try {
        const response = await api.get('/invoices');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data = (await response.json()) as DocumentSelection[];
        if (!cancelled) {
          setAvailableInvoices(data);
        }
      } catch {
        if (!cancelled) {
          setInvoiceAssociationError('Erreur lors de la récupération des factures.');
        }
      } finally {
        if (!cancelled) {
          setAvailableInvoicesLoading(false);
        }
      }
    }

    void loadAvailableInvoices();

    return () => {
      cancelled = true;
    };
  }, [api, invoiceAddMode, showAddInvoiceModal]);

  function closeAddQuoteModal() {
    setShowAddQuoteModal(false);
    setSelectedQuoteId('');
    setQuoteAssociationError('');
  }

  function closeAddInvoiceModal() {
    setShowAddInvoiceModal(false);
    setSelectedInvoiceId('');
    setInvoiceAssociationError('');
  }

  async function associateQuote(quoteId: string) {
    setAssociatingQuote(true);
    setQuoteAssociationError('');

    try {
      const response = await api.post(`/projects/${project.id}/quotes/${quoteId}`);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      closeAddQuoteModal();
      setReloadVersion((current) => current + 1);
    } catch {
      setQuoteAssociationError('Erreur lors de l’association du devis au projet.');
    } finally {
      setAssociatingQuote(false);
    }
  }

  async function associateInvoice(invoiceId: string) {
    setAssociatingInvoice(true);
    setInvoiceAssociationError('');

    try {
      const response = await api.post(`/projects/${project.id}/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      closeAddInvoiceModal();
      setReloadVersion((current) => current + 1);
    } catch {
      setInvoiceAssociationError('Erreur lors de l’association de la facture au projet.');
    } finally {
      setAssociatingInvoice(false);
    }
  }

  async function disassociateQuote(quoteId: string) {
    try {
      const response = await api.delete(`/projects/${project.id}/quotes/${quoteId}`);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      setReloadVersion((current) => current + 1);
    } catch {
      setError('Erreur lors de la désassociation du devis du projet.');
    }
  }

  async function disassociateInvoice(invoiceId: string) {
    try {
      const response = await api.delete(`/projects/${project.id}/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      setReloadVersion((current) => current + 1);
    } catch {
      setError('Erreur lors de la désassociation de la facture du projet.');
    }
  }

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${cardClass}`}>
        <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setShowAddQuoteModal(true)}
          >
            Ajouter un devis au projet
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={() => setShowAddInvoiceModal(true)}
          >
            Ajouter une facture au projet
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Chargement des documents...</p>}
      {error && <div className={alertError}>{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          {/* Section Devis */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Devis</h4>
                <p className="mt-1 text-sm text-slate-600">{quotes.length} devis associé(s)</p>
              </div>
              <button
                type="button"
                className={btnGhost}
                onClick={() => setShowQuotesList((current) => !current)}
              >
                {showQuotesList ? 'Fermer' : 'Voir'}
              </button>
            </div>

            {showQuotesList && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                {quotes.length > 0 ? (
                  <QuotesList quotes={quotes} onDelete={null} onDisassociate={disassociateQuote} />
                ) : (
                  <p className="text-sm text-slate-500">Aucun devis associé à ce projet.</p>
                )}
              </div>
            )}
          </div>

          {/* Section Factures */}
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Factures</h4>
                <p className="mt-1 text-sm text-slate-600">{invoices.length} facture(s) associée(s)</p>
              </div>
              <button
                type="button"
                className={btnGhost}
                onClick={() => setShowInvoicesList((current) => !current)}
              >
                {showInvoicesList ? 'Fermer' : 'Voir'}
              </button>
            </div>

            {showInvoicesList && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                {invoices.length > 0 ? (
                  <InvoicesList invoices={invoices} onDelete={null} onDisassociate={disassociateInvoice} />
                ) : (
                  <p className="text-sm text-slate-500">Aucune facture associée à ce projet.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ajouter un devis */}
      {showAddQuoteModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={closeAddQuoteModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-slate-900">Ajouter un devis au projet</h4>
              <button
                type="button"
                className={btnGhost}
                onClick={closeAddQuoteModal}
              >
                Fermer
              </button>
            </div>

            <div className="mb-4 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                className={`border-b-2 px-3 py-2 text-sm ${
                  quoteAddMode === 'existing'
                    ? 'border-indigo-600 font-medium text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setQuoteAddMode('existing')}
              >
                Devis existant
              </button>
              <button
                type="button"
                className={`border-b-2 px-3 py-2 text-sm ${
                  quoteAddMode === 'new'
                    ? 'border-indigo-600 font-medium text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setQuoteAddMode('new')}
              >
                Nouveau devis
              </button>
            </div>

            {quoteAssociationError && <div className={`mb-4 ${alertError}`}>{quoteAssociationError}</div>}

            {quoteAddMode === 'existing' ? (
              <div className="space-y-4">
                {availableQuotesLoading ? (
                  <p className="text-sm text-slate-500">Chargement des devis...</p>
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={selectedQuoteId}
                    onChange={(event) => setSelectedQuoteId(event.target.value)}
                  >
                    <option value="">-- Sélectionner un devis --</option>
                    {availableQuotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.number} {q.title ? `- ${q.title}` : ''}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  disabled={!selectedQuoteId || associatingQuote}
                  className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={() => void associateQuote(selectedQuoteId)}
                >
                  {associatingQuote ? 'Association...' : 'Associer au projet'}
                </button>
              </div>
            ) : (
              <AddQuoteForm
                show={true}
                onCreated={(createdQuote) => void associateQuote(createdQuote.id)}
              />
            )}
          </div>
        </div>
      )}

      {/* Modal Ajouter une facture */}
      {showAddInvoiceModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
          onClick={closeAddInvoiceModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold text-slate-900">Ajouter une facture au projet</h4>
              <button
                type="button"
                className={btnGhost}
                onClick={closeAddInvoiceModal}
              >
                Fermer
              </button>
            </div>

            <div className="mb-4 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                className={`border-b-2 px-3 py-2 text-sm ${
                  invoiceAddMode === 'existing'
                    ? 'border-indigo-600 font-medium text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setInvoiceAddMode('existing')}
              >
                Facture existante
              </button>
              <button
                type="button"
                className={`border-b-2 px-3 py-2 text-sm ${
                  invoiceAddMode === 'new'
                    ? 'border-indigo-600 font-medium text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
                onClick={() => setInvoiceAddMode('new')}
              >
                Nouvelle facture
              </button>
            </div>

            {invoiceAssociationError && <div className={`mb-4 ${alertError}`}>{invoiceAssociationError}</div>}

            {invoiceAddMode === 'existing' ? (
              <div className="space-y-4">
                {availableInvoicesLoading ? (
                  <p className="text-sm text-slate-500">Chargement des factures...</p>
                ) : (
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={selectedInvoiceId}
                    onChange={(event) => setSelectedInvoiceId(event.target.value)}
                  >
                    <option value="">-- Sélectionner une facture --</option>
                    {availableInvoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.number}
                        {inv.customerFirstName || inv.customerLastName
                          ? ` - ${inv.customerFirstName ?? ''} ${inv.customerLastName ?? ''}`
                          : ''}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  disabled={!selectedInvoiceId || associatingInvoice}
                  className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={() => void associateInvoice(selectedInvoiceId)}
                >
                  {associatingInvoice ? 'Association...' : 'Associer au projet'}
                </button>
              </div>
            ) : (
              <AddInvoiceForm
                show={true}
                onCreated={(createdInvoice) => void associateInvoice(createdInvoice.id)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
