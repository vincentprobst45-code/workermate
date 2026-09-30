'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AddSupplierForm from '../../components/AddSupplierForm';
import AddSupplierInvoiceForm from '../../components/AddSupplierInvoiceForm';
import SupplierDetails from '../../components/SupplierDetails';
import SuppliersList from '../../components/SuppliersList';
import SupplierInvoicesList from '../../components/SupplierInvoicesList';
import type { Supplier } from '../../components/AddSupplierForm';

export default function SuppliersPage() {
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [invoiceSupplier, setInvoiceSupplier] = useState<Supplier | null>(null);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const modalOpen = showSupplierForm || Boolean(invoiceSupplier);

  function updateSupplierUrl(supplierId?: string, replace = false) {
    const url = new URL(window.location.href);
    if (supplierId && url.searchParams.get('supplier') === supplierId) return;
    if (supplierId) url.searchParams.set('supplier', supplierId);
    else url.searchParams.delete('supplier');
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }

  function updateCreateUrl(open: boolean, replace = false, supplierId?: string) {
    const url = new URL(window.location.href);
    if (open) {
      url.searchParams.set('create', supplierId ? 'supplierInvoice' : 'supplier');
      if (supplierId) url.searchParams.set('supplier', supplierId);
    } else {
      url.searchParams.delete('create');
    }
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }

  useEffect(() => {
    function syncCreateForm() {
      setShowSupplierForm(new URLSearchParams(window.location.search).get('create') === 'supplier');
    }
    syncCreateForm();
    window.addEventListener('popstate', syncCreateForm);
    return () => window.removeEventListener('popstate', syncCreateForm);
  }, []);

  useEffect(() => {
    if (searchParams.get('create') !== 'supplierInvoice' || !selected || selected.id !== searchParams.get('supplier')) return;
    const timeoutId = window.setTimeout(() => setInvoiceSupplier(selected), 0);
    return () => window.clearTimeout(timeoutId);
  }, [searchParams, selected]);

  function refresh() {
    setRefreshKey((value) => value + 1);
  }

  function handleSupplierCreated(supplier: Supplier) {
    setShowSupplierForm(false);
    setSelected(supplier);
    updateCreateUrl(false, true);
    refresh();
  }

  function handleInvoiceCreated() {
    setInvoiceSupplier(null);
    updateCreateUrl(false, true);
    refresh();
  }

  function openInvoiceForm(supplier: Supplier) {
    setInvoiceSupplier(supplier);
    updateCreateUrl(true, false, supplier.id);
  }

  useEffect(() => {
    if (!modalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowSupplierForm(false);
        setInvoiceSupplier(null);
        updateCreateUrl(false, true);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  return <main className="min-h-full bg-stone-50 p-6 md:p-10">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Achats</p>
          <h1 className="mt-2 text-3xl font-bold text-stone-900">Fournisseurs</h1>
          <p className="mt-2 text-stone-600">Centralisez vos partenaires, factures et achats.</p>
        </div>
        <button type="button" onClick={() => { setShowSupplierForm(true); updateCreateUrl(true); }} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700">
          Ajouter un fournisseur
        </button>
      </div>
      <div className="space-y-5">
        <SuppliersList refreshKey={refreshKey} initialSupplierId={searchParams.get('supplier') || undefined} onSelect={(supplier) => { setSelected(supplier); updateSupplierUrl(supplier.id); }} onAddInvoice={openInvoiceForm} onAddSupplier={() => { setShowSupplierForm(true); updateCreateUrl(true); }} />
        <SupplierInvoicesList refreshKey={refreshKey} initialInvoiceId={searchParams.get('supplierInvoice') || undefined} initialInvoiceMode={searchParams.get('edit') === '1' ? 'edit' : 'view'} syncUrl />
      </div>
    </div>

    {showSupplierForm && <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => { setShowSupplierForm(false); updateCreateUrl(false, true); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title" className="max-h-[90vh] w-full max-w-3xl overflow-auto" onClick={(event) => event.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between"><h2 id="supplier-modal-title" className="sr-only">Ajouter un fournisseur</h2><span /><button type="button" autoFocus onClick={() => { setShowSupplierForm(false); updateCreateUrl(false, true); }} className="rounded-md bg-white px-3 py-1 text-sm text-stone-600 shadow-sm hover:bg-stone-100">Fermer</button></div>
        <AddSupplierForm onCreated={handleSupplierCreated} />
      </section>
    </div>}

    {invoiceSupplier && <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => { setInvoiceSupplier(null); updateCreateUrl(false, true); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="invoice-modal-title" className="max-h-[90vh] w-full max-w-5xl overflow-auto" onClick={(event) => event.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between"><h2 id="invoice-modal-title" className="sr-only">Ajouter une facture fournisseur</h2><span /><button type="button" autoFocus onClick={() => { setInvoiceSupplier(null); updateCreateUrl(false, true); }} className="rounded-md bg-white px-3 py-1 text-sm text-stone-600 shadow-sm hover:bg-stone-100">Fermer</button></div>
        <AddSupplierInvoiceForm supplier={invoiceSupplier} onCreated={handleInvoiceCreated} />
      </section>
    </div>}

    <SupplierDetails supplier={selected} onClose={() => { setSelected(null); updateSupplierUrl(undefined, true); }} onAddInvoice={setInvoiceSupplier} />
  </main>;
}
