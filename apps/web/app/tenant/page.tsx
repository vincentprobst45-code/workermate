'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../protected-route';
import { useApiClient } from '../api-client';
import AddTenantForm from '../components/AddTenantForm';
import EmployeesList from '../components/EmployeesList';
import TenantDetails, { type TenantProfile } from '../components/TenantDetails';
import UpdateTenantForm from '../components/UpdateTenantForm';

export default function TenantPage() {
  const api = useApiClient();
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTenantForm, setShowCreateTenantForm] = useState(false);
  const [showUpdateTenantForm, setShowUpdateTenantForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      try {
        const response = await api.get('/tenants/current');
        if (!response.ok) throw new Error('Erreur');
        const data = await response.json() as TenantProfile;
        if (!cancelled) setTenant(data);
      } catch {
        if (!cancelled) setError('Impossible de charger les informations de l’entreprise.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTenant();
    return () => { cancelled = true; };
  }, [api]);

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <header className="mb-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-7 text-white shadow-xl shadow-slate-800/20">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Paramètres</p>
          <h1 className="mt-2 text-2xl font-semibold">Entreprise</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">Consultez les informations de votre entreprise utilisées pour les documents de facturation.</p>
        </header>

        <div className="mb-6 flex justify-end">
          <button type="button" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700" onClick={() => setShowCreateTenantForm((current) => !current)}>
            {showCreateTenantForm ? 'Fermer' : 'Créer une entreprise'}
          </button>
        </div>

        {showCreateTenantForm && <div className="mb-6"><AddTenantForm onCancel={() => setShowCreateTenantForm(false)} onCreated={() => window.location.reload()} /></div>}

        {loading && <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Chargement...</p>}
        {!loading && error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {!loading && !error && tenant && <TenantDetails tenant={tenant} onEdit={() => setShowUpdateTenantForm(true)} />}

        {showUpdateTenantForm && tenant && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 sm:p-6" role="presentation" onClick={() => setShowUpdateTenantForm(false)}><div className="my-4 max-h-[calc(100vh-2rem)] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="update-tenant-title" onClick={(event) => event.stopPropagation()}><UpdateTenantForm tenant={tenant} onCancel={() => setShowUpdateTenantForm(false)} onSaved={(updatedTenant) => { setTenant(updatedTenant); setShowUpdateTenantForm(false); }} /></div></div>}

        <div className="mt-6"><EmployeesList /></div>
      </main>
    </ProtectedRoute>
  );
}
