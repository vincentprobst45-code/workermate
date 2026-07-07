'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { useAuth } from '../auth.context';
import { ProtectedRoute } from '../protected-route';

interface Invoice {
  id: string;
  number: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export default function InvoicesPage() {
  const api = useApiClient();
  const { isLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newInvoice, setNewInvoice] = useState({ number: '', amount: 0, description: '' });

  useEffect(() => {
    if (isLoading) return;

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
  }, [isLoading, api]);

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

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleAddInvoice} className="mb-8 p-5 bg-white rounded-lg shadow">
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
        </form>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="grid gap-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{invoice.number}</p>
                  <p className="text-sm text-slate-600">{invoice.amount.toFixed(2)} €</p>
                  {invoice.description && <p className="text-xs text-slate-500">{invoice.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(invoice.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
