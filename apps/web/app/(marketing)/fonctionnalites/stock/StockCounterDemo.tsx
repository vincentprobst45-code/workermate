'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

const scenarios = [
  { label: 'Facture fournisseur reçue', from: 86, to: 126 },
  { label: 'Devis accepté', from: 126, to: 114 },
  { label: 'Chantier terminé', from: 114, to: 106 },
  { label: 'Réassort automatique', from: 106, to: 136 },
];

export default function StockCounterDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % scenarios.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, []);

  const scenario = scenarios[index];
  const isIncrease = scenario.to > scenario.from;

  return (
    <div className="mt-4 flex items-center gap-4 rounded-2xl bg-[#e9eef5] p-4 shadow-[inset_6px_6px_14px_#c3cbd6,inset_-6px_-6px_14px_#ffffff]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e9eef5] shadow-[5px_5px_10px_#c3cbd6,-5px_-5px_10px_#ffffff]">
        {isIncrease ? (
          <ArrowUp className="h-5 w-5 text-emerald-600" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-5 w-5 text-amber-600" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{scenario.label}</p>
        <p key={index} className="mt-0.5 animate-[fade-in-up_0.4s_ease-out] text-sm text-slate-700 motion-reduce:animate-none">
          Stock mis à jour automatiquement : <span className="font-semibold text-slate-900">{scenario.from}</span>
          {' → '}
          <span className={`font-semibold ${isIncrease ? 'text-emerald-700' : 'text-amber-700'}`}>{scenario.to}</span> unités
        </p>
      </div>
    </div>
  );
}
