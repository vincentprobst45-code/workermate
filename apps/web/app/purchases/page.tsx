'use client';

import { useState } from 'react';
import AddPurchaseForm from '../components/AddPurchaseForm';
import PurchasesList from '../components/PurchasesList';

export default function PurchasesPage() { const [refreshKey, setRefreshKey] = useState(0); return <main className="min-h-full bg-stone-50 p-6 md:p-10"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Achats</p><h1 className="mt-2 text-3xl font-bold text-stone-900">Nouvel achat</h1><p className="mb-8 mt-2 text-stone-600">Saisissez l’achat et choisissez les lignes qui alimentent le stock.</p><AddPurchaseForm onCreated={() => setRefreshKey((value) => value + 1)} /><PurchasesList refreshKey={refreshKey} /></div></main>; }
