'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth.context';
import { useApiClient } from '../api-client';
import type { Supplier } from './AddSupplierForm';

type SuppliersListProps = {
  refreshKey: number;
  onSelect: (supplier: Supplier) => void;
  onAddInvoice: (supplier: Supplier) => void;
  onAddSupplier: () => void;
  initialSupplierId?: string;
};

export default function SuppliersList({ refreshKey, onSelect, onAddInvoice, onAddSupplier, initialSupplierId }: SuppliersListProps) {
  const { activeTenant } = useAuth();
  const api = useApiClient();
  const [query, setQuery] = useState('');
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const appliedInitialSupplierId = useRef<string | null>(null);
  const queryClient = useQueryClient();
  const suppliersQueryKey = ['suppliers', activeTenant?.tenantId, refreshKey];
  const suppliersQuery = useQuery({
    queryKey: suppliersQueryKey,
    enabled: Boolean(activeTenant?.tenantId),
    queryFn: async () => {
      const response = await api.get('/suppliers');
      if (!response.ok) throw new Error('Impossible de charger les fournisseurs.');
      return await response.json() as Supplier[];
    },
  });
  const suppliers = useMemo(() => suppliersQuery.data ?? [], [suppliersQuery.data]);
  const loading = suppliersQuery.isPending;
  const error = suppliersQuery.error?.message ?? '';
  const archiveMutation = useMutation({
    mutationFn: async (supplier: Supplier) => {
      const response = await api.delete(`/suppliers/${supplier.id}`);
      if (!response.ok) throw new Error('Impossible d’archiver le fournisseur.');
      return supplier.id;
    },
    onSuccess: (supplierId) => {
      queryClient.setQueryData<Supplier[]>(suppliersQueryKey, (currentSuppliers) => currentSuppliers?.filter((item) => item.id !== supplierId));
      setOpenActionId(null);
    },
  });

  useEffect(() => {
    if (!initialSupplierId) {
      appliedInitialSupplierId.current = null;
      return;
    }
    if (appliedInitialSupplierId.current === initialSupplierId) return;
    const supplier = suppliers.find((item) => item.id === initialSupplierId);
    if (supplier) {
      appliedInitialSupplierId.current = initialSupplierId;
      onSelect(supplier);
    }
  }, [initialSupplierId, onSelect, suppliers]);

  async function archive(supplier: Supplier) {
    if (!window.confirm(`Archiver le fournisseur « ${supplier.name} » ?`)) return;
    await archiveMutation.mutateAsync(supplier);
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? suppliers.filter((supplier) => [supplier.name, supplier.reference, supplier.email, supplier.phone, supplier.city].some((value) => value?.toLowerCase().includes(normalized))) : suppliers;
  }, [query, suppliers]);

  return <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
      <div><h2 className="font-semibold text-stone-900">Fournisseurs</h2><p className="text-sm text-stone-500">{filtered.length} résultat{filtered.length === 1 ? '' : 's'}{loading && suppliers.length ? ' · Actualisation…' : ''}</p></div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un fournisseur..." aria-label="Rechercher un fournisseur" className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-72" />
    </div>
    {loading && !suppliers.length && <p className="p-6 text-sm text-stone-500">Chargement des fournisseurs...</p>}
    {!loading && !error && !filtered.length && <div className="p-8 text-center"><p className="font-semibold text-stone-800">{query ? 'Aucun fournisseur ne correspond à la recherche.' : 'Votre carnet fournisseurs est vide.'}</p><p className="mt-1 text-sm text-stone-500">{query ? 'Essayez un autre nom, une ville ou une référence.' : 'Ajoutez votre premier partenaire pour pouvoir saisir ses factures.'}</p>{!query && <button type="button" onClick={onAddSupplier} className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Ajouter un fournisseur</button>}</div>}
    {error && <div className="flex items-center justify-between gap-4 p-6"><p className="text-sm text-red-600">{error}</p><button type="button" onClick={() => { void suppliersQuery.refetch(); }} className="text-sm font-semibold text-blue-700 hover:underline">Réessayer</button></div>}
    {!loading && !error && filtered.length > 0 && <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Fournisseur</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Activité</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-stone-100">{filtered.map((supplier) => <tr key={supplier.id} className="hover:bg-stone-50"><td className="px-4 py-3"><button type="button" onClick={() => onSelect(supplier)} className="font-semibold text-blue-700 hover:underline">{supplier.name}</button><div className="text-xs text-stone-500">{supplier.reference || 'Sans référence'}</div></td><td className="px-4 py-3 text-stone-600">{supplier.email || supplier.phone || supplier.city || 'Aucun contact'}</td><td className="px-4 py-3 text-stone-600">{supplier._count?.purchases ?? 0} achat(s), {supplier._count?.invoices ?? 0} facture(s)</td><td className="px-4 py-3 text-right"><div className="relative inline-flex items-center gap-2"><button type="button" onClick={() => onAddInvoice(supplier)} className="rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100">Ajouter une facture</button><button type="button" aria-label={`Actions pour ${supplier.name}`} aria-expanded={openActionId === supplier.id} onClick={() => setOpenActionId(openActionId === supplier.id ? null : supplier.id)} className="rounded-md border border-stone-300 px-2 py-1 text-sm text-stone-600 hover:bg-stone-100">...</button>{openActionId === supplier.id && <div className="absolute right-0 top-9 z-10 w-32 rounded-md border border-stone-200 bg-white p-1 text-left shadow-lg"><button type="button" onClick={() => archive(supplier)} className="w-full rounded px-2 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50">Archiver</button></div>}</div></td></tr>)}</tbody></table></div>}
  </section>;
}
