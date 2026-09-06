'use client';

interface NewProjectSummaryProps {
  title: string;
  customers: string[];
  quotes: string[];
  workOrders: string[];
}

export default function NewProjectSummary({
  title,
  customers,
  quotes,
  workOrders,
}: NewProjectSummaryProps) {
  return (
    <section aria-labelledby="new-project-summary-title" className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 sm:p-6">
      <h4 id="new-project-summary-title" className="mb-4 text-sm font-semibold uppercase tracking-wide text-indigo-900">
        Résumé avant création
      </h4>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-medium text-indigo-700">Projet</dt>
          <dd className="mt-1 text-slate-900">{title.trim() || 'Titre à renseigner'}</dd>
        </div>
        <div>
          <dt className="font-medium text-indigo-700">Clients</dt>
          <dd className="mt-1 text-slate-900">{customers.length ? customers.join(', ') : 'Aucun client associé'}</dd>
        </div>
        <div>
          <dt className="font-medium text-indigo-700">Devis</dt>
          <dd className="mt-1 text-slate-900">{quotes.length ? quotes.join(', ') : 'Aucun devis associé'}</dd>
        </div>
        <div>
          <dt className="font-medium text-indigo-700">Chantiers</dt>
          <dd className="mt-1 text-slate-900">{workOrders.length ? workOrders.join(', ') : 'Aucun chantier associé'}</dd>
        </div>
      </dl>
    </section>
  );
}
