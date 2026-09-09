'use client';

import { useEffect, useId, useRef } from 'react';
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

const statusLabels: Record<WorkOrder['status'], string> = {
  DRAFT: 'Brouillon',
  PLANNED: 'Planifié',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
};

const itemTypeLabels: Record<WorkOrder['items'][number]['type'], string> = {
  LABOR: 'Travaux',
  MATERIAL: 'Matériel',
  EQUIPMENT: 'Équipement',
  TRAVEL: 'Déplacement',
  SERVICE: 'Service',
  OTHER: 'Autre',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

function formatCustomer(customer: WorkOrder['customer']): string {
  if (!customer) return 'Client non renseigné';
  const person = [customer.firstName, customer.lastName]
    .filter((value): value is string => Boolean(value?.trim()))
    .join(' ');
  return person || customer.company?.trim() || 'Client non renseigné';
}

function formatAddress(address: WorkOrder['address']): string {
  if (!address) return 'Adresse non renseignée';
  return [address.street1, address.street2, `${address.postalCode} ${address.city}`]
    .filter(Boolean)
    .join(', ');
}

export default function WorkOrderDetails({ workOrder, onClose, onEdit, onSelect }: WorkOrderDetailsProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const statusLabel = statusLabels[workOrder.status] ?? workOrder.status;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const totalPrice = workOrder.items.reduce(
    (total, item) => total + toNumber(item.unitPrice) * toNumber(item.quantity),
    0,
  );
  const plannedStart = workOrder.plannedStartDate ?? workOrder.startDate;
  const plannedEnd = workOrder.plannedEndDate ?? workOrder.endDate;
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
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-900 shadow-xl" onClick={(event) => event.stopPropagation()}>
      <header className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700">
              <span>Chantier</span>
              <span className="text-slate-300" aria-hidden="true">·</span>
              <span className="normal-case tracking-normal text-slate-500">{workOrder.reference || 'Sans référence'}</span>
            </div>
            <h2 id={titleId} className="mt-2 truncate text-2xl font-black tracking-tight text-slate-950">{workOrder.title}</h2>
            <p className="mt-2 max-w-xl whitespace-pre-wrap text-sm leading-5 text-slate-600">{workOrder.description || 'Aucune description renseignée.'}</p>
          </div>
          <button type="button" aria-label="Fermer les détails du chantier" className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={onClose}>
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">{statusLabel}</span>
          <span><strong className="font-bold text-slate-900">{formatCurrency(totalPrice)}</strong> <span className="text-slate-500">estimé</span></span>
          <span className="text-slate-500">{workOrder.items.length} prestation{workOrder.items.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        <section className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2" aria-label="Informations du chantier">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Planning</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(plannedStart)} <span className="font-normal text-slate-400">→</span> {formatDate(plannedEnd)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client</p>
            <p className="mt-1 truncate text-sm font-semibold text-slate-900">{formatCustomer(workOrder.customer)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adresse d’intervention</p>
            <p className="mt-1 text-sm text-slate-700">{formatAddress(workOrder.address)}</p>
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Prestations</h3>
            <span className="text-xs text-slate-500">{totalQuantity} unité{totalQuantity !== 1 ? 's' : ''}</span>
          </div>
          {workOrder.items.length > 0 ? (
            <ol className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {workOrder.items.map((item) => (
                <li key={item.id} className="grid gap-2 px-3 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-slate-500">{itemTypeLabels[item.type]} · {item.quantity} {item.unitLabel || item.unitCode || item.unit || 'unité'}</p>
                    {item.description && <p className="mt-1 text-xs leading-4 text-slate-600">{item.description}</p>}
                  </div>
                  <p className="text-sm font-bold text-slate-900 sm:text-right">{formatCurrency(toNumber(item.subtotal ?? toNumber(item.unitPrice) * toNumber(item.quantity)))}</p>
                </li>
              ))}
            </ol>
          ) : <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">Aucune prestation enregistrée.</p>}
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <span className="text-xs text-slate-500">Créé le {formatDate(workOrder.createdAt)} · Coût estimé : {formatCurrency(totalCost)}</span>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" onClick={onEdit}>Modifier</button>
            {onSelect && <button type="button" onClick={onSelect} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Sélectionner</button>}
          </div>
        </footer>
      </div>
    </div>
  );
}
