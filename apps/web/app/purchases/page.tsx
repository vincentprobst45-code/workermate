'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import AddPurchaseForm from '../components/AddPurchaseForm';
import type { PurchaseInitialData } from '../components/AddPurchaseForm';
import PurchaseDetails from '../components/PurchaseDetails';
import PurchasesList from '../components/PurchasesList';

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(() => searchParams.get('purchase'));
  const [initialPurchase, setInitialPurchase] = useState<PurchaseInitialData | null>(null);

  function updatePurchaseUrl(purchaseId?: string, mode: 'view' | 'edit' = 'view', replace = false) {
    const url = new URL(window.location.href);
    if (purchaseId) {
      url.searchParams.set('purchase', purchaseId);
      if (mode === 'edit') url.searchParams.set('edit', '1');
      else url.searchParams.delete('edit');
    } else {
      url.searchParams.delete('purchase');
      url.searchParams.delete('edit');
    }
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }

  function updateCreateUrl(open: boolean, replace = false) {
    const url = new URL(window.location.href);
    if (open) url.searchParams.set('create', 'purchase');
    else url.searchParams.delete('create');
    window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
  }

  useEffect(() => {
    function syncCreateForm() {
      setShowForm(new URLSearchParams(window.location.search).get('create') === 'purchase');
    }
    syncCreateForm();
    window.addEventListener('popstate', syncCreateForm);
    return () => window.removeEventListener('popstate', syncCreateForm);
  }, []);

  useEffect(() => {
    if (!showForm && !selectedPurchaseId) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') { setShowForm(false); setSelectedPurchaseId(null); updateCreateUrl(false, true); updatePurchaseUrl(undefined, 'view', true); }
    }
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handleKeyDown); document.body.style.overflow = ''; };
  }, [showForm, selectedPurchaseId]);

  function handleCreated() {
    setShowForm(false);
    setInitialPurchase(null);
    setRefreshKey((value) => value + 1);
    updateCreateUrl(false, true);
  }

  function handleRepurchase(purchase: PurchaseInitialData) {
    const purchaseId = selectedPurchaseId;
    setSelectedPurchaseId(null);
    setInitialPurchase(purchase);
    setShowForm(true);
    if (purchaseId) updatePurchaseUrl(purchaseId, 'edit');
  }

  return <main className="min-h-full bg-stone-50 p-6 md:p-10"><div className="mx-auto max-w-6xl"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Achats</p><h1 className="mt-2 text-3xl font-bold text-stone-900">Piloter les achats</h1><p className="mt-2 text-stone-600">Suivez vos dépenses, vos règlements et les entrées de stock.</p></div><button type="button" onClick={() => { setShowForm(true); updateCreateUrl(true); }} className="rounded-md bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm hover:bg-blue-700">Nouvel achat</button></div><PurchasesList refreshKey={refreshKey} onSelect={(purchaseId) => { setSelectedPurchaseId(purchaseId); updatePurchaseUrl(purchaseId); }} /></div>
    {showForm && <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => { setShowForm(false); setInitialPurchase(null); updatePurchaseUrl(undefined, 'view', true); }}><section role="dialog" aria-modal="true" aria-labelledby="purchase-form-title" className="max-h-[92vh] w-full max-w-5xl overflow-auto" onClick={(event) => event.stopPropagation()}><h2 id="purchase-form-title" className="sr-only">{initialPurchase ? 'Racheter un achat' : 'Nouvel achat'}</h2><AddPurchaseForm initialPurchase={initialPurchase} onCreated={handleCreated} onCancel={() => { setShowForm(false); setInitialPurchase(null); updatePurchaseUrl(undefined, 'view', true); }} /></section></div>}
    <PurchaseDetails purchaseId={selectedPurchaseId} onClose={() => { setSelectedPurchaseId(null); updatePurchaseUrl(undefined, 'view', true); }} onRepurchase={handleRepurchase} />
  </main>;
}
