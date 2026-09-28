'use client';

import { useState } from 'react';
import type { Project } from '../AddProjectForm';
import { useApiClient } from '../../api-client';
import { CardHeader, alertError, btnGhost, btnPrimary, cardClass } from './theme';

type ProjectDetailsClientsProps = {
  project: Project;
  onRequestAssociate: () => void;
  onRequestCreate: () => void;
  onChanged: () => void;
};

function customerLabel(customer: Project['customers'][number]['customer']): string {
  return [customer.firstName, customer.lastName, customer.company]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim())
    .join(' ') || customer.id;
}

function initialsFor(customer: Project['customers'][number]['customer']): string {
  return (customer.firstName?.trim().charAt(0) || customer.company?.trim().charAt(0) || '?').toUpperCase();
}

export default function ProjectDetailsClients({ project, onRequestAssociate, onRequestCreate, onChanged }: ProjectDetailsClientsProps) {
  const api = useApiClient();
  const [customers, setCustomers] = useState(project.customers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function disassociateCustomer(customerId: string) {
    if (!window.confirm('Désassocier ce client du projet ?')) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.delete(`/projects/${project.id}/customers/${customerId}`);
      if (!response.ok) throw new Error('Erreur');
      const updatedProject: Project = await response.json();
      setCustomers(updatedProject.customers);
      onChanged();
    } catch {
      setError('Impossible de désassocier le client du projet.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardHeader title={`Clients (${customers.length})`} />
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btnPrimary} onClick={onRequestAssociate}>Associer un client</button>
          <button type="button" className={btnGhost} onClick={onRequestCreate}>Créer un client</button>
        </div>
      </div>
      {error && <div className={`mb-4 ${alertError}`} role="alert">{error}</div>}
      {customers.length ? (
        <ul className="divide-y divide-slate-100">
          {customers.map((link) => (
            <li key={link.customerId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{initialsFor(link.customer)}</span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{customerLabel(link.customer)}</span>
              {link.isPrimary && <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Principal</span>}
              <button type="button" className={btnGhost} disabled={loading} onClick={() => void disassociateCustomer(link.customerId)}>{loading ? 'Retrait...' : 'Retirer du projet'}</button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Aucun client associé à ce projet.</p>}

    </div>
  );
}
