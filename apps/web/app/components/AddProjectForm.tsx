'use client';

import { ProjectStatus } from '@prisma/client';
import { type FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import AddCustomerForm, { type Customer } from './AddCustomerForm';
import AddQuoteForm, { type Quote } from './AddQuoteForm';
import AddWorkOrderForm from './AddWorkOrderForm';
import CustomersList, { type Customer as CustomerListItem } from './CustomersList';
import QuotesList, { type Quote as QuoteListItem } from './QuotesList';
import WorkOrdersList, { type WorkOrder as WorkOrderListItem } from './WorkOrdersList';
import NewProjectSummary from './NewProject';

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

type AddProjectFormProps = {
  onCreated: (project: Project) => void;
  show: boolean;
};

type FeedbackSection = 'general' | 'customer' | 'quote' | 'workOrder';

type SectionFeedback = {
  error: string;
  success: string;
};

export default function AddProjectForm({ onCreated, show }: AddProjectFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState<AddProjectFormData>(createEmptyProject());
  const [customerOptions, setCustomerOptions] = useState<CustomerListItem[]>([]);
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
  const [activeAssociationPicker, setActiveAssociationPicker] = useState<'customer' | 'quote' | 'workOrder' | null>(null);
  const [primaryCustomerId, setPrimaryCustomerId] = useState('');
  const [customersLoading, setCustomersLoading] = useState(false);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<FeedbackSection, SectionFeedback>>({
    general: { error: '', success: '' },
    customer: { error: '', success: '' },
    quote: { error: '', success: '' },
    workOrder: { error: '', success: '' },
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setSectionFeedback(section: FeedbackSection, messageType: keyof SectionFeedback, message: string) {
    setFeedback((current) => ({
      ...current,
      [section]: { ...current[section], [messageType]: message },
    }));
  }

  function clearSectionFeedback(section: FeedbackSection) {
    setFeedback((current) => ({
      ...current,
      [section]: { error: '', success: '' },
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      setCustomersLoading(true);

      try {
        const response = await api.get('/customers');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: CustomerListItem[] = await response.json();
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
    if (!activeAssociationPicker && activeNewCustomerSlot === null && activeNewQuoteSlot === null && activeNewWorkOrderSlot === null) {
      return undefined;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveAssociationPicker(null);
        setActiveNewCustomerSlot(null);
        setActiveNewQuoteSlot(null);
        setActiveNewWorkOrderSlot(null);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [activeAssociationPicker, activeNewCustomerSlot, activeNewQuoteSlot, activeNewWorkOrderSlot]);

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
          setQuoteOptions(data as unknown as QuoteListItem[]);
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
          setWorkOrderOptions(data as WorkOrderListItem[]);
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

  function updateQuoteAssociation(index: number, updater: (entry: QuoteAssociation) => QuoteAssociation) {
    setQuoteAssociations((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? updater(entry) : entry,
      ),
    );
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
    const removedCustomerId = customerAssociations[index]?.customerId;
    setCustomerAssociations((current) => {
      const next = current.filter((_, entryIndex) => entryIndex !== index);
      return next.length ? next : [createEmptyCustomerAssociation()];
    });
    setPrimaryCustomerId((currentId) => currentId === removedCustomerId ? '' : currentId);

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

  function handleCreatedCustomer(customer: Customer) {
    setCustomerOptions((currentOptions) => {
      if (currentOptions.some((option) => option.id === customer.id)) {
        return currentOptions;
      }

      return [
        {
          id: customer.id,
          ...customer,
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
      setPrimaryCustomerId((currentId) => currentId || customer.id);
    }

    setActiveNewCustomerSlot(null);
    setSectionFeedback('customer', 'success', 'Nouveau client créé et associé au projet.');
  }

  function handleSelectedCustomer(customer: CustomerListItem) {
    const existingIndex = customerAssociations.findIndex((entry) => entry.customerId === customer.id);
    if (existingIndex !== -1) {
      setSectionFeedback('customer', 'error', 'Ce client est déjà associé au projet.');
      setActiveAssociationPicker(null);
      return;
    }

    const emptyIndex = customerAssociations.findIndex((entry) => entry.mode === 'none');
    if (emptyIndex === -1) {
      setCustomerAssociations((current) => [...current, { mode: 'existing', customerId: customer.id }]);
    } else {
      updateAssociation(emptyIndex, () => ({ mode: 'existing', customerId: customer.id }));
    }
    setPrimaryCustomerId((currentId) => currentId || customer.id);
    setActiveAssociationPicker(null);
    clearSectionFeedback('customer');
    setValidationErrors([]);
  }

  function handleSelectedQuote(quote: QuoteListItem) {
    if (quoteAssociations.some((entry) => entry.quoteId === quote.id)) {
      setSectionFeedback('quote', 'error', 'Ce devis est déjà associé au projet.');
      setActiveAssociationPicker(null);
      return;
    }

    const emptyIndex = quoteAssociations.findIndex((entry) => entry.mode === 'none');
    if (emptyIndex === -1) {
      setQuoteAssociations((current) => [...current, { mode: 'existing', quoteId: quote.id }]);
    } else {
      updateQuoteAssociation(emptyIndex, () => ({ mode: 'existing', quoteId: quote.id }));
    }
    setActiveAssociationPicker(null);
    clearSectionFeedback('quote');
  }

  function handleSelectedWorkOrder(workOrder: WorkOrderListItem) {
    if (workOrderAssociations.some((entry) => entry.workOrderId === workOrder.id)) {
      setSectionFeedback('workOrder', 'error', 'Ce chantier est déjà associé au projet.');
      setActiveAssociationPicker(null);
      return;
    }

    const emptyIndex = workOrderAssociations.findIndex((entry) => entry.mode === 'none');
    if (emptyIndex === -1) {
      setWorkOrderAssociations((current) => [...current, { mode: 'existing', workOrderId: workOrder.id }]);
    } else {
      updateWorkOrderAssociation(emptyIndex, () => ({ mode: 'existing', workOrderId: workOrder.id }));
    }
    setActiveAssociationPicker(null);
    clearSectionFeedback('workOrder');
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
    setSectionFeedback('quote', 'success', 'Nouveau devis créé et associé au projet.');
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
    setSectionFeedback('workOrder', 'success', 'Nouveau chantier créé et associé au projet.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback({
      general: { error: '', success: '' },
      customer: { error: '', success: '' },
      quote: { error: '', success: '' },
      workOrder: { error: '', success: '' },
    });
    setValidationErrors([]);
    if (isSubmitting) {
      return;
    }

    const errors: string[] = [];

    if (!form.title.trim()) {
      errors.push('Le titre du projet est obligatoire.');
    }

    const incompleteAssociationIndex = customerAssociations.findIndex(
      (entry) => entry.mode !== 'none' && !entry.customerId.trim(),
    );

    if (incompleteAssociationIndex !== -1) {
      errors.push(`Le client #${incompleteAssociationIndex + 1} est incomplet.`);
    }

    const incompleteQuoteAssociationIndex = quoteAssociations.findIndex(
      (entry) => entry.mode !== 'none' && !entry.quoteId.trim(),
    );

    if (incompleteQuoteAssociationIndex !== -1) {
      errors.push(`Le devis #${incompleteQuoteAssociationIndex + 1} est incomplet.`);
    }

    const incompleteWorkOrderAssociationIndex = workOrderAssociations.findIndex(
      (entry) => entry.mode !== 'none' && !entry.workOrderId.trim(),
    );

    if (incompleteWorkOrderAssociationIndex !== -1) {
      errors.push(`Le chantier #${incompleteWorkOrderAssociationIndex + 1} est incomplet.`);
    }

    if (errors.length) {
      setValidationErrors(errors);
      setSectionFeedback('general', 'error', 'Corrigez les informations signalées avant de continuer.');
      return;
    }

    const selectedCustomerIds = toSelectedCustomerIds();
    const selectedQuoteIds = toSelectedQuoteIds();
    const selectedWorkOrderIds = toSelectedWorkOrderIds();

    const payload: CreateProjectDto = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      status: 'OPEN',
      notes: form.notes.trim() || undefined,
      customerIds: selectedCustomerIds.length ? selectedCustomerIds : undefined,
      quoteIds: selectedQuoteIds.length ? selectedQuoteIds : undefined,
      workOrderIds: selectedWorkOrderIds.length ? selectedWorkOrderIds : undefined,
      primaryCustomerId: primaryCustomerId || selectedCustomerIds[0] || undefined,
    };

    setIsSubmitting(true);
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
      setPrimaryCustomerId('');
      setSectionFeedback('general', 'success', 'Projet ajouté avec succès');
    } catch {
      setSectionFeedback('general', 'error', 'Impossible de créer le projet. Vérifiez votre connexion puis réessayez.');
    } finally {
      setIsSubmitting(false);
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

        {validationErrors.length > 0 && (
          <div className={alertError} role="alert" aria-live="assertive">
            <p className="font-semibold">Corrigez les erreurs suivantes :</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {validationErrors.map((validationError) => <li key={validationError}>{validationError}</li>)}
            </ul>
          </div>
        )}
        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>1</span>
            Informations générales
          </h4>
          {feedback.general.error && <div className={`${alertError} mb-4`} role="alert">{feedback.general.error}</div>}
          {feedback.general.success && <div className={`${alertSuccess} mb-4`} role="status">{feedback.general.success}</div>}
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
          {feedback.customer.error && <div className={`${alertError} mb-4`} role="alert">{feedback.customer.error}</div>}
          {feedback.customer.success && <div className={`${alertSuccess} mb-4`} role="status">{feedback.customer.success}</div>}

          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => setActiveAssociationPicker('customer')}>Associer un client</button>
            <button type="button" className={btnGhost} onClick={() => { setActiveNewCustomerSlot(customerAssociations.length); setCustomerAssociations((current) => [...current, createEmptyCustomerAssociation()]); }}>Créer un client</button>
          </div>

          {customerAssociations.map((entry, index) => entry.mode === 'none' ? null : (
            <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Client #{index + 1}</p>
                {(entry.mode === 'existing' || Boolean(entry.customerId)) && (
                  <button type="button" className={btnDanger} onClick={() => removeCustomerAssociation(index)}>
                    Désassocier
                  </button>
                )}
              </div>

              {entry.mode === 'existing' && (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-3 text-sm text-slate-700">
                  <span>{formatCustomerLabel(customerOptions.find((customer) => customer.id === entry.customerId) || { id: entry.customerId })}</span>
                  <label className="inline-flex items-center gap-2 text-xs font-medium"><input type="radio" name="primary-customer" checked={primaryCustomerId === entry.customerId} onChange={() => setPrimaryCustomerId(entry.customerId)} /> Client principal</label>
                </div>
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

        </section>

        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>3</span>
            Devis associé(s)
          </h4>
          {feedback.quote.error && <div className={`${alertError} mb-4`} role="alert">{feedback.quote.error}</div>}
          {feedback.quote.success && <div className={`${alertSuccess} mb-4`} role="status">{feedback.quote.success}</div>}

          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => setActiveAssociationPicker('quote')}>Associer un devis</button>
            <button type="button" className={btnGhost} onClick={() => { setActiveNewQuoteSlot(quoteAssociations.length); setQuoteAssociations((current) => [...current, createEmptyQuoteAssociation()]); }}>Créer un devis</button>
          </div>

          {quoteAssociations.map((entry, index) => entry.mode === 'none' ? null : (
            <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Devis #{index + 1}</p>
                {(entry.mode === 'existing' || Boolean(entry.quoteId)) && (
                  <button type="button" className={btnDanger} onClick={() => removeQuoteAssociation(index)}>
                    Désassocier
                  </button>
                )}
              </div>

              {entry.mode === 'existing' && (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-700">{formatQuoteLabel(quoteOptions.find((quote) => quote.id === entry.quoteId) || { id: entry.quoteId, number: entry.quoteId, title: '' })}</p>
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

        </section>

        <section className={sectionClass}>
          <h4 className={sectionTitleClass}>
            <span className={stepBadgeClass}>4</span>
            Chantier(s) associé(s)
          </h4>
          {feedback.workOrder.error && <div className={`${alertError} mb-4`} role="alert">{feedback.workOrder.error}</div>}
          {feedback.workOrder.success && <div className={`${alertSuccess} mb-4`} role="status">{feedback.workOrder.success}</div>}

          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" className={btnGhost} onClick={() => setActiveAssociationPicker('workOrder')}>Associer un chantier</button>
            <button type="button" className={btnGhost} onClick={() => { setActiveNewWorkOrderSlot(workOrderAssociations.length); setWorkOrderAssociations((current) => [...current, createEmptyWorkOrderAssociation()]); }}>Créer un chantier</button>
          </div>

          {workOrderAssociations.map((entry, index) => entry.mode === 'none' ? null : (
            <div key={index} className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-700">Chantier #{index + 1}</p>
                {(entry.mode === 'existing' || Boolean(entry.workOrderId)) && (
                  <button type="button" className={btnDanger} onClick={() => removeWorkOrderAssociation(index)}>
                    Désassocier
                  </button>
                )}
              </div>

              {entry.mode === 'existing' && (
                <p className="rounded-lg bg-white p-3 text-sm text-slate-700">{formatWorkOrderLabel(workOrderOptions.find((workOrder) => workOrder.id === entry.workOrderId) || { id: entry.workOrderId, reference: entry.workOrderId, title: '' })}</p>
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

        </section>

        <NewProjectSummary
          title={form.title}
          customers={customerAssociations.filter((entry) => entry.mode !== 'none').map((entry) => formatCustomerLabel(customerOptions.find((customer) => customer.id === entry.customerId) || { id: entry.customerId }))}
          quotes={quoteAssociations.filter((entry) => entry.mode !== 'none').map((entry) => formatQuoteLabel(quoteOptions.find((quote) => quote.id === entry.quoteId) || { id: entry.quoteId, number: entry.quoteId, title: '' }))}
          workOrders={workOrderAssociations.filter((entry) => entry.mode !== 'none').map((entry) => formatWorkOrderLabel(workOrderOptions.find((workOrder) => workOrder.id === entry.workOrderId) || { id: entry.workOrderId, reference: entry.workOrderId, title: '' }))}
        />

        <button type="submit" className={btnPrimary} disabled={isSubmitting} aria-disabled={isSubmitting}>
          {isSubmitting ? 'Création en cours...' : 'Créer le projet'}
        </button>
      </form>

      {show && activeAssociationPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation" onClick={() => setActiveAssociationPicker(null)}>
          <section className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-indigo-200 bg-indigo-50 p-4 shadow-2xl sm:p-5" role="dialog" aria-modal="true" aria-labelledby="project-association-dialog-title" tabIndex={-1} onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 id="project-association-dialog-title" className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                {activeAssociationPicker === 'customer' ? 'Associer un client' : activeAssociationPicker === 'quote' ? 'Associer un devis' : 'Associer un chantier'}
              </h4>
              <button type="button" autoFocus className={btnGhost} onClick={() => setActiveAssociationPicker(null)}>Fermer</button>
            </div>
            {activeAssociationPicker === 'customer' && (
              <CustomersList customers={customerOptions} onDelete={null} handleSelectedCustomer={handleSelectedCustomer} />
            )}
            {activeAssociationPicker === 'quote' && (
              <QuotesList quotes={quoteOptions as QuoteListItem[]} onDelete={null} handleSelectedQuote={handleSelectedQuote} />
            )}
            {activeAssociationPicker === 'workOrder' && (
              <WorkOrdersList workOrders={workOrderOptions as WorkOrderListItem[]} onDelete={null} handleSelectedWorkOrder={handleSelectedWorkOrder} />
            )}
          </section>
        </div>
      )}

      {show && activeNewCustomerSlot !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setActiveNewCustomerSlot(null)}
        >
          <section
            className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-2xl sm:p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-customer-dialog"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 id="new-project-customer-dialog" className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                Nouveau client — Client #{activeNewCustomerSlot + 1}
              </h4>
              <button type="button" autoFocus className={btnGhost} onClick={() => setActiveNewCustomerSlot(null)}>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-quote-dialog"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 id="new-project-quote-dialog" className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                Nouveau devis — Devis #{activeNewQuoteSlot + 1}
              </h4>
              <button type="button" autoFocus className={btnGhost} onClick={() => setActiveNewQuoteSlot(null)}>
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-project-work-order-dialog"
            tabIndex={-1}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 id="new-project-work-order-dialog" className="text-sm font-semibold uppercase tracking-wide text-indigo-900">
                Nouveau chantier — Chantier #{activeNewWorkOrderSlot + 1}
              </h4>
              <button type="button" autoFocus className={btnGhost} onClick={() => setActiveNewWorkOrderSlot(null)}>
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
