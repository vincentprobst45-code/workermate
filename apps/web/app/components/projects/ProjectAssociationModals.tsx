'use client';

import { useEffect, useState } from 'react';
import { InvoiceKind } from '@prisma/client';
import { useApiClient } from '../../api-client';
import AddCustomerForm, { type Customer } from '../AddCustomerForm';
import AddWorkOrderForm from '../AddWorkOrderForm';
import CustomersList, { type Customer as CustomerListItem } from '../CustomersList';
import WorkOrdersList, { type WorkOrder } from '../WorkOrdersList';
import AddQuoteForm from '../AddQuoteForm';
import AddInvoiceForm from '../AddInvoiceForm';
import QuotesList, { type Quote } from '../QuotesList';
import InvoicesList, { type Invoice } from '../InvoicesList';
import type { Project } from '../AddProjectForm';
import { alertError, btnGhost } from './theme';

type AssociationModalKind = 'customer' | 'workOrder' | 'quote' | 'invoice';
type AssociationModalMode = 'existing' | 'new';

type ProjectAssociationModalsProps = {
  project: Project;
  kind: AssociationModalKind | null;
  mode: AssociationModalMode;
  onClose: () => void;
  onChanged: () => void;
};

export default function ProjectAssociationModals({
  project,
  kind,
  mode,
  onClose,
  onChanged,
}: ProjectAssociationModalsProps) {
  const api = useApiClient();
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!kind) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [kind, onClose]);

  useEffect(() => {
    if (!kind || mode !== 'existing') return;

    let cancelled = false;
    async function loadOptions() {
      setLoading(true);
      setError('');
      try {
        const endpoint = kind === 'customer' ? '/customers' : kind === 'workOrder' ? '/workOrders' : kind === 'quote' ? '/quotes' : '/invoices';
        const response = await api.get(endpoint);
        if (!response.ok) throw new Error('Erreur');
        const data = await response.json();
        if (cancelled) return;
        if (kind === 'customer') setCustomers(data as CustomerListItem[]);
        else if (kind === 'workOrder') setWorkOrders(data as WorkOrder[]);
        else if (kind === 'quote') setQuotes(data as Quote[]);
        else setInvoices(data as Invoice[]);
      } catch {
        if (!cancelled) setError(`Impossible de récupérer les ${kind === 'customer' ? 'clients' : kind === 'workOrder' ? 'chantiers' : kind === 'quote' ? 'devis' : 'factures'}.`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOptions();
    return () => { cancelled = true; };
  }, [api, kind, mode]);

  async function associate(id: string) {
    setLoading(true);
    setError('');
    try {
      const endpoint = kind === 'customer'
        ? `/projects/${project.id}/customers/${id}`
        : kind === 'workOrder'
          ? `/projects/${project.id}/work-orders/${id}`
          : kind === 'quote'
            ? `/projects/${project.id}/quotes/${id}`
            : `/projects/${project.id}/invoices/${id}`;
      const response = await api.post(endpoint);
      if (!response.ok) throw new Error('Erreur');
      onChanged();
      onClose();
    } catch {
      setError(`Impossible d’associer ${kind === 'customer' ? 'le client' : kind === 'workOrder' ? 'le chantier' : kind === 'quote' ? 'le devis' : 'la facture'} au projet.`);
    } finally {
      setLoading(false);
    }
  }

  if (!kind) return null;

  const label = kind === 'customer' ? 'client' : kind === 'workOrder' ? 'chantier' : kind === 'quote' ? 'devis' : 'facture';
  const title = mode === 'existing' ? `Associer ${label}` : `Créer ${label}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" role="presentation" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="project-association-title" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 id="project-association-title" className="text-lg font-semibold text-slate-900">{title}</h3>
          <button type="button" className={btnGhost} onClick={onClose}>Fermer</button>
        </div>
        {error && <div className={`mb-4 ${alertError}`} role="alert">{error}</div>}
        {mode === 'existing' && loading && <p className="mb-4 text-sm text-slate-500">Chargement...</p>}
        {mode === 'existing' && !loading && kind === 'customer' && (
          <CustomersList
            customers={customers.filter((customer) => !project.customers.some((link) => link.customerId === customer.id))}
            onDelete={null}
            handleSelectedCustomer={(customer) => void associate(customer.id)}
          />
        )}
        {mode === 'existing' && !loading && kind === 'workOrder' && (
          <WorkOrdersList
            workOrders={workOrders}
            onDelete={null}
            handleSelectedWorkOrder={(workOrder) => void associate(workOrder.id)}
          />
        )}
        {mode === 'existing' && !loading && kind === 'quote' && (
          <QuotesList quotes={quotes} onDelete={null} handleSelectedQuote={(quote) => void associate(quote.id)} />
        )}
        {mode === 'existing' && !loading && kind === 'invoice' && (
          <InvoicesList invoices={invoices} onDelete={null} handleSelectedInvoice={(invoice) => void associate(invoice.id)} />
        )}
        {mode === 'new' && kind === 'customer' && (
          <AddCustomerForm show={true} onCreated={(customer: Customer) => void associate(customer.id)} />
        )}
        {mode === 'new' && kind === 'workOrder' && (
          <AddWorkOrderForm show={true} onCreated={(workOrder) => void associate(workOrder.id)} />
        )}
        {mode === 'new' && kind === 'quote' && (
          <AddQuoteForm show={true} onCreated={(quote) => void associate(quote.id)} />
        )}
        {mode === 'new' && kind === 'invoice' && (
          <AddInvoiceForm show={true} invoiceKind={InvoiceKind.STANDARD} onCreated={(invoice) => void associate(invoice.id)} />
        )}
      </div>
    </div>
  );
}
