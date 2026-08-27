'use client';

import type { WorkOrder } from './WorkOrdersList';

type WorkOrderDetailsProps = {
  workOrder: WorkOrder;
  onClose: () => void;
  onEdit: () => void;
  onSelect?: () => void;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function WorkOrderDetails({ workOrder, onClose, onEdit, onSelect }: WorkOrderDetailsProps) {
  const totalPrice = workOrder.items.reduce(
    (total, item) => total + toNumber(item.unitPrice) * toNumber(item.quantity),
    0,
  );
  const plannedStart = workOrder.plannedStartDate ?? workOrder.startDate;
  const plannedEnd = workOrder.plannedEndDate ?? workOrder.endDate;
  const statusLabels: Record<WorkOrder['status'], string> = {
    DRAFT: 'Brouillon',
    PLANNED: 'Planifié',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
  };
  const statusLabel = statusLabels[workOrder.status] ?? workOrder.status;
  const totalQuantity = workOrder.items.reduce((total, item) => total + toNumber(item.quantity), 0);
  const totalCost = workOrder.items.reduce(
    (total, item) => total + toNumber(item.unitCost) * toNumber(item.quantity),
    0,
  );
  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="w-full max-w-5xl overflow-hidden rounded-[1.75rem] bg-[#f4f1ea] text-slate-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="grid lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="flex flex-col justify-between bg-[#e2603e] p-6 text-white sm:p-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">Chantier</span>
              <span className="rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold">{workOrder.status}</span>
            </div>
            <div className="mt-12 lg:mt-24">
              <p className="text-7xl font-black leading-none tracking-[-0.08em]">{String(workOrder.items.length).padStart(2, '0')}</p>
              <p className="mt-3 max-w-[9rem] text-sm font-medium leading-5 text-orange-100">étape{workOrder.items.length > 1 ? 's' : ''} planifiée{workOrder.items.length > 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="mt-10 border-t border-white/25 pt-4 text-xs text-orange-100">
            <p className="font-semibold text-white">Référence</p>
            <p className="mt-1 break-words">{workOrder.reference || 'Sans référence'}</p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-[#fbfaf7] p-6 sm:p-8">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e2603e]">Fiche opérationnelle</p>
              <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{workOrder.title}</h3>
              <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-slate-600">{workOrder.description || 'Aucune description renseignée pour ce chantier.'}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-white" onClick={onEdit}>
                Modifier
              </button>
              <button type="button" aria-label="Fermer les détails du chantier" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700" onClick={onClose}>
                Fermer
              </button>
            </div>
          </header>

          <div className="space-y-7 p-6 sm:p-8">
            <section className="grid gap-3 sm:grid-cols-3">
              <div className="border-l-4 border-[#e2603e] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Avancement</p>
                <p className="mt-2 text-xl font-bold text-slate-950">{statusLabel}</p>
              </div>
              <div className="border-l-4 border-slate-900 bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Vente estimée</p>
                <p className="mt-2 text-xl font-bold text-slate-950">{totalPrice.toFixed(2)} €</p>
              </div>
              <div className="border-l-4 border-[#e9b949] bg-white p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Coût estimé</p>
                <p className="mt-2 text-xl font-bold text-slate-950">{totalCost.toFixed(2)} €</p>
              </div>
            </section>

            <section className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Planning</h4>
                <div className="mt-4 border-l-2 border-[#e2603e] pl-5">
                  <div className="relative pb-6">
                    <span className="absolute -left-[1.9rem] top-0 h-3 w-3 rounded-full bg-[#e2603e] ring-4 ring-[#f4f1ea]" />
                    <p className="text-xs font-semibold uppercase text-slate-500">Début prévu</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatDate(plannedStart)}</p>
                  </div>
                  <div className="relative">
                    <span className="absolute -left-[1.9rem] top-0 h-3 w-3 rounded-full bg-slate-950 ring-4 ring-[#f4f1ea]" />
                    <p className="text-xs font-semibold uppercase text-slate-500">Fin prévue</p>
                    <p className="mt-1 font-semibold text-slate-950">{formatDate(plannedEnd)}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-3 md:border-t-0 md:border-l md:pl-6 md:pt-0">
                <div><p className="text-xs font-semibold uppercase text-slate-500">Quantité totale</p><p className="mt-2 text-lg font-bold">{totalQuantity}</p></div>
                <div><p className="text-xs font-semibold uppercase text-slate-500">Client</p><p className="mt-2 break-all text-sm font-medium">{workOrder.customerId || '-'}</p></div>
                <div><p className="text-xs font-semibold uppercase text-slate-500">Adresse</p><p className="mt-2 break-all text-sm font-medium">{workOrder.addressId || '-'}</p></div>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <div><h4 className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Feuille de route</h4><p className="mt-1 text-sm text-slate-600">Détail des prestations prévues</p></div>
                <span className="text-xs font-semibold text-slate-500">{workOrder.items.length} ligne{workOrder.items.length > 1 ? 's' : ''}</span>
              </div>
              {workOrder.items.length > 0 ? (
                <ol className="divide-y divide-slate-200 border-y border-slate-200">
                  {workOrder.items.map((item) => (
                    <li key={item.id} className="grid gap-3 py-4 sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:items-center">
                      <span className="text-2xl font-black text-[#e2603e]">{String(item.position + 1).padStart(2, '0')}</span>
                      <div className="min-w-0"><p className="font-bold text-slate-950">{item.title}</p><p className="mt-1 truncate text-xs text-slate-500">{item.type} · {item.quantity} {item.unitLabel || item.unitCode || item.unit || 'unité'}</p>{item.description && <p className="mt-2 text-sm leading-5 text-slate-600">{item.description}</p>}</div>
                      <div className="text-left sm:text-right"><p className="font-bold text-slate-950">{toNumber(item.subtotal ?? toNumber(item.unitPrice) * toNumber(item.quantity)).toFixed(2)} €</p><p className="mt-1 text-xs text-slate-500">{toNumber(item.unitPrice).toFixed(2)} € / unité</p></div>
                    </li>
                  ))}
                </ol>
              ) : <p className="border-y border-slate-200 py-5 text-sm text-slate-500">Aucune étape enregistrée.</p>}
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500">
              <span>Créé le {formatDate(workOrder.createdAt)}</span>
              <span className="break-all">ID: {workOrder.id}</span>
            </footer>

            {onSelect && <button type="button" onClick={onSelect} className="w-full rounded-xl bg-[#e2603e] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c84e31] active:bg-[#a83e26]">Sélectionner ce chantier</button>}
          </div>
        </main>
      </div>
    </div>
  );
}
