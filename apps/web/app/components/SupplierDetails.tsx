'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import type { Supplier } from './AddSupplierForm';

export default function SupplierDetails({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const api = useApiClient(); const [details, setDetails] = useState<Supplier & { invoices?: Array<{ id: string; supplierInvoiceNumber: string; taxInclusiveAmount: number }> } | null>(null);
  useEffect(() => { if (!supplier) return; api.get(`/suppliers/${supplier.id}`).then(async (response) => { if (response.ok) setDetails(await response.json()); }); }, [api, supplier]);
  if (!supplier) return null;
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4" onClick={onClose}><section className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-6" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Fournisseur</p><h2 className="mt-1 text-2xl font-bold text-stone-900">{details?.name || supplier.name}</h2><p className="text-sm text-stone-500">{details?.email || supplier.email || 'Aucun email'} · {details?.phone || supplier.phone || 'Aucun téléphone'}</p></div><button onClick={onClose} aria-label="Fermer" className="text-2xl text-stone-400">×</button></div><div className="mt-6 border-t border-stone-200 pt-4"><h3 className="font-semibold text-stone-800">Factures récentes</h3>{details?.invoices?.length ? <ul className="mt-2 divide-y divide-stone-100">{details.invoices.map((invoice) => <li key={invoice.id} className="flex justify-between py-2 text-sm"><span>{invoice.supplierInvoiceNumber}</span><span>{Number(invoice.taxInclusiveAmount).toFixed(2)} €</span></li>)}</ul> : <p className="mt-2 text-sm text-stone-500">Aucune facture enregistrée.</p>}</div></section></div>;
}
