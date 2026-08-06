'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { ProtectedRoute } from '../protected-route';
import WorkOrdersList, { type WorkOrder } from '../components/WorkOrdersList';
import InvoicesList, { type Invoice } from '../components/InvoicesList';

export interface AddInvoiceFromWorkOrder {
  workOrderId: string;

  issueDate: string;
  dueDate?: string;

  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;

  discountAmount?: number;
  depositAmount?: number;
}

interface TenantInvoiceDefaults {
  defaultPaymentTerms?: string | null;
  defaultLegalMentions?: string | null;
  defaultInvoiceNotes?: string | null;
}

function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export function createEmptyInvoiceFromWorkOrder(
  tenantDefaults?: TenantInvoiceDefaults,
): AddInvoiceFromWorkOrder {
  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 30);

  return {
    workOrderId: '',

    issueDate: toDatetimeLocal(now),
    dueDate: toDatetimeLocal(dueDate),
    
    paymentTerms: tenantDefaults?.defaultPaymentTerms || '',
    legalMentions: tenantDefaults?.defaultLegalMentions || '',
    notes: tenantDefaults?.defaultInvoiceNotes || '',

    discountAmount: 0,
    depositAmount: 0,
  };
}

export default function InvoicesPage() {
  const api = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tenantDefaults, setTenantDefaults] = useState<TenantInvoiceDefaults>({});
  const [loading, setLoading] = useState(true);
  const [workOrderLoading, setWorkOrderLoading] = useState(true);
  const [error, setError] = useState('');
  const [newInvoice, setNewInvoice] = useState({ number: '', amount: 0, description: '' });
  const [newInvoiceFromWorkOrder, setNewInvoiceFromWorkOrder] = useState<AddInvoiceFromWorkOrder>(createEmptyInvoiceFromWorkOrder());
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder>();

  useEffect(() => {
    let cancelled = false;

    async function loadTenantDefaults() {
      try {
        const res = await api.get('/tenants/current');
        if (!res.ok) throw new Error('Erreur');
        const data: TenantInvoiceDefaults = await res.json();
        if (!cancelled) {
          setTenantDefaults(data);
          setNewInvoiceFromWorkOrder((current) => {
            const defaults = createEmptyInvoiceFromWorkOrder(data);
            return {
              ...defaults,
              workOrderId: current.workOrderId,
            };
          });
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des paramètres entreprise');
        }
      }
    }

    void loadTenantDefaults();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrders() {
      try {
        const res = await api.get('/workOrders');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (!cancelled) {
          setWorkOrders(data);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des chantiers');
        }
      } finally {
        if (!cancelled) {
          setWorkOrderLoading(false);
        }
      }
    }

    void loadWorkOrders();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    const loadInvoices = async () => {
      try {
        const res = await api.get('/invoices');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (!cancelled) {
          setInvoices(data);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des factures');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInvoices();

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleAddInvoice(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post('/invoices', newInvoice);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setInvoices([data, ...invoices]);
      setNewInvoice({ number: '', amount: 0, description: '' });
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  }

  async function handleAddInvoiceFromWorkOrderId(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      const res = await api.post('/invoices/from-workOrder', newInvoiceFromWorkOrder);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setInvoices([data, ...invoices]);
      setNewInvoiceFromWorkOrder((current) => ({
        ...createEmptyInvoiceFromWorkOrder(tenantDefaults),
        workOrderId: current.workOrderId,
        // workOrderId: current.workOrderId,
      }));
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/invoices/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setInvoices(invoices.filter((i) => i.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6">Gestion des Factures</h2>
        {selectedWorkOrder && (
          <div>
            <form onSubmit={handleAddInvoiceFromWorkOrderId}>
              <h3>WorkOrder sélectionné : {selectedWorkOrder.title}</h3>
              <input type="hidden" value={newInvoiceFromWorkOrder.workOrderId} readOnly />
              <input
                type="datetime-local"
                className="border px-3 py-2 rounded"
                placeholder="Start"
                value={newInvoiceFromWorkOrder.dueDate}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, dueDate: e.target.value })}
                required
              />
              <input
                type="datetime-local"
                className="border px-3 py-2 rounded"
                placeholder="End"
                value={newInvoiceFromWorkOrder.issueDate}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, issueDate: e.target.value })}
                required
              />
              <input
                className="border px-3 py-2 rounded"
                placeholder="Mentions légales"
                value={newInvoiceFromWorkOrder.legalMentions}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, legalMentions: e.target.value })}
                required
              />
              <input
                className="border px-3 py-2 rounded"
                placeholder="Notes"
                value={newInvoiceFromWorkOrder.notes}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, notes: e.target.value })}
                required
              />
              <input
                className="border px-3 py-2 rounded"
                placeholder="Conditions de paiement"
                value={newInvoiceFromWorkOrder.paymentTerms}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, paymentTerms: e.target.value })}
                required
              />
              <input
                type="number"
                className="border px-3 py-2 rounded"
                placeholder="Remise"
                value={newInvoiceFromWorkOrder.discountAmount}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, discountAmount: e.target.valueAsNumber })}
                required
              />
              <input
                type="number"
                className="border px-3 py-2 rounded"
                placeholder="Acompte"
                value={newInvoiceFromWorkOrder.depositAmount}
                onChange={(e) => setNewInvoiceFromWorkOrder({ ...newInvoiceFromWorkOrder, depositAmount: e.target.valueAsNumber })}
                required
              />
              <button
                type="submit"
                className="border-double border-gray-700 border-2 shadow-md text-xl text-white rounded-sm mx-4 my-2 py-2 px-3 bg-blue-400 hover:bg-blue-600 active:bg-blue-900"
              >
                Créer la facture pour ce chantier
              </button>
            </form>
          </div>
        )}
        <h3>Chantiers</h3>
        {!workOrderLoading &&
        <WorkOrdersList
          workOrders={workOrders}
          onDelete={null}
          handleSelectedWorkOrder={(workOrder) => {
            setSelectedWorkOrder(workOrder);
            setNewInvoiceFromWorkOrder((current) => ({ ...current, workOrderId: workOrder.id }));
          }}
        />
        }

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        {/* <form onSubmit={handleAddInvoice} className="mb-8 p-5 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-4">Ajouter une facture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Numéro"
              value={newInvoice.number}
              onChange={(e) => setNewInvoice({ ...newInvoice, number: e.target.value })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Montant"
              type="number"
              step="0.01"
              value={newInvoice.amount}
              onChange={(e) => setNewInvoice({ ...newInvoice, amount: parseFloat(e.target.value) })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Description"
              value={newInvoice.description}
              onChange={(e) => setNewInvoice({ ...newInvoice, description: e.target.value })}
            />
          </div>
          <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        </form> */}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <InvoicesList invoices={invoices} onDelete={handleDelete} />
        )}
      </main>
    </ProtectedRoute>
  );
}
