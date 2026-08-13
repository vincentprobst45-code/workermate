'use client';
import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import AddInvoiceForm from '../components/AddInvoiceForm';
import InvoicesList, { type Invoice } from '../components/InvoicesList';
import NewInvoice, { type Invoice as DraftInvoice } from '../components/NewInvoice';
import { ProtectedRoute } from '../protected-route';

export default function InvoicesPage() {
  const api = useApiClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [draftInvoice, setDraftInvoice] = useState<DraftInvoice | null>(null);

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
      setInvoices(invoices.filter((i) => i.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Gestion des Factures</h2>
          <button
            type="button"
            onClick={() => setIsCreatingInvoice((current) => !current)}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            {isCreatingInvoice ? 'Masquer le formulaire' : 'Créer une nouvelle facture'}
          </button>
        </div>

        {isCreatingInvoice && (
          <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:items-start">
            <AddInvoiceForm
              show={true}
              onChange={setDraftInvoice}
              onCreated={(invoice) => {
                setInvoices((current) => [invoice, ...current]);
              }}
            />
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50 p-4 shadow-sm">
              {draftInvoice && <NewInvoice invoice={draftInvoice} />}
            </div>
          </div>
        )}

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
