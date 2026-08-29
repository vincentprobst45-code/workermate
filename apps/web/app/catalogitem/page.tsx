'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../protected-route';
import { useApiClient } from '../api-client';
import AddCatalogItemForm from '../components/AddCatalogItemForm';
import CatalogItemList, { type CatalogItem } from '../components/CatalogItemList';

export default function CatalogItemPage() {
  const api = useApiClient();
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddCatalogItemForm, setShowAddCatalogItemForm] = useState(false);
  const [catalogItemFormWasOpened, setCatalogItemFormWasOpened] = useState(false);

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;

    try {
      const response = await api.delete(`/catalogitems/${id}`);
      if (!response.ok) throw new Error('Erreur');

      setCatalogItems((currentItems) => currentItems.filter((item) => item.id !== id));
      setError('');
      setSuccess('Article catalogue supprime avec succes');
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCatalogItems() {
      try {
        const response = await api.get('/catalogitems');
        if (!response.ok) throw new Error('Erreur');

        const data: CatalogItem[] = await response.json();
        if (!cancelled) {
          setCatalogItems(data);
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la recuperation des articles catalogue');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalogItems();

    return () => {
      cancelled = true;
    };
  }, [api]);

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Catalogue</p>
            <h2 className="mt-1 text-2xl font-bold text-stone-900">Articles &amp; prestations</h2>
            <p className="mt-1 text-sm text-stone-500">
              {catalogItems.length} article{catalogItems.length > 1 ? 's' : ''} au catalogue
              {catalogItems.length > 0 && ` · ${catalogItems.filter((item) => item.isActive).length} actif(s)`}
            </p>
          </div>
          <button
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
            onClick={() => {
              setShowAddCatalogItemForm(!showAddCatalogItemForm);
              setCatalogItemFormWasOpened(true);
            }}
          >
            {showAddCatalogItemForm ? 'Fermer le formulaire' : 'Nouvel article'}
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {catalogItemFormWasOpened && !showAddCatalogItemForm && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-3 text-sm text-emerald-800">
            <span>Un brouillon d&apos;article est en attente — vos informations sont conservées.</span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800"
                onClick={() => setShowAddCatalogItemForm(true)}
              >
                Reprendre
              </button>
              <button
                type="button"
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-50"
                onClick={() => {
                  setShowAddCatalogItemForm(false);
                  setCatalogItemFormWasOpened(false);
                }}
              >
                Recommencer
              </button>
            </div>
          </div>
        )}

        {catalogItemFormWasOpened && (
          <AddCatalogItemForm
            show={showAddCatalogItemForm}
            onCreated={(data) => {
              setCatalogItems((currentItems) => [data, ...currentItems]);
              setError('');
              setSuccess('Article catalogue ajoute avec succes');
            }}
          />
        )}

        {loading ? (
          <p className="text-sm text-stone-500">Chargement du catalogue...</p>
        ) : (
          <CatalogItemList catalogItems={catalogItems} onDelete={handleDelete} />
        )}
      </main>
    </ProtectedRoute>
  );
}
