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
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold">Catalogue des articles</h2>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
        {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

        <button
          className="mx-4 my-2 rounded-sm border-2 border-double border-gray-700 bg-blue-400 px-3 py-2 text-xl text-white shadow-md hover:bg-blue-600 active:bg-blue-900"
          onClick={() => {
            setShowAddCatalogItemForm(!showAddCatalogItemForm);
            setCatalogItemFormWasOpened(true);
          }}
        >
          {showAddCatalogItemForm
            ? 'Fermer'
            : catalogItemFormWasOpened
              ? 'Ouvrir'
              : 'Ajouter un article'}
        </button>

        {catalogItemFormWasOpened && (
          <button
            className="float-right mx-4 my-2 rounded-sm border-2 border-double border-gray-700 bg-red-400 px-3 py-2 text-xl text-white shadow-md hover:bg-red-600 active:bg-red-900"
            onClick={() => {
              setShowAddCatalogItemForm(false);
              setCatalogItemFormWasOpened(false);
            }}
          >
            Effacer le formulaire
          </button>
        )}

        {catalogItemFormWasOpened && (
          <div>
            {!showAddCatalogItemForm && (
              <button
                onClick={() => {
                  setShowAddCatalogItemForm(true);
                }}
                className="pointer border-2 p-2 text-center"
              >
                Formulaire en pause...
              </button>
            )}
            <AddCatalogItemForm
              show={showAddCatalogItemForm}
              onCreated={(data) => {
                setCatalogItems((currentItems) => [data, ...currentItems]);
                setError('');
                setSuccess('Article catalogue ajoute avec succes');
              }}
            />
          </div>
        )}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <CatalogItemList catalogItems={catalogItems} onDelete={handleDelete} />
        )}
      </main>
    </ProtectedRoute>
  );
}
