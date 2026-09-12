'use client';

import { useState } from 'react';
import AddSupplierForm from '../components/AddSupplierForm';
import AddSupplierInvoiceForm from '../components/AddSupplierInvoiceForm';
import SupplierDetails from '../components/SupplierDetails';
import SuppliersList from '../components/SuppliersList';
import SupplierInvoicesList from '../components/SupplierInvoicesList';
import type { Supplier } from '../components/AddSupplierForm';

export default function SuppliersPage() { const [refreshKey, setRefreshKey] = useState(0); const [selected, setSelected] = useState<Supplier | null>(null); const [invoiceSupplier, setInvoiceSupplier] = useState<Supplier | null>(null); return <main className="min-h-full bg-stone-50 p-6 md:p-10"><div className="mx-auto max-w-6xl"><div className="mb-8"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Achats</p><h1 className="mt-2 text-3xl font-bold text-stone-900">Fournisseurs</h1><p className="mt-2 text-stone-600">Centralisez vos partenaires, factures et achats.</p></div><div className="space-y-5"><AddSupplierForm onCreated={() => setRefreshKey((value) => value + 1)} /><SuppliersList refreshKey={refreshKey} onSelect={(supplier) => { setSelected(supplier); setInvoiceSupplier(supplier); }} />{invoiceSupplier && <AddSupplierInvoiceForm supplier={invoiceSupplier} onCreated={() => setRefreshKey((value) => value + 1)} />}<SupplierInvoicesList refreshKey={refreshKey} /></div></div><SupplierDetails supplier={selected} onClose={() => setSelected(null)} /></main>; }
