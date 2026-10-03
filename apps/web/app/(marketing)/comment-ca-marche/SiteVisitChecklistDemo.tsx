'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const items = [
  'Démolition ancien carrelage',
  'Pose du receveur de douche',
  'Raccordement plomberie',
  'Pose du carrelage mural',
  'Finitions silicone',
];

export default function SiteVisitChecklistDemo() {
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setVisibleCount((count) => (count >= items.length ? 1 : count + 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="mt-5 w-full max-w-xs rounded-[2rem] border-[6px] border-[#d7dde6] bg-[#e9eef5] p-4 shadow-[8px_8px_18px_#c3cbd6,-8px_-8px_18px_#ffffff]">
      <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">Chantier · Sur site, depuis le téléphone</p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li key={item} className={`flex items-center gap-2 text-xs transition-opacity duration-500 ${index < visibleCount ? 'opacity-100' : 'opacity-0'}`}>
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span className="text-slate-700">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
