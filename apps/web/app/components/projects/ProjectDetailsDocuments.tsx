'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../../api-client';
import type { Project } from '../AddProjectForm';
import QuotesList, { type Quote } from '../QuotesList';
import InvoicesList, { type Invoice } from '../InvoicesList';
import { alertError, btnGhost, btnPrimary, cardClass } from './theme';

type ProjectDetailsDocumentsProps = {
  project: Project;
  onRequestAssociateQuote: () => void;
  onRequestCreateQuote: () => void;
  onRequestAssociateInvoice: () => void;
  onRequestCreateInvoice: () => void;
  onChanged: () => void;
};

type ProjectData = {
  quotes: Quote[];
  invoices: Invoice[];
};

export default function ProjectDetailsDocuments({
  project,
  onRequestAssociateQuote,
  onRequestCreateQuote,
  onRequestAssociateInvoice,
  onRequestCreateInvoice,
  onChanged,
}: ProjectDetailsDocumentsProps) {
  const api = useApiClient();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQuotesList, setShowQuotesList] = useState(false);
  const [showInvoicesList, setShowInvoicesList] = useState(false);
  const [disassociatingId, setDisassociatingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setLoading(true);
      try {
        const response = await api.get(`/projects/${project.id}`);
        if (!response.ok) throw new Error('Erreur');
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
        if (!cancelled) setLoading(false);
      }
    }

    void loadDocuments();
    return () => { cancelled = true; };
  }, [api, project.id]);

  async function disassociateQuote(quoteId: string) {
    if (!window.confirm('Retirer ce devis du projet ? Le devis ne sera pas supprimé.')) return;
    setDisassociatingId(quoteId);
    try {
      const response = await api.delete(`/projects/${project.id}/quotes/${quoteId}`);
      if (!response.ok) throw new Error('Erreur');
      setQuotes((current) => current.filter((quote) => quote.id !== quoteId));
      onChanged();
    } catch {
      setError('Erreur lors de la désassociation du devis du projet.');
    } finally { setDisassociatingId(null);
    }
  }

  async function disassociateInvoice(invoiceId: string) {
    if (!window.confirm('Retirer cette facture du projet ? La facture ne sera pas supprimée.')) return;
    setDisassociatingId(invoiceId);
    try {
      const response = await api.delete(`/projects/${project.id}/invoices/${invoiceId}`);
      if (!response.ok) throw new Error('Erreur');
      setInvoices((current) => current.filter((invoice) => invoice.id !== invoiceId));
      onChanged();
    } catch {
      setError('Erreur lors de la désassociation de la facture du projet.');
    } finally { setDisassociatingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center justify-between gap-3 ${cardClass}`}>
        <h3 className="text-sm font-semibold text-slate-900">Documents</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={onRequestAssociateQuote}>Associer un devis</button>
          <button type="button" className={btnGhost} onClick={onRequestCreateQuote}>Créer un devis</button>
          <button type="button" className={btnPrimary} onClick={onRequestAssociateInvoice}>Associer une facture</button>
          <button type="button" className={btnGhost} onClick={onRequestCreateInvoice}>Créer une facture</button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Chargement des documents...</p>}
      {error && <div className={alertError}>{error}</div>}

      {!loading && !error && (
        <div className="space-y-4">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Devis</h4>
                <p className="mt-1 text-sm text-slate-600">{quotes.length} devis associé(s)</p>
              </div>
              <button type="button" className={btnGhost} onClick={() => setShowQuotesList((current) => !current)}>{showQuotesList ? 'Fermer' : 'Voir'}</button>
            </div>
            {showQuotesList && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                {quotes.length > 0 ? <><QuotesList quotes={quotes} onDelete={null} onDisassociate={(id) => void disassociateQuote(id)} />{disassociatingId && quotes.some((quote) => quote.id === disassociatingId) && <p className="mt-2 text-sm text-slate-500">Retrait du devis du projet...</p>}</> : <p className="text-sm text-slate-500">Aucun devis associé à ce projet.</p>}
              </div>
            )}
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Factures</h4>
                <p className="mt-1 text-sm text-slate-600">{invoices.length} facture(s) associée(s)</p>
              </div>
              <button type="button" className={btnGhost} onClick={() => setShowInvoicesList((current) => !current)}>{showInvoicesList ? 'Fermer' : 'Voir'}</button>
            </div>
            {showInvoicesList && (
              <div className="mt-4 border-t border-slate-200 pt-4">
                {invoices.length > 0 ? <><InvoicesList invoices={invoices} onDelete={null} onDisassociate={(id) => void disassociateInvoice(id)} onUpdated={(updatedInvoice) => setInvoices((current) => current.map((invoice) => invoice.id === updatedInvoice.id ? updatedInvoice : invoice))} />{disassociatingId && invoices.some((invoice) => invoice.id === disassociatingId) && <p className="mt-2 text-sm text-slate-500">Retrait de la facture du projet...</p>}</> : <p className="text-sm text-slate-500">Aucune facture associée à ce projet.</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
