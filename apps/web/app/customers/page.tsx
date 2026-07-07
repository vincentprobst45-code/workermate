'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { useAuth } from '../auth.context';
import { ProtectedRoute } from '../protected-route';

interface Customer {
  id: string;
  firstname: string;
  lastname?: string;
  company?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const api = useApiClient();
  const { isLoading } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCustomer, setNewCustomer] = useState({ firstname: '', lastname: '', company: '' });

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post('/customers', newCustomer);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setCustomers([data, ...customers]);
      setNewCustomer({ firstname: '', lastname: '', company: '' });
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/customers/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setCustomers(customers.filter((c) => c.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }
  useEffect(() => {
    if (isLoading) {
      return;
    }

    let cancelled = false;

    const loadCustomers = async () => {
      try {
        const res = await api.get('/customers');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (!cancelled) {
          setCustomers(data);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des clients');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [isLoading, api]);


  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6">Gestion des Clients</h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <form onSubmit={handleAddCustomer} className="mb-8 p-5 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-4">Ajouter un client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Prénom"
              value={newCustomer.firstname}
              onChange={(e) => setNewCustomer({ ...newCustomer, firstname: e.target.value })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Nom"
              value={newCustomer.lastname}
              onChange={(e) => setNewCustomer({ ...newCustomer, lastname: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Entreprise"
              value={newCustomer.company}
              onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
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
            {customers.map((customer) => (
              <div key={customer.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">
                    {customer.firstname} {customer.lastname}
                  </p>
                  {customer.company && <p className="text-sm text-slate-600">{customer.company}</p>}
                </div>
                <button
                  onClick={() => handleDelete(customer.id)}
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
