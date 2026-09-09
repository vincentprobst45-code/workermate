'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { ProtectedRoute } from '../protected-route';
import AddCustomerForm from '../components/AddCustomerForm';
import CustomersList, { type Customer } from '../components/CustomersList';

export default function CustomersPage() {
  const api = useApiClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false);
  const [customerFormWasOpened, setCustomerFormWasOpened] = useState(false);
  const [customerBeingEdited, setCustomerBeingEdited] = useState<Customer | null>(null);

  async function handleDelete(id: string) {
    try {
      const res = await api.delete(`/customers/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setCustomers((currentCustomers) => currentCustomers.filter((customer) => customer.id !== id));
      setError('');
      setSuccess('Client supprimé avec succès');
    } catch {
      setError('La suppression du client a échoué. Vérifiez votre connexion et réessayez.');
      throw new Error('Customer deletion failed');
    }
  }
  useEffect(() => {
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
  }, [api]);

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Clients</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">Gestion des clients</h2>
            <p className="mt-1 text-sm text-slate-500">{customers.length} client{customers.length !== 1 ? 's' : ''} au total</p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            onClick={() => { setCustomerBeingEdited(null); setShowAddCustomerForm(!showAddCustomerForm); setCustomerFormWasOpened(true); }}
          >
            {showAddCustomerForm ? 'Fermer le formulaire' : customerFormWasOpened ? 'Reprendre le formulaire' : 'Nouveau client'}
          </button>
        </div>

        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
        {success && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

        {customerFormWasOpened &&
        <button
          type="button"
          className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          onClick={() => {setCustomerBeingEdited(null); setShowAddCustomerForm(false);setCustomerFormWasOpened(false);}}>
            Réinitialiser le formulaire
        </button>
        }
        {customerFormWasOpened && (<div>
          {!showAddCustomerForm &&
          <button type="button" onClick={() => {setShowAddCustomerForm(true)}}
          className="mb-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
            Formulaire en pause. Reprendre
          </button>}
          <AddCustomerForm
            key={customerBeingEdited?.id ?? 'new-customer'}
            show={showAddCustomerForm}
            initialCustomer={customerBeingEdited}
            onCreated={(data) => setCustomers((currentCustomers) => [data, ...currentCustomers])}
            onUpdated={(data) => {
              setCustomers((currentCustomers) => currentCustomers.map((customer) => customer.id === data.id ? data : customer));
              setCustomerBeingEdited(null);
              setSuccess('Client modifié avec succès');
            }}
          />
          </div>
        )}
        {loading ? (
          <div className="space-y-3" aria-label="Chargement des clients" role="status">
            <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
            <div className="grid gap-3 sm:grid-cols-2"><div className="h-44 animate-pulse rounded-xl bg-slate-100" /><div className="h-44 animate-pulse rounded-xl bg-slate-100" /></div>
            <p className="text-sm text-slate-500">Chargement des clients...</p>
          </div>
        ) : (
          <CustomersList customers={customers} onDelete={handleDelete} onEdit={(customer) => {
            setCustomerBeingEdited(customer);
            setShowAddCustomerForm(true);
            setCustomerFormWasOpened(true);
          }} />
        )}
      </main>
    </ProtectedRoute>
  );
}
