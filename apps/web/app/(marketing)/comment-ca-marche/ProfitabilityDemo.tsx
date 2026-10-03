'use client';

import { useEffect, useState } from 'react';

const snapshots = [
  { label: 'Jour 5', budgetUsed: 30, timeUsed: 25, margin: 34 },
  { label: 'Jour 12', budgetUsed: 55, timeUsed: 60, margin: 29 },
  { label: 'Jour 18', budgetUsed: 78, timeUsed: 82, margin: 31 },
];

export default function ProfitabilityDemo() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % snapshots.length);
    }, 2600);
    return () => window.clearInterval(timer);
  }, []);

  const snapshot = snapshots[index];

  return (
    <div className="mt-5 w-full max-w-xs rounded-2xl bg-[#e9eef5] p-4 shadow-[inset_6px_6px_14px_#c3cbd6,inset_-6px_-6px_14px_#ffffff]">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        <span>Chantier · {snapshot.label}</span>
        <span key={index} className="animate-[fade-in-up_0.4s_ease-out] text-emerald-700 motion-reduce:animate-none">Marge {snapshot.margin} %</span>
      </div>
      <div className="mt-3 space-y-2.5">
        <div>
          <div className="flex justify-between text-[10px] text-slate-500"><span>Budget utilisé</span><span>{snapshot.budgetUsed} %</span></div>
          <div className="mt-1 h-2 rounded-full bg-white shadow-[inset_2px_2px_4px_#c3cbd6]">
            <div className="h-2 rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${snapshot.budgetUsed}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-500"><span>Temps passé</span><span>{snapshot.timeUsed} %</span></div>
          <div className="mt-1 h-2 rounded-full bg-white shadow-[inset_2px_2px_4px_#c3cbd6]">
            <div className="h-2 rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${snapshot.timeUsed}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
