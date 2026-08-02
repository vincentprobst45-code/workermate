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
  const [showAddCustomerForm, setShowAddCustomerForm] = useState(false)
  const [customerFormWasOpened, setCustomerFormWasOpened] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/customers/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setCustomers(customers.filter((c) => c.id !== id));
      setError('');
      setSuccess('Client supprimé avec succès');
    } catch {
      setError('Erreur lors de la suppression');
    }
  }
  useEffect(() => {
    console.log("effect")
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
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6">Gestion des Clients</h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}

        <button
          className='border-double border-gray-700 border-2 shadow-md text-xl text-white 
                    rounded-sm mx-4 my-2 py-2 px-3 bg-blue-400 
                    hover:bg-blue-600 active:bg-blue-900' 
          onClick={() => {setShowAddCustomerForm(!showAddCustomerForm);setCustomerFormWasOpened(true)}}>
            {showAddCustomerForm ? ("Fermer") : customerFormWasOpened ? ("Ouvrir") : ("Ajouter un client")}
        </button>
        {customerFormWasOpened &&
        <button
          className='border-double border-gray-700 border-2 shadow-md text-xl text-white 
                    rounded-sm mx-4 my-2 py-2 px-3 float-right bg-red-400
                    hover:bg-red-600 active:bg-red-900' 
          onClick={() => {setShowAddCustomerForm(false);setCustomerFormWasOpened(false);}}>
            Effacer le formulaire
        </button>
        }
        {customerFormWasOpened && (<div>
          {!showAddCustomerForm && 
          <button onClick={() => {setShowAddCustomerForm(!showAddCustomerForm)}} 
          className='pointer p-2 border-2 text-center '>
            Formulaire en pause...
          </button>}
          <AddCustomerForm
            show={showAddCustomerForm}
            onCreated={(data) => setCustomers((currentCustomers) => [data, ...currentCustomers])}
          />
          </div>
        )}
        {loading ? (
          <p>Chargement...</p>
        ) : (
          <CustomersList customers={customers} onDelete={handleDelete} />
        )}
      </main>
    </ProtectedRoute>
  );
}
