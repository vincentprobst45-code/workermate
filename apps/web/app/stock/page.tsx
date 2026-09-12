'use client';

import StocksList from '../components/StocksList';
export default function StockPage() { return <main className="min-h-full bg-stone-50 p-6 md:p-10"><div className="mx-auto max-w-6xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Inventaire</p><h1 className="mt-2 text-3xl font-bold text-stone-900">Stock</h1><p className="mb-8 mt-2 text-stone-600">Quantités disponibles et coût économique moyen, hors TVA récupérable.</p><StocksList /></div></main>; }
