'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ProtectedRoute } from '../protected-route';
import { useApiClient } from '../api-client';
import { useAuth } from '../auth.context';
import AddCatalogItemForm from '../components/AddCatalogItemForm';
import CatalogItemList, { type CatalogItem } from '../components/CatalogItemList';

export default function CatalogItemPage() {
  const searchParams = useSearchParams();
  const { activeTenant } = useAuth();
  const api = useApiClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddCatalogItemForm, setShowAddCatalogItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CatalogItem | null>(null);
  const queryClient = useQueryClient();
  const catalogItemsQueryKey = ['catalog-items', activeTenant?.tenantId];
  const catalogItemsQuery = useQuery({
    queryKey: catalogItemsQueryKey,
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const response = await api.get('/catalogitems');
      if (!response.ok) throw new Error('Erreur lors de la récupération des articles catalogue');
      return await response.json() as CatalogItem[];
    },
  });
  const catalogItems = catalogItemsQuery.data ?? [];
  const loading = catalogItemsQuery.isPending;
  const deleteCatalogItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/catalogitems/${id}`);
      if (!response.ok) throw new Error('Erreur lors de la suppression');
      return id;
    },
    onSuccess: (id) => {
      queryClient.setQueryData<CatalogItem[]>(catalogItemsQueryKey, (currentItems) => currentItems?.filter((item) => item.id !== id));
      setError('');
      setSuccess('Article catalogue supprimé avec succès');
      setPendingDelete(null);
    },
    onError: () => setError('Erreur lors de la suppression'),
  });
  const toggleCatalogItemMutation = useMutation({
    mutationFn: async (item: CatalogItem) => {
      const response = await api.put(`/catalogitems/${item.id}`, { isActive: !item.isActive });
      if (!response.ok) throw new Error('Erreur lors de la mise à jour du statut');
      return await response.json() as CatalogItem;
    },
    onSuccess: (updatedItem) => {
      queryClient.setQueryData<CatalogItem[]>(catalogItemsQueryKey, (currentItems) => currentItems?.map((item) => item.id === updatedItem.id ? updatedItem : item));
      setSuccess(updatedItem.isActive ? 'Article réactivé avec succès' : 'Article désactivé avec succès');
      setError('');
    },
    onError: () => setError('Erreur lors de la mise à jour du statut'),
  });
  const initialItemId = searchParams.get('item');

  function updateCreateUrl(open: boolean, replace = false) {
    const url = new URL(window.location.href);
    if (open) url.searchParams.set('create', 'item');
    else url.searchParams.delete('create');
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }

  useEffect(() => {
    function syncCreateForm() {
      if (new URLSearchParams(window.location.search).get('create') === 'item') setShowAddCatalogItemForm(true);
    }
    syncCreateForm();
    window.addEventListener('popstate', syncCreateForm);
    return () => window.removeEventListener('popstate', syncCreateForm);
  }, []);

  function clearItemUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('item');
    url.searchParams.delete('edit');
    window.history.replaceState({}, '', url.toString());
  }

  async function handleDelete(id: string) {
    await deleteCatalogItemMutation.mutateAsync(id);
  }

  async function handleToggleActive(item: CatalogItem) {
    await toggleCatalogItemMutation.mutateAsync(item);
  }

  useEffect(() => {
    if (!success) return undefined;
    const timeout = window.setTimeout(() => setSuccess(''), 4500);
    return () => window.clearTimeout(timeout);
  }, [success]);

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
              setEditingItem(null);
              setShowAddCatalogItemForm((current) => {
                updateCreateUrl(!current);
                return !current;
              });
            }}
          >
            {showAddCatalogItemForm && !editingItem ? 'Fermer le formulaire' : 'Nouvel article'}
          </button>
        </div>

        {(error || catalogItemsQuery.isError) && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span>{error || 'Erreur lors de la récupération des articles catalogue'}</span>
            <button type="button" onClick={() => { setError(''); void catalogItemsQuery.refetch(); }} className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100">
              Réessayer
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {success}
          </div>
        )}

        {showAddCatalogItemForm && (
          <AddCatalogItemForm
            key={editingItem?.id ?? 'new'}
            show={showAddCatalogItemForm}
            initialCatalogItem={editingItem}
            onCancel={() => {
              setShowAddCatalogItemForm(false);
              setEditingItem(null);
              clearItemUrl();
              updateCreateUrl(false, true);
            }}
            onCreated={(data) => {
              queryClient.setQueryData<CatalogItem[]>(catalogItemsQueryKey, (currentItems) => [data, ...(currentItems ?? [])]);
              setError('');
              setSuccess('Article catalogue ajouté avec succès');
              setShowAddCatalogItemForm(false);
              clearItemUrl();
            }}
            onUpdated={(data) => {
              queryClient.setQueryData<CatalogItem[]>(catalogItemsQueryKey, (currentItems) => currentItems?.map((item) => item.id === data.id ? data : item));
              setError('');
              setSuccess('Article catalogue mis à jour avec succès');
              setShowAddCatalogItemForm(false);
              setEditingItem(null);
              clearItemUrl();
            }}
          />
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Chargement du catalogue">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="animate-pulse rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                <div className="h-4 w-2/3 rounded bg-stone-200" />
                <div className="mt-3 h-3 w-1/3 rounded bg-stone-100" />
                <div className="mt-7 h-7 w-1/2 rounded bg-stone-200" />
                <div className="mt-4 h-3 w-3/4 rounded bg-stone-100" />
              </div>
            ))}
          </div>
        ) : (
          <CatalogItemList
            catalogItems={catalogItems}
            onDelete={(id) => {
              const item = catalogItems.find((catalogItem) => catalogItem.id === id);
              if (item) setPendingDelete(item);
            }}
            onEdit={(item) => {
              setEditingItem(item);
              setShowAddCatalogItemForm(true);
            }}
            onToggleActive={handleToggleActive}
            initialItemId={initialItemId}
            initialItemMode={searchParams.get('edit') === '1' ? 'edit' : 'view'}
            syncUrl
          />
        )}

        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setPendingDelete(null)}>
            <div role="dialog" aria-modal="true" aria-labelledby="delete-catalog-item-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <h3 id="delete-catalog-item-title" className="text-lg font-bold text-stone-900">Supprimer cet article ?</h3>
              <p className="mt-2 text-sm leading-6 text-stone-600">« {pendingDelete.title} » sera supprimé définitivement. Pour préserver l’historique, préférez la désactivation lorsque l’article a déjà été utilisé.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setPendingDelete(null)} className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">Annuler</button>
                <button type="button" onClick={() => void handleDelete(pendingDelete.id)} className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
