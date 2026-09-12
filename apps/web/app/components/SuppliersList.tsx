'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import type { Supplier } from './AddSupplierForm';

export default function SuppliersList({ refreshKey, onSelect }: { refreshKey: number; onSelect: (supplier: Supplier) => void }) {
  const api = useApiClient(); const [suppliers, setSuppliers] = useState<Supplier[]>([]); const [error, setError] = useState('');
  useEffect(() => { let active = true; api.get('/suppliers').then(async (response) => { if (!response.ok) throw new Error(); const data = await response.json(); if (active) setSuppliers(data); }).catch(() => { if (active) setError('Impossible de charger les fournisseurs.'); }); return () => { active = false; }; }, [api, refreshKey]);
  async function archive(id: string) { if (!window.confirm('Archiver ce fournisseur ?')) return; const response = await api.delete(`/suppliers/${id}`); if (response.ok) setSuppliers((items) => items.filter((item) => item.id !== id)); }
  return <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-100 text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Fournisseur</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Activité</th><th className="px-4 py-3" /></tr></thead><tbody className="divide-y divide-stone-100">{suppliers.map((supplier) => <tr key={supplier.id} className="hover:bg-stone-50"><td className="px-4 py-3"><button onClick={() => onSelect(supplier)} className="font-semibold text-blue-700 hover:underline">{supplier.name}</button><div className="text-xs text-stone-500">{supplier.reference || 'Sans référence'}</div></td><td className="px-4 py-3 text-stone-600">{supplier.email || supplier.phone || supplier.city || 'Aucun contact'}</td><td className="px-4 py-3 text-stone-600">{supplier._count?.purchases ?? 0} achat(s), {supplier._count?.invoices ?? 0} facture(s)</td><td className="px-4 py-3 text-right"><button onClick={() => archive(supplier.id)} className="text-xs font-semibold text-red-600 hover:underline">Archiver</button></td></tr>)}</tbody></table></div>{!suppliers.length && !error && <p className="p-6 text-sm text-stone-500">Aucun fournisseur actif.</p>}{error && <p className="p-6 text-sm text-red-600">{error}</p>}</div>;
}
