'use client';

import { ProjectStatus } from '@prisma/client';
import { type FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import AddCustomerForm, { type Customer } from './AddCustomerForm';
import AddQuoteForm, { type Quote } from './AddQuoteForm';
import AddWorkOrderForm from './AddWorkOrderForm';

interface CustomerOption {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
}

interface QuoteOption {
  id: string;
  number: string;
  title: string;
}

interface WorkOrderOption {
  id: string;
  reference: string;
  title: string;
}

export interface ProjectCustomerLink {
  customerId: string;
  isPrimary: boolean;
  customer: {
    id: string;
    firstName?: string;
    lastName?: string;
    company?: string;
  };
}

export interface ProjectCountSummary {
  quotes: number;
  workOrders: number;
  invoices: number;
  calendarEvents: number;
}

export interface Project {
  id: string;
  tenantId: string;
  reference: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  notes?: string;
  customers: ProjectCustomerLink[];
  _count?: ProjectCountSummary;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddProjectFormData {
  title: string;
  description: string;
  status: ProjectStatus;
  notes: string;
}

type CustomerAssociationMode = 'none' | 'existing' | 'new';
type QuoteAssociationMode = 'none' | 'existing' | 'new';
type WorkOrderAssociationMode = 'none' | 'existing' | 'new';

interface CustomerAssociation {
  mode: CustomerAssociationMode;
  customerId: string;
}

interface QuoteAssociation {
  mode: QuoteAssociationMode;
  quoteId: string;
}

interface WorkOrderAssociation {
  mode: WorkOrderAssociationMode;
  workOrderId: string;
}

interface CreateProjectDto {
  title: string;
  description?: string;
  status: ProjectStatus;
  notes?: string;
  customerIds?: string[];
  quoteIds?: string[];
  workOrderIds?: string[];
  primaryCustomerId?: string;
}

function createEmptyProject(): AddProjectFormData {
  return {
    title: '',
    description: '',
    status: 'OPEN',
    notes: '',
  };
}

function createEmptyCustomerAssociation(): CustomerAssociation {
  return {
    mode: 'none',
    customerId: '',
  };
}

function createEmptyQuoteAssociation(): QuoteAssociation {
  return {
    mode: 'none',
    quoteId: '',
  };
}

function createEmptyWorkOrderAssociation(): WorkOrderAssociation {
  return {
    mode: 'none',
    workOrderId: '',
  };
}

function formatCustomerLabel(customer: CustomerOption): string {
  return [customer.firstName, customer.lastName, customer.company]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim())
    .join(' ') || customer.id;
}

function formatQuoteLabel(quote: QuoteOption): string {
  return `${quote.number} - ${quote.title}`;
}

function formatWorkOrderLabel(workOrder: WorkOrderOption): string {
  return `${workOrder.reference} - ${workOrder.title}`;
}

const projectStatusOptions: Array<{ value: ProjectStatus; label: string }> = [
  { value: 'OPEN', label: 'Ouvert' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminé' },
  { value: 'CANCELLED', label: 'Annulé' },
];

// Clean, modern "project workspace" look — distinct from other forms in the app.
const sectionClass = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6';
const sectionTitleClass = 'mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900';
const stepBadgeClass = 'flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white';
const labelClass = 'text-sm font-medium text-slate-700';
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const btnPrimary = 'rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700';
const btnGhost =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50';
const btnDanger =
  'rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100';
const alertError = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700';
const alertSuccess = 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700';

function modeButtonClass(active: boolean): string {
  return `rounded-md px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`;
}

type AddProjectFormProps = {
  onCreated: (project: Project) => void;
  show: boolean;
};

export default function AddProjectForm({ onCreated, show }: AddProjectFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState<AddProjectFormData>(createEmptyProject());
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [quoteOptions, setQuoteOptions] = useState<QuoteOption[]>([]);
  const [workOrderOptions, setWorkOrderOptions] = useState<WorkOrderOption[]>([]);
  const [customerAssociations, setCustomerAssociations] = useState<CustomerAssociation[]>([
    createEmptyCustomerAssociation(),
  ]);
  const [quoteAssociations, setQuoteAssociations] = useState<QuoteAssociation[]>([
    createEmptyQuoteAssociation(),
  ]);
  const [workOrderAssociations, setWorkOrderAssociations] = useState<WorkOrderAssociation[]>([
    createEmptyWorkOrderAssociation(),
  ]);
  const [activeNewCustomerSlot, setActiveNewCustomerSlot] = useState<number | null>(null);
  const [activeNewQuoteSlot, setActiveNewQuoteSlot] = useState<number | null>(null);
  const [activeNewWorkOrderSlot, setActiveNewWorkOrderSlot] = useState<number | null>(null);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setCustomersLoading(true);

      try {
        const response = await api.get('/customers');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: CustomerOption[] = await response.json();
        if (!cancelled) {
          setCustomerOptions(data);
        }
      } catch {
        if (!cancelled) {
          setCustomerOptions([]);
        }
      } finally {
        if (!cancelled) {
          setCustomersLoading(false);
        }
      }
    }

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuotes() {
      setQuotesLoading(true);

      try {
        const response = await api.get('/quotes');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: Quote[] = await response.json();
        if (!cancelled) {
          setQuoteOptions(
            data.map((quote) => ({
              id: quote.id,
              number: quote.number,
              title: quote.title,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setQuoteOptions([]);
        }
      } finally {
        if (!cancelled) {
          setQuotesLoading(false);
        }
      }
    }

    void loadQuotes();

    return () => {
      cancelled = true;
    };
  }, [api]);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrders() {
      setWorkOrdersLoading(true);

      try {
        const response = await api.get('/workOrders');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: Array<{ id: string; reference: string; title: string }> = await response.json();
        if (!cancelled) {
          setWorkOrderOptions(
            data.map((workOrder) => ({
              id: workOrder.id,
              reference: workOrder.reference,
              title: workOrder.title,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setWorkOrderOptions([]);
        }
      } finally {
        if (!cancelled) {
          setWorkOrdersLoading(false);
        }
      }
    }

    void loadWorkOrders();

    return () => {
      cancelled = true;
    };
  }, [api]);

  function updateAssociation(index: number, updater: (entry: CustomerAssociation) => CustomerAssociation) {
    setCustomerAssociations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      ),
    );
  }

  function addAnotherCustomerAssociation() {
    setCustomerAssociations((current) => [...current, createEmptyCustomerAssociation()]);
  }

  function updateQuoteAssociation(index: number, updater: (entry: QuoteAssociation) => QuoteAssociation) {
    setQuoteAssociations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      ),
    );
  }

  function addAnotherQuoteAssociation() {
    setQuoteAssociations((current) => [...current, createEmptyQuoteAssociation()]);
  }

  function removeQuoteAssociation(index: number) {
    setQuoteAssociations((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      return next.length ? next : [createEmptyQuoteAssociation()];
    });

    setActiveNewQuoteSlot((currentSlot) => {
      if (currentSlot === null) {
        return null;
      }

      if (currentSlot === index) {
        return null;
      }

      return currentSlot > index ? currentSlot - 1 : currentSlot;
    });
  }

  function updateWorkOrderAssociation(index: number, updater: (entry: WorkOrderAssociation) => WorkOrderAssociation) {
    setWorkOrderAssociations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      ),
    );
  }

  function addAnotherWorkOrderAssociation() {
    setWorkOrderAssociations((current) => [...current, createEmptyWorkOrderAssociation()]);
  }

  function removeWorkOrderAssociation(index: number) {
    setWorkOrderAssociations((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      return next.length ? next : [createEmptyWorkOrderAssociation()];
    });

    setActiveNewWorkOrderSlot((currentSlot) => {
      if (currentSlot === null) {
        return null;
      }

      if (currentSlot === index) {
        return null;
      }

      return currentSlot > index ? currentSlot - 1 : currentSlot;
    });
  }

  function removeCustomerAssociation(index: number) {
    setCustomerAssociations((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      return next.length ? next : [createEmptyCustomerAssociation()];
    });

    setActiveNewCustomerSlot((currentSlot) => {
      if (currentSlot === null) {
        return null;
      }

      if (currentSlot === index) {
        return null;
      }

      return currentSlot > index ? currentSlot - 1 : currentSlot;
    });
  }

  function toSelectedCustomerIds(): string[] {
    const ids = customerAssociations
      .filter((entry) => entry.mode !== 'none')
      .map((entry) => entry.customerId.trim())
      .filter(Boolean);

    return [...new Set(ids)];
  }

  function toSelectedQuoteIds(): string[] {
    const ids = quoteAssociations
      .filter((entry) => entry.mode !== 'none')
      .map((entry) => entry.quoteId.trim())
      .filter(Boolean);

    return [...new Set(ids)];
  }

  function toSelectedWorkOrderIds(): string[] {
    const ids = workOrderAssociations
      .filter((entry) => entry.mode !== 'none')
      .map((entry) => entry.workOrderId.trim())
      .filter(Boolean);

    return [...new Set(ids)];
  }

  function hasAtLeastOneActiveAssociation(): boolean {
    return customerAssociations.some((entry) => entry.mode !== 'none');
  }

  function hasAtLeastOneActiveQuoteAssociation(): boolean {
    return quoteAssociations.some((entry) => entry.mode !== 'none');
  }

  function hasAtLeastOneActiveWorkOrderAssociation(): boolean {
    return workOrderAssociations.some((entry) => entry.mode !== 'none');
  }

  function handleCreatedCustomer(customer: Customer) {
    setCustomerOptions((currentOptions) => {
      if (currentOptions.some((option) => option.id === customer.id)) {
        return currentOptions;
      }

      return [
        {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          company: customer.company,
        },
        ...currentOptions,
      ];
    });

    if (activeNewCustomerSlot !== null) {
      updateAssociation(activeNewCustomerSlot, (entry) => ({
        ...entry,
        mode: 'new',
        customerId: customer.id,
      }));
    }

    setActiveNewCustomerSlot(null);
    setSuccess('Nouveau client créé et associé au projet.');
  }

  function handleCreatedQuote(quote: Quote) {
    setQuoteOptions((currentOptions) => {
      if (currentOptions.some((option) => option.id === quote.id)) {
        return currentOptions;
      }

      return [
        {
          id: quote.id,
          number: quote.number,
          title: quote.title,
        },
        ...currentOptions,
      ];
    });

    if (activeNewQuoteSlot !== null) {
      updateQuoteAssociation(activeNewQuoteSlot, (entry) => ({
        ...entry,
        mode: 'new',
        quoteId: quote.id,
      }));
    }

    setActiveNewQuoteSlot(null);
    setSuccess('Nouveau devis créé et associé au projet.');
  }

  function handleCreatedWorkOrder(workOrder: { id: string; reference: string; title: string }) {
    setWorkOrderOptions((currentOptions) => {
      if (currentOptions.some((option) => option.id === workOrder.id)) {
        return currentOptions;
      }

      return [
        {
          id: workOrder.id,
          reference: workOrder.reference,
          title: workOrder.title,
        },
        ...currentOptions,
      ];
    });

    if (activeNewWorkOrderSlot !== null) {
      updateWorkOrderAssociation(activeNewWorkOrderSlot, (entry) => ({
        ...entry,
        mode: 'new',
        workOrderId: workOrder.id,
      }));
    }

    setActiveNewWorkOrderSlot(null);
    setSuccess('Nouveau chantier créé et associé au projet.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title.trim()) {
      setError('Le titre est obligatoire.');
      return;
    }

    const incompleteAssociationIndex = customerAssociations.findIndex(
      (entry) => entry.mode !== 'none' && !entry.customerId.trim(),
    );

    if (incompleteAssociationIndex !== -1) {
      setError(`Le client #${incompleteAssociationIndex + 1} est incomplet.`);
      return;
    }

    const incompleteQuoteAssociationIndex = quoteAssociations.findIndex(
      (entry) => entry.mode !== 'none' && !entry.quoteId.trim(),
    );

    if (incompleteQuoteAssociationIndex !== -1) {
      setError(`Le devis #${incompleteQuoteAssociationIndex + 1} est incomplet.`);
      return;
    }

    const incompleteWorkOrderAssociationIndex = workOrderAssociations.findIndex(
      (entry) => entry.mode !== 'none' && !entry.workOrderId.trim(),
    );

    if (incompleteWorkOrderAssociationIndex !== -1) {
      setError(`Le chantier #${incompleteWorkOrderAssociationIndex + 1} est incomplet.`);
      return;
    }

    const selectedCustomerIds = toSelectedCustomerIds();
    const selectedQuoteIds = toSelectedQuoteIds();
    const selectedWorkOrderIds = toSelectedWorkOrderIds();

    const payload: CreateProjectDto = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: form.status,
      notes: form.notes.trim() || undefined,
      customerIds: selectedCustomerIds.length ? selectedCustomerIds : undefined,
      quoteIds: selectedQuoteIds.length ? selectedQuoteIds : undefined,
      workOrderIds: selectedWorkOrderIds.length ? selectedWorkOrderIds : undefined,
      primaryCustomerId: selectedCustomerIds[0] || undefined,
    };

    try {
      const response = await api.post('/projects', payload);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      const data: Project = await response.json();
      onCreated(data);
      setForm(createEmptyProject());
      setCustomerAssociations([createEmptyCustomerAssociation()]);
      setQuoteAssociations([createEmptyQuoteAssociation()]);
      setWorkOrderAssociations([createEmptyWorkOrderAssociation()]);
      setActiveNewCustomerSlot(null);
      setActiveNewQuoteSlot(null);
      setActiveNewWorkOrderSlot(null);
      setSuccess('Projet ajouté avec succès');
    } catch {
      setError('Erreur lors de la création du projet');
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={`mb-8 space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm sm:p-5 ${!show ? 'hidden' : ''}`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Nouveau projet</p>
          <h3 className="mt-1 text-xl font-bold text-slate-900">Créer un projet</h3>
        </div>

        {error && <div className={alertError}>{error}</div>}
        {success && <div className={alertSuccess}>{success}</div>}

        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>1</span>
            Informations générales
          </h4>
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            La référence projet sera générée automatiquement à la création.
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Titre</span>
              <input
                className={inputClass}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Nom du projet"
                required
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Statut</span>
              <select
                className={inputClass}
                value={form.status}
                onChange={(event) =>
                  setForm({ ...form, status: event.target.value as ProjectStatus })
                }
              >
                {projectStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={labelClass}>Description</span>
              <textarea
                className={`${inputClass} min-h-24`}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Description globale du projet"
              />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className={labelClass}>Notes</span>
              <textarea
                className={`${inputClass} min-h-24`}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Notes internes"
              />
            </label>
          </div>
        </section>

        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>2</span>
            Client(s) associé(s)
          </h4>

          {customerAssociations.map((entry, index) => (
            <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Client #{index + 1}</p>
                {index > 0 && (
                  <button type="button" className={btnDanger} onClick={() => removeCustomerAssociation(index)}>
                    Retirer
                  </button>
                )}
              </div>

              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'none')}
                  onClick={() =>
                    updateAssociation(index, () => ({
                      mode: 'none',
                      customerId: '',
                    }))
                  }
                >
                  Aucun
                </button>
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'existing')}
                  onClick={() =>
                    updateAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      mode: 'existing',
                    }))
                  }
                >
                  Existant
                </button>
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'new')}
                  onClick={() =>
                    updateAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      mode: 'new',
                    }))
                  }
                >
                  Nouveau
                </button>
              </div>

              {entry.mode === 'existing' && (
                <select
                  className={inputClass}
                  value={entry.customerId}
                  onChange={(event) =>
                    updateAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      customerId: event.target.value,
                    }))
                  }
                >
                  <option value="">-- Veuillez choisir un client --</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {formatCustomerLabel(customer)}
                    </option>
                  ))}
                </select>
              )}

              {entry.mode === 'new' && (
                <div className="space-y-2">
                  {entry.customerId ? (
                    <p className={alertSuccess}>
                      Client associé: {formatCustomerLabel(customerOptions.find((customer) => customer.id === entry.customerId) || { id: entry.customerId })}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Créez un nouveau client pour l&apos;associer à ce projet.</p>
                  )}
                  <button type="button" className={btnGhost} onClick={() => setActiveNewCustomerSlot(index)}>
                    {entry.customerId ? 'Créer et remplacer le client associé' : 'Créer un nouveau client'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {customersLoading && <p className="text-sm text-slate-500">Chargement des clients...</p>}

          {hasAtLeastOneActiveAssociation() && (
            <button type="button" className={btnGhost} onClick={addAnotherCustomerAssociation}>
              + Associer un autre client
            </button>
          )}
        </section>

        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>3</span>
            Devis associé(s)
          </h4>

          {quoteAssociations.map((entry, index) => (
            <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Devis #{index + 1}</p>
                {index > 0 && (
                  <button type="button" className={btnDanger} onClick={() => removeQuoteAssociation(index)}>
                    Retirer
                  </button>
                )}
              </div>

              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'none')}
                  onClick={() =>
                    updateQuoteAssociation(index, () => ({
                      mode: 'none',
                      quoteId: '',
                    }))
                  }
                >
                  Aucun
                </button>
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'existing')}
                  onClick={() =>
                    updateQuoteAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      mode: 'existing',
                    }))
                  }
                >
                  Existant
                </button>
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'new')}
                  onClick={() =>
                    updateQuoteAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      mode: 'new',
                    }))
                  }
                >
                  Nouveau
                </button>
              </div>

              {entry.mode === 'existing' && (
                <select
                  className={inputClass}
                  value={entry.quoteId}
                  onChange={(event) =>
                    updateQuoteAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      quoteId: event.target.value,
                    }))
                  }
                >
                  <option value="">-- Veuillez choisir un devis --</option>
                  {quoteOptions.map((quote) => (
                    <option key={quote.id} value={quote.id}>
                      {formatQuoteLabel(quote)}
                    </option>
                  ))}
                </select>
              )}

              {entry.mode === 'new' && (
                <div className="space-y-2">
                  {entry.quoteId ? (
                    <p className={alertSuccess}>
                      Devis associé: {formatQuoteLabel(quoteOptions.find((quote) => quote.id === entry.quoteId) || { id: entry.quoteId, number: entry.quoteId, title: '' })}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Créez un nouveau devis pour l&apos;associer à ce projet.</p>
                  )}
                  <button type="button" className={btnGhost} onClick={() => setActiveNewQuoteSlot(index)}>
                    {entry.quoteId ? 'Créer et remplacer le devis associé' : 'Créer un nouveau devis'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {quotesLoading && <p className="text-sm text-slate-500">Chargement des devis...</p>}

          {hasAtLeastOneActiveQuoteAssociation() && (
            <button type="button" className={btnGhost} onClick={addAnotherQuoteAssociation}>
              + Associer un autre devis
            </button>
          )}
        </section>

        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>4</span>
            Chantier(s) associé(s)
          </h4>

          {workOrderAssociations.map((entry, index) => (
            <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Chantier #{index + 1}</p>
                {index > 0 && (
                  <button type="button" className={btnDanger} onClick={() => removeWorkOrderAssociation(index)}>
                    Retirer
                  </button>
                )}
              </div>

              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'none')}
                  onClick={() =>
                    updateWorkOrderAssociation(index, () => ({
                      mode: 'none',
                      workOrderId: '',
                    }))
                  }
                >
                  Aucun
                </button>
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'existing')}
                  onClick={() =>
                    updateWorkOrderAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      mode: 'existing',
                    }))
                  }
                >
                  Existant
                </button>
                <button
                  type="button"
                  className={modeButtonClass(entry.mode === 'new')}
                  onClick={() =>
                    updateWorkOrderAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      mode: 'new',
                    }))
                  }
                >
                  Nouveau
                </button>
              </div>

              {entry.mode === 'existing' && (
                <select
                  className={inputClass}
                  value={entry.workOrderId}
                  onChange={(event) =>
                    updateWorkOrderAssociation(index, (currentEntry) => ({
                      ...currentEntry,
                      workOrderId: event.target.value,
                    }))
                  }
                >
                  <option value="">-- Veuillez choisir un chantier --</option>
                  {workOrderOptions.map((workOrder) => (
                    <option key={workOrder.id} value={workOrder.id}>
                      {formatWorkOrderLabel(workOrder)}
                    </option>
                  ))}
                </select>
              )}

              {entry.mode === 'new' && (
                <div className="space-y-2">
                  {entry.workOrderId ? (
                    <p className={alertSuccess}>
                      Chantier associé: {formatWorkOrderLabel(workOrderOptions.find((workOrder) => workOrder.id === entry.workOrderId) || { id: entry.workOrderId, reference: entry.workOrderId, title: '' })}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Créez un nouveau chantier pour l&apos;associer à ce projet.</p>
                  )}
                  <button type="button" className={btnGhost} onClick={() => setActiveNewWorkOrderSlot(index)}>
                    {entry.workOrderId ? 'Créer et remplacer le chantier associé' : 'Créer un nouveau chantier'}
                  </button>
                </div>
              )}
            </div>
          ))}

          {workOrdersLoading && <p className="text-sm text-slate-500">Chargement des chantiers...</p>}

          {hasAtLeastOneActiveWorkOrderAssociation() && (
            <button type="button" className={btnGhost} onClick={addAnotherWorkOrderAssociation}>
              + Associer un autre chantier
            </button>
          )}
        </section>

        <button type="submit" className={btnPrimary}>
          Créer le projet
        </button>
      </form>

      {show && activeNewCustomerSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setActiveNewCustomerSlot(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                Nouveau client — Client #{activeNewCustomerSlot + 1}
              </h4>
              <button type="button" className={btnGhost} onClick={() => setActiveNewCustomerSlot(null)}>
                Fermer
              </button>
            </div>

            <AddCustomerForm
              show={true}
              onCreated={handleCreatedCustomer}
            />
          </section>
        </div>
      )}

      {show && activeNewQuoteSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setActiveNewQuoteSlot(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                Nouveau devis — Devis #{activeNewQuoteSlot + 1}
              </h4>
              <button type="button" className={btnGhost} onClick={() => setActiveNewQuoteSlot(null)}>
                Fermer
              </button>
            </div>

            <AddQuoteForm
              show={true}
              onCreated={handleCreatedQuote}
            />
          </section>
        </div>
      )}

      {show && activeNewWorkOrderSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setActiveNewWorkOrderSlot(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-2xl sm:p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                Nouveau chantier — Chantier #{activeNewWorkOrderSlot + 1}
              </h4>
              <button type="button" className={btnGhost} onClick={() => setActiveNewWorkOrderSlot(null)}>
                Fermer
              </button>
            </div>

            <AddWorkOrderForm
              show={true}
              onCreated={handleCreatedWorkOrder}
            />
          </section>
        </div>
      )}
    </>
  );
}
