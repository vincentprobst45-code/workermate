'use client';
import { useEffect, useState } from 'react';
import { InvoiceKind } from '@prisma/client';
import { useApiClient } from '../api-client';
import AddInvoiceForm from '../components/AddInvoiceForm';
import AddPaymentForm, { type Payment } from '../components/AddPaymentForm';
import InvoicesList, { type Invoice } from '../components/InvoicesList';
import AddReccuringInvoiceForm from '../components/AddReccuringInvoiceForm';
import RecuringInvoicesList from '../components/RecuringInvoicesList';
import { ProtectedRoute } from '../protected-route';

const invoiceKindOptions: Array<{ value: InvoiceKind; label: string }> = [
  { value: InvoiceKind.STANDARD, label: 'Facture standard' },
  { value: InvoiceKind.DEPOSIT, label: 'Facture d’acompte' },
  { value: InvoiceKind.PROGRESS, label: 'Facture de situation' },
  { value: InvoiceKind.BALANCE, label: 'Facture de solde' },
  { value: InvoiceKind.CORRECTIVE, label: 'Facture rectificative' },
  { value: InvoiceKind.CREDIT_NOTE, label: 'Avoir' },
];

export default function InvoicesPage() {
  const api = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isChoosingInvoiceKind, setIsChoosingInvoiceKind] = useState(false);
  const [selectedInvoiceKind, setSelectedInvoiceKind] = useState<InvoiceKind | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isCreatingRecurringInvoice, setIsCreatingRecurringInvoice] = useState(false);
  const [recurringInvoicesRefreshKey, setRecurringInvoicesRefreshKey] = useState(0);

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

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/invoices/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setInvoices((currentInvoices) => currentInvoices.filter((invoice) => invoice.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Factures</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Gestion des factures</h2>
            <p className="mt-1 text-sm text-slate-500">
              {invoices.length} facture{invoices.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsAddingPayment(true)}
              className="rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              Ajouter un paiement
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingRecurringInvoice((current) => !current)}
              className="rounded-lg border border-indigo-600 bg-white px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              {isCreatingRecurringInvoice ? 'Masquer le formulaire' : 'Créer une facture récurrente'}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  if (isCreatingInvoice) {
                    setIsCreatingInvoice(false);
                  } else {
                    setIsChoosingInvoiceKind((current) => !current);
                    setSelectedInvoiceKind(null);
                  }
                }}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
              >
                {isCreatingInvoice ? 'Masquer le formulaire' : 'Créer une nouvelle facture'}
              </button>
              {isChoosingInvoiceKind && !isCreatingInvoice && (
                <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                  {invoiceKindOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                      onClick={() => {
                        setSelectedInvoiceKind(option.value);
                        setIsChoosingInvoiceKind(false);
                        setIsCreatingInvoice(true);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isAddingPayment && (
          <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Ajouter un paiement</h3>
              <button type="button" onClick={() => setIsAddingPayment(false)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Fermer
              </button>
            </div>
            <AddPaymentForm
              invoices={invoices}
              onCreated={(payment: Payment) => {
                setInvoices((currentInvoices) => currentInvoices.map((invoice) => invoice.id === payment.invoiceId
                  ? { ...invoice, payments: [payment, ...(invoice.payments ?? [])] }
                  : invoice));
                setIsAddingPayment(false);
              }}
              onCancel={() => setIsAddingPayment(false)}
            />
          </div>
        )}

        {isCreatingRecurringInvoice && (
          <div className="mb-8">
            <AddReccuringInvoiceForm
              onCreated={() => {
                setIsCreatingRecurringInvoice(false);
                setRecurringInvoicesRefreshKey((current) => current + 1);
              }}
              onCancel={() => setIsCreatingRecurringInvoice(false)}
            />
          </div>
        )}

        {isCreatingInvoice && selectedInvoiceKind && (
          <div className="mb-8">
              <AddInvoiceForm
                show={true}
                invoiceKind={selectedInvoiceKind!}
                onCreated={(invoice) => {
                  setInvoices((current) => [invoice, ...current]);
                }}
              />
          </div>
        )}

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}

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
          <div className="space-y-3" aria-label="Chargement des factures" role="status">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="hidden h-16 animate-pulse rounded-lg bg-slate-100 sm:block" />
            <div className="h-28 animate-pulse rounded-lg bg-slate-100 sm:hidden" />
            <p className="text-sm text-slate-500">Chargement des factures...</p>
          </div>
        ) : (
          <InvoicesList
            invoices={invoices}
            onDelete={handleDelete}
            onUpdated={(updatedInvoice) => {
              setInvoices((currentInvoices) => currentInvoices.map((invoice) => invoice.id === updatedInvoice.id ? updatedInvoice : invoice));
            }}
          />
        )}

        <RecuringInvoicesList refreshKey={recurringInvoicesRefreshKey} />
      </main>
    </ProtectedRoute>
  );
}
