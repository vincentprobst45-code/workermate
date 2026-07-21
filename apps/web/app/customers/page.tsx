'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { ProtectedRoute } from '../protected-route';
import AddressForm from '../components/AddressForm';
import SelectExistingAddress from '../components/SelectExistingAddress';

interface Customer {
  id: string;
  firstname: string;
  lastname?: string;
  company?: string;
  createdAt: string;
}

type AddressMode = 'new' | 'existing' | 'none';

export default function CustomersPage() {
  const api = useApiClient();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCustomer, setNewCustomer] = useState({ firstName: '', lastName: '', company: '', 
    email: '', phone: '', mobile: '',
    siret: '', vatNumber: '', notes: ''});
  const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
    , postalCode: '', city: '', region: '', countryCode: ''
    , latitude: '', longitude: ''
    , accessCode: '', floor: '', apartment: '', note: ''
   });
  const [addressMode, setAddressMode] = useState<AddressMode>('new');
  const [selectedAddressId, setSelectedAddressId] = useState('');

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    try {

      if (addressMode === 'existing' && !selectedAddressId) {
        setError('Veuillez sélectionner une adresse existante');
        return;
      }

      const customerToAdd = addressMode === 'new' ? { ...newCustomer, address: newAddress }
                          : addressMode === 'existing' ? { ...newCustomer, addressId: selectedAddressId }
                          : {...newCustomer }
      const res = await api.post('/customers', customerToAdd);
      console.log(res.status)
      console.log(res.statusText)
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setCustomers([data, ...customers]);
      setNewCustomer({ firstName: '', lastName: '', company: '', 
        email: '', phone: '', mobile: '',
        siret: '', vatNumber: '', notes: ''});
      setNewAddress({ street1: '', street2: ''
       , postalCode: '', city: '', region: '', countryCode: ''
       , latitude: '', longitude: ''
       , accessCode: '', floor: '', apartment: '', note: ''
      });
      setAddressMode('new');
      setSelectedAddressId('');
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch (error) {
      setError(`Erreur lors de l\'ajout ${error}`);
    }
  }

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

        <form onSubmit={handleAddCustomer} className="mb-8 p-5 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-4">Ajouter un client</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Prénom"
              value={newCustomer.firstName}
              onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Nom"
              value={newCustomer.lastName}
              onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Entreprise"
              value={newCustomer.company}
              onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="email"
              value={newCustomer.email}
              onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="téléphone"
              value={newCustomer.phone}
              onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="téléphone 2"
              value={newCustomer.mobile}
              onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
            />
          </div>
          <h3 className="px-3 py-4">Adresse :</h3>
            <div className="flex gap-2 px-3 pb-3">
              <button
                type="button"
                className={`border py-2 px-3 rounded ${addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setAddressMode('new')}
              >
                Nouvelle adresse
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setAddressMode('existing')}
              >
                Utiliser une adresse existante
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setAddressMode('none')}
              >
                {`Ne pas ajouter d'adresse`}
              </button>
            </div>
            {addressMode === 'new' ? (
              <AddressForm address={newAddress} onChange={setNewAddress} />
            ) : addressMode === 'existing' ? (
              <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />
            ) : <span></span>}
          <h3 className="px-3 py-4">Entreprise :</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Numéro Siret"
              value={newCustomer.siret}
              onChange={(e) => setNewCustomer({ ...newCustomer, siret: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Numéro TVA"
              value={newCustomer.vatNumber}
              onChange={(e) => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Notes additionnelles"
              value={newCustomer.notes}
              onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
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
