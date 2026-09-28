'use client';

import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';

const currencyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

export function formatProfitabilityCurrency(value: number): string {
  return currencyFormatter.format(value);
}

type ProjectProfitabilitySynthesisCollapseProps = {
  label: string;
  value: string;
  children: ReactNode;
  tone?: 'default' | 'positive' | 'negative';
};

export default function ProjectProfitabilitySynthesisCollapse({ label, value, children, tone = 'default' }: ProjectProfitabilitySynthesisCollapseProps) {
  const [open, setOpen] = useState(false);
  const valueClass = tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-red-700' : 'text-slate-900';

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-3 py-2.5 text-left text-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="text-slate-600">{label}</span>
        <span className="flex items-center gap-2 font-semibold">
          <span className={valueClass}>{value}</span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </span>
      </button>
      {open && <div className="border-t border-slate-100 bg-slate-50/70 px-3 py-3 text-xs text-slate-600">{children}</div>}
    </div>
  );
}
