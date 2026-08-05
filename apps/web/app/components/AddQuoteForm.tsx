'use client';

import { ProjectItemType, QuoteStatus } from '@prisma/client';
import { type FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import AddressForm, {
  createEmptyAddress,
  type AddAddressFormData,
} from './AddressForm';
import {
  createEmptyCustomer,
  type AddCustomerFormData,
  type CreateCustomerDto,
} from './AddCustomerForm';
import SelectExistingAddress from './SelectExistingAddress';

type AddressMode = 'new' | 'existing' | 'none';
type CustomerMode = 'new' | 'existing';

interface AddressSummary {
  id?: string;
  street1?: string;
  street2?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string;
}

interface CustomerOption {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  vatNumber?: string;
  addressId?: string;
  address?: AddressSummary;
}

interface TenantQuoteDefaults {
  name?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  siretNumber?: string | null;
  vatNumber?: string | null;
  iban?: string | null;
  bic?: string | null;
  defaultCurrency?: string | null;
  defaultPaymentTerms?: string | null;
  defaultLegalMentions?: string | null;
  defaultInvoiceNotes?: string | null;
  address: AddressSummary | null;
}

export interface QuoteItem {
  id: string;
  quoteId: string;
  type: ProjectItemType;
  position: number;
  title: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface Quote {
  id: string;
  tenantId: string;
  customerId: string;
  projectId?: string;
  title: string;
  number: string;
  issueDate: string;
  validUntil?: string;
  projectReference?: string;
  projectTitle?: string;
  tenantName: string;
  tenantStreet1: string;
  tenantStreet2?: string;
  tenantPostalCode: string;
  tenantCity: string;
  tenantSiretNumber: string;
  tenantVatNumber: string;
  tenantEmail: string;
  tenantPhoneNumber: string;
  tenantIban?: string;
  tenantBic?: string;
  customerFirstName: string;
  customerLastName: string;
  customerStreet1: string;
  customerStreet2?: string;
  customerPostalCode: string;
  customerCity: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerVatNumber?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  projectAddress?: string;
  projectPostalCode?: string;
  projectCity?: string;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;
  depositAmount?: number;
  pdfFileId?: string;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
}

export interface AddQuoteItemFormData {
  type: ProjectItemType;
  position: number;
  title: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  total: number;
}

export interface AddQuoteFormData {
  title: string;
  issueDate: string;
  validUntil: string;
  projectReference: string;
  projectTitle: string;
  projectStartDate: string;
  projectEndDate: string;
  customerMode: CustomerMode;
  customerId: string;
  customer: AddCustomerFormData;
  projectAddressMode: AddressMode;
  projectAddressId: string;
  projectAddress: AddAddressFormData;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentTerms: string;
  legalMentions: string;
  notes: string;
  depositAmount: number;
  quoteItems: AddQuoteItemFormData[];
}

export interface CreateQuoteDto {
  customerId?: string;
  customer?: CreateCustomerDto;
  title: string;
  issueDate: string;
  validUntil?: string;
  projectReference?: string;
  projectTitle?: string;
  tenantName: string;
  tenantStreet1: string;
  tenantStreet2?: string;
  tenantPostalCode: string;
  tenantCity: string;
  tenantSiretNumber: string;
  tenantVatNumber: string;
  tenantEmail: string;
  tenantPhoneNumber: string;
  tenantIban?: string;
  tenantBic?: string;
  customerFirstName: string;
  customerLastName: string;
  customerStreet1: string;
  customerStreet2?: string;
  customerPostalCode: string;
  customerCity: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerVatNumber?: string;
  projectStartDate?: string;
  projectEndDate?: string;
  projectAddressId?: string;
  projectAddress?: AddAddressFormData;
  status: QuoteStatus;
  currency: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;
  depositAmount?: number;
  quoteItems: AddQuoteItemFormData[];
}

type AddQuoteFormProps = {
  onCreated: (quote: Quote) => void;
  show: boolean;
};

const quoteStatusOptions: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoye' },
  { value: 'ACCEPTED', label: 'Accepte' },
  { value: 'REJECTED', label: 'Refuse' },
  { value: 'EXPIRED', label: 'Expire' },
];

const quoteItemTypeOptions: Array<{ value: ProjectItemType; label: string }> = [
  { value: 'LABOR', label: 'Travaux' },
  { value: 'MATERIAL', label: 'Materiel' },
  { value: 'EQUIPMENT', label: 'Equipement' },
  { value: 'TRAVEL', label: 'Deplacement' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Autre' },
];

function toDatetimeLocal(date: Date): string {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function sanitizeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function formatCustomerLabel(customer: CustomerOption): string {
  const person = [customer.firstName, customer.lastName]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim())
    .join(' ');

  return person || customer.company?.trim() || customer.id;
}

function formatAddressLabel(address?: AddressSummary): string {
  if (!address) {
    return 'Aucune adresse';
  }

  const line1 = [address.street1, address.street2].filter(Boolean).join(' ');
  const line2 = [address.postalCode, address.city].filter(Boolean).join(' ');
  const line3 = address.countryCode || '';
  return [line1, line2, line3].filter(Boolean).join(' - ') || 'Aucune adresse';
}

function sanitizeAddress(address: AddAddressFormData): AddAddressFormData {
  return {
    street1: address.street1.trim(),
    street2: address.street2.trim(),
    postalCode: address.postalCode.trim(),
    city: address.city.trim(),
    region: address.region.trim(),
    countryCode: address.countryCode.trim(),
    latitude: address.latitude.trim(),
    longitude: address.longitude.trim(),
    accessCode: address.accessCode.trim(),
    floor: address.floor.trim(),
    apartment: address.apartment.trim(),
    note: address.note.trim(),
  };
}

function createEmptyQuoteItem(position: number): AddQuoteItemFormData {
  return {
    type: 'OTHER',
    position,
    title: '',
    description: '',
    quantity: 1,
    unit: '',
    unitPrice: 0,
    vatRate: 20,
    total: 0,
  };
}

function recomputeQuote(items: AddQuoteItemFormData[]): {
  quoteItems: AddQuoteItemFormData[];
  subtotal: number;
  vatAmount: number;
  total: number;
} {
  let subtotal = 0;
  let vatAmount = 0;

  const quoteItems = items.map((item, index) => {
    const quantity = sanitizeNumber(item.quantity);
    const unitPrice = sanitizeNumber(item.unitPrice);
    const vatRate = sanitizeNumber(item.vatRate);
    const lineSubtotal = roundMoney(quantity * unitPrice);
    const lineVat = roundMoney(lineSubtotal * (vatRate / 100));
    const total = roundMoney(lineSubtotal + lineVat);

    subtotal += lineSubtotal;
    vatAmount += lineVat;

    return {
      ...item,
      position: index,
      quantity,
      unitPrice,
      vatRate,
      total,
    };
  });

  subtotal = roundMoney(subtotal);
  vatAmount = roundMoney(vatAmount);

  return {
    quoteItems,
    subtotal,
    vatAmount,
    total: roundMoney(subtotal + vatAmount),
  };
}

export function createEmptyQuote(
  tenantDefaults?: TenantQuoteDefaults,
): AddQuoteFormData {
  const now = new Date();
  const validUntil = new Date(now);
  validUntil.setDate(validUntil.getDate() + 30);

  return {
    title: '',
    issueDate: toDatetimeLocal(now),
    validUntil: toDatetimeLocal(validUntil),
    projectReference: '',
    projectTitle: '',
    projectStartDate: '',
    projectEndDate: '',
    customerMode: 'new',
    customerId: '',
    customer: createEmptyCustomer(),
    projectAddressMode: 'none',
    projectAddressId: '',
    projectAddress: createEmptyAddress(),
    status: 'DRAFT',
    currency: tenantDefaults?.defaultCurrency || 'EUR',
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    paymentTerms: tenantDefaults?.defaultPaymentTerms || '',
    legalMentions: tenantDefaults?.defaultLegalMentions || '',
    notes: tenantDefaults?.defaultInvoiceNotes || '',
    depositAmount: 0,
    quoteItems: [createEmptyQuoteItem(0)],
  };
}

export default function AddQuoteForm({ onCreated, show }: AddQuoteFormProps) {
  const api = useApiClient();
  const [tenantDefaults, setTenantDefaults] = useState<TenantQuoteDefaults | null>(null);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [form, setForm] = useState<AddQuoteFormData>(createEmptyQuote());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [addressError, setAddressError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');

  const selectedCustomer = customers.find((customer) => customer.id === form.customerId);

  useEffect(() => {
    let cancelled = false;

    async function loadTenantDefaults() {
      try {
        const response = await api.get('/tenants/current');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: TenantQuoteDefaults = await response.json();
        if (!cancelled) {
          setTenantDefaults(data);
          setForm((currentForm) => ({
            ...createEmptyQuote(data),
            customerMode: currentForm.customerMode,
            customerId: currentForm.customerId,
            customer: currentForm.customer,
            projectAddressMode: currentForm.projectAddressMode,
            projectAddressId: currentForm.projectAddressId,
            projectAddress: currentForm.projectAddress,
            quoteItems: currentForm.quoteItems.length
              ? currentForm.quoteItems
              : [createEmptyQuoteItem(0)],
          }));
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la recuperation des parametres entreprise');
        }
      }
    }

    void loadTenantDefaults();

    return () => {
      cancelled = true;
    };
  }, [api]);

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
          setCustomers(data);
        }
      } catch {
        if (!cancelled) {
          setCustomers([]);
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

  function updateQuoteItems(updater: (items: AddQuoteItemFormData[]) => AddQuoteItemFormData[]) {
    setForm((currentForm) => {
      const nextItems = updater(currentForm.quoteItems);
      const totals = recomputeQuote(nextItems);

      return {
        ...currentForm,
        ...totals,
      };
    });
  }

  function handleUseCustomerAddress() {
    if (form.customerMode !== 'existing' || !selectedCustomer) {
      setAddressError('Veuillez selectionner un client existant');
      setAddressSuccess('');
      return;
    }

    const customerAddressId = selectedCustomer.addressId || '';

    setForm((currentForm) => ({
      ...currentForm,
      projectAddressMode: customerAddressId ? 'existing' : 'none',
      projectAddressId: customerAddressId,
    }));

    if (!customerAddressId) {
      setAddressError('Ce client n\'a pas d\'adresse enregistree');
      setAddressSuccess('');
    } else {
      setAddressError('');
      setAddressSuccess('Adresse du client selectionnee');
    }
  }

  function validateTenantSnapshot(defaults: TenantQuoteDefaults | null) {
    if (!defaults?.name?.trim()) {
      return 'Le nom de l\'entreprise est obligatoire.';
    }

    if (!defaults.address?.street1 || !defaults.address?.postalCode || !defaults.address?.city) {
      return 'Configure d\'abord l\'adresse de l\'entreprise.';
    }

    return '';
  }

  function buildCustomerPayload():
    | {
        customerId?: string;
        customer?: CreateCustomerDto;
        customerFirstName: string;
        customerLastName: string;
        customerStreet1: string;
        customerStreet2?: string;
        customerPostalCode: string;
        customerCity: string;
        customerEmail?: string;
        customerPhoneNumber?: string;
        customerVatNumber?: string;
      }
    | { error: string } {
    if (form.customerMode === 'existing') {
      if (!selectedCustomer) {
        return { error: 'Veuillez selectionner un client existant.' };
      }

      if (
        !selectedCustomer.address?.street1?.trim() ||
        !selectedCustomer.address?.postalCode?.trim() ||
        !selectedCustomer.address?.city?.trim()
      ) {
        return { error: 'Le client selectionne doit avoir une adresse complete.' };
      }

      return {
        customerId: selectedCustomer.id,
        customerFirstName: trimToUndefined(selectedCustomer.firstName) || '',
        customerLastName:
          trimToUndefined(selectedCustomer.lastName) ||
          trimToUndefined(selectedCustomer.company) ||
          '',
        customerStreet1: selectedCustomer.address.street1.trim(),
        customerStreet2: trimToUndefined(selectedCustomer.address.street2),
        customerPostalCode: selectedCustomer.address.postalCode.trim(),
        customerCity: selectedCustomer.address.city.trim(),
        customerEmail: trimToUndefined(selectedCustomer.email),
        customerPhoneNumber:
          trimToUndefined(selectedCustomer.phone) ||
          trimToUndefined(selectedCustomer.mobile),
        customerVatNumber: trimToUndefined(selectedCustomer.vatNumber),
      };
    }

    const snapshotName =
      trimToUndefined(form.customer.firstName) ||
      trimToUndefined(form.customer.company);
    if (!snapshotName) {
      return { error: 'Renseigne au moins le prenom ou l\'entreprise du nouveau client.' };
    }

    const address = sanitizeAddress(form.customer.address);
    if (!address.street1 || !address.postalCode || !address.city) {
      return { error: 'L\'adresse du nouveau client est incomplete.' };
    }

    const customer: CreateCustomerDto = {
      firstName: form.customer.firstName.trim(),
      lastName: form.customer.lastName.trim(),
      company: form.customer.company.trim(),
      email: form.customer.email.trim(),
      phone: form.customer.phone.trim(),
      mobile: form.customer.mobile.trim(),
      siret: form.customer.siret.trim(),
      vatNumber: form.customer.vatNumber.trim(),
      notes: form.customer.notes.trim(),
      address,
      addressId: '',
    };

    return {
      customer,
      customerFirstName: trimToUndefined(customer.firstName) || '',
      customerLastName:
        trimToUndefined(customer.lastName) || trimToUndefined(customer.company) || '',
      customerStreet1: address.street1,
      customerStreet2: trimToUndefined(address.street2),
      customerPostalCode: address.postalCode,
      customerCity: address.city,
      customerEmail: trimToUndefined(customer.email),
      customerPhoneNumber:
        trimToUndefined(customer.phone) || trimToUndefined(customer.mobile),
      customerVatNumber: trimToUndefined(customer.vatNumber),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setAddressError('');

    const tenantError = validateTenantSnapshot(tenantDefaults);
    if (tenantError) {
      setError(tenantError);
      return;
    }

    if (!form.quoteItems.length || form.quoteItems.some((item) => !item.title.trim())) {
      setError('Chaque ligne du devis doit avoir un titre.');
      return;
    }

    if (form.customerMode === 'existing' && !form.customerId) {
      setError('Veuillez selectionner un client existant.');
      return;
    }

    if (form.projectAddressMode === 'existing' && !form.projectAddressId) {
      setError('Veuillez selectionner une adresse chantier existante.');
      return;
    }

    if (form.projectAddressMode === 'new') {
      const address = sanitizeAddress(form.projectAddress);
      if (!address.street1 || !address.postalCode || !address.city) {
        setError('L\'adresse chantier est incomplete.');
        return;
      }
    }

    const customerPayload = buildCustomerPayload();
    if ('error' in customerPayload) {
      setError(customerPayload.error);
      return;
    }

    const payload: CreateQuoteDto = {
      title: form.title.trim(),
      issueDate: form.issueDate,
      validUntil: trimToUndefined(form.validUntil),
      projectReference: trimToUndefined(form.projectReference),
      projectTitle: trimToUndefined(form.projectTitle),
      tenantName: tenantDefaults?.name?.trim() || '',
      tenantStreet1: tenantDefaults?.address?.street1?.trim() || '',
      tenantStreet2: trimToUndefined(tenantDefaults?.address?.street2),
      tenantPostalCode: tenantDefaults?.address?.postalCode?.trim() || '',
      tenantCity: tenantDefaults?.address?.city?.trim() || '',
      tenantSiretNumber: tenantDefaults?.siretNumber?.trim() || '',
      tenantVatNumber: tenantDefaults?.vatNumber?.trim() || '',
      tenantEmail: tenantDefaults?.email?.trim() || '',
      tenantPhoneNumber: tenantDefaults?.phoneNumber?.trim() || '',
      tenantIban: trimToUndefined(tenantDefaults?.iban),
      tenantBic: trimToUndefined(tenantDefaults?.bic),
      customerId: customerPayload.customerId,
      customer: customerPayload.customer,
      customerFirstName: customerPayload.customerFirstName,
      customerLastName: customerPayload.customerLastName,
      customerStreet1: customerPayload.customerStreet1,
      customerStreet2: customerPayload.customerStreet2,
      customerPostalCode: customerPayload.customerPostalCode,
      customerCity: customerPayload.customerCity,
      customerEmail: customerPayload.customerEmail,
      customerPhoneNumber: customerPayload.customerPhoneNumber,
      customerVatNumber: customerPayload.customerVatNumber,
      projectStartDate: trimToUndefined(form.projectStartDate),
      projectEndDate: trimToUndefined(form.projectEndDate),
      projectAddressId:
        form.projectAddressMode === 'existing'
          ? trimToUndefined(form.projectAddressId)
          : undefined,
      projectAddress:
        form.projectAddressMode === 'new'
          ? sanitizeAddress(form.projectAddress)
          : undefined,
      status: form.status,
      currency: form.currency.trim() || 'EUR',
      subtotal: form.subtotal,
      vatAmount: form.vatAmount,
      total: form.total,
      paymentTerms: trimToUndefined(form.paymentTerms),
      legalMentions: trimToUndefined(form.legalMentions),
      notes: trimToUndefined(form.notes),
      depositAmount: form.depositAmount || undefined,
      quoteItems: form.quoteItems.map((item) => ({
        type: item.type,
        position: item.position,
        title: item.title.trim(),
        description: item.description.trim(),
        quantity: item.quantity,
        unit: trimToUndefined(item.unit),
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        total: item.total,
      })),
    };

    try {
      const response = await api.post('/quotes', payload);
      if (!response.ok) {
        throw new Error('Erreur');
      }

      const data: Quote = await response.json();
      onCreated(data);
      setForm(createEmptyQuote(tenantDefaults || undefined));
      setSuccess('Devis ajoute avec succes');
    } catch {
      setError('Erreur lors de la creation du devis');
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`mb-8 rounded-lg border-2 bg-white p-5 shadow ${!show ? 'hidden' : ''}`}
    >
      <h3 className="mb-4 font-semibold">Ajouter un devis</h3>

      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <h4 className="mb-3 text-lg font-semibold">Informations du devis</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className="rounded border px-3 py-2"
            placeholder="Titre du devis"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
          <select
            className="rounded border px-3 py-2"
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value as QuoteStatus })
            }
          >
            {quoteStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="rounded border px-3 py-2"
            value={form.issueDate}
            onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
            required
          />
          <input
            type="datetime-local"
            className="rounded border px-3 py-2"
            value={form.validUntil}
            onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Devise"
            value={form.currency}
            onChange={(event) => setForm({ ...form, currency: event.target.value })}
            required
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Reference chantier"
            value={form.projectReference}
            onChange={(event) =>
              setForm({ ...form, projectReference: event.target.value })
            }
          />
          <input
            className="rounded border px-3 py-2"
            placeholder="Titre chantier"
            value={form.projectTitle}
            onChange={(event) => setForm({ ...form, projectTitle: event.target.value })}
          />
          <input
            type="datetime-local"
            className="rounded border px-3 py-2"
            value={form.projectStartDate}
            onChange={(event) =>
              setForm({ ...form, projectStartDate: event.target.value })
            }
          />
          <input
            type="datetime-local"
            className="rounded border px-3 py-2"
            value={form.projectEndDate}
            onChange={(event) => setForm({ ...form, projectEndDate: event.target.value })}
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className="rounded border px-3 py-2"
            placeholder="Acompte"
            value={form.depositAmount}
            onChange={(event) =>
              setForm({
                ...form,
                depositAmount: Number.isNaN(event.target.valueAsNumber)
                  ? 0
                  : event.target.valueAsNumber,
              })
            }
          />
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <h4 className="mb-3 text-lg font-semibold">Entreprise</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <strong className="block text-slate-900">{tenantDefaults?.name || 'Entreprise non configuree'}</strong>
            <span>{formatAddressLabel(tenantDefaults?.address || undefined)}</span>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <strong className="block text-slate-900">Contact</strong>
            <span>
              {tenantDefaults?.email || '-'} / {tenantDefaults?.phoneNumber || '-'}
            </span>
          </div>
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <h4 className="mb-3 text-lg font-semibold">Client</h4>
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded border px-3 py-2 ${form.customerMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            onClick={() => {
              setForm({ ...form, customerMode: 'existing' });
              setAddressError('');
            }}
          >
            Client existant
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-2 ${form.customerMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            onClick={() => {
              setForm({ ...form, customerMode: 'new', customerId: '' });
              setAddressError('');
            }}
          >
            Nouveau client
          </button>
        </div>

        {form.customerMode === 'existing' ? (
          <div className="space-y-3">
            <select
              className="w-full rounded border px-3 py-2"
              value={form.customerId}
              onChange={(event) => {
                setForm({
                  ...form,
                  customerId: event.target.value,
                  projectAddressMode: 'none',
                  projectAddressId: '',
                });
                setAddressError('');
                setAddressSuccess('');
              }}
            >
              <option value="">-- Veuillez choisir un client --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {formatCustomerLabel(customer)}
                </option>
              ))}
            </select>

            {customersLoading ? (
              <p className="text-sm text-slate-500">Chargement des clients...</p>
            ) : selectedCustomer ? (
              <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{formatCustomerLabel(selectedCustomer)}</p>
                <p>{selectedCustomer.email || '-'}</p>
                <p>{formatAddressLabel(selectedCustomer.address)}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input
                className="rounded border px-3 py-2"
                placeholder="Prenom"
                value={form.customer.firstName}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, firstName: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Nom"
                value={form.customer.lastName}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, lastName: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Entreprise"
                value={form.customer.company}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, company: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Email"
                value={form.customer.email}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, email: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Telephone"
                value={form.customer.phone}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, phone: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Telephone mobile"
                value={form.customer.mobile}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, mobile: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="SIRET"
                value={form.customer.siret}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, siret: event.target.value },
                  })
                }
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Numero TVA"
                value={form.customer.vatNumber}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, vatNumber: event.target.value },
                  })
                }
              />
            </div>

            <textarea
              className="min-h-24 w-full rounded border px-3 py-2"
              placeholder="Notes client"
              value={form.customer.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  customer: { ...form.customer, notes: event.target.value },
                })
              }
            />

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Adresse de facturation du client</p>
              <AddressForm
                address={form.customer.address}
                onChange={(address) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, address },
                  })
                }
              />
            </div>
          </div>
        )}
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <h4 className="mb-3 text-lg font-semibold">Adresse du chantier</h4>
        {addressError && (
          <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{addressError}</div>
        )}
        {addressSuccess && (
          <div className="mb-3 rounded bg-green-100 p-3 text-green-700">{addressSuccess}</div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={`rounded border px-3 py-2 ${form.projectAddressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            onClick={() => {
              setForm({
                ...form,
                projectAddressMode: 'new',
                projectAddressId: '',
              });
              setAddressError('');
              setAddressSuccess('');
            }}
          >
            Nouvelle adresse
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-2 ${form.projectAddressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            onClick={() => {
              setForm({
                ...form,
                projectAddressMode: 'existing',
              });
              setAddressError('');
              setAddressSuccess('');
            }}
          >
            Adresse existante
          </button>
          <button
            type="button"
            className="rounded border bg-blue-400 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            onClick={handleUseCustomerAddress}
            disabled={form.customerMode !== 'existing' || !form.customerId}
          >
            Utiliser l&apos;adresse du client
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-2 ${form.projectAddressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            onClick={() => {
              setForm({
                ...form,
                projectAddressMode: 'none',
                projectAddressId: '',
              });
              setAddressError('');
              setAddressSuccess('');
            }}
          >
            Aucune adresse
          </button>
        </div>

        {form.projectAddressMode === 'new' ? (
          <AddressForm
            address={form.projectAddress}
            onChange={(projectAddress) => setForm({ ...form, projectAddress })}
          />
        ) : form.projectAddressMode === 'existing' ? (
          <SelectExistingAddress
            selectedAddressId={form.projectAddressId}
            onAddressChange={(projectAddressId) => {
              setForm({ ...form, projectAddressId });
              setAddressSuccess(projectAddressId ? 'Adresse selectionnee' : '');
            }}
            required={false}
          />
        ) : (
          <p className="text-sm text-slate-500">Le devis sera cree sans adresse de chantier.</p>
        )}
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-lg font-semibold">Lignes du devis</h4>
          <button
            type="button"
            className="rounded border bg-blue-400 px-3 py-2 text-white"
            onClick={() =>
              updateQuoteItems((items) => [...items, createEmptyQuoteItem(items.length)])
            }
          >
            Ajouter une ligne
          </button>
        </div>

        <div className="space-y-4">
          {form.quoteItems.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 p-4">
              <div className="flex gap-3">
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      updateQuoteItems((items) => {
                        if (index === 0) {
                          return items;
                        }

                        const nextItems = [...items];
                        [nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
                        return nextItems;
                      })
                    }
                    disabled={index === 0}
                    aria-label="Monter la ligne"
                    title="Monter la ligne"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() =>
                      updateQuoteItems((items) => {
                        if (index === items.length - 1) {
                          return items;
                        }

                        const nextItems = [...items];
                        [nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]];
                        return nextItems;
                      })
                    }
                    disabled={index === form.quoteItems.length - 1}
                    aria-label="Descendre la ligne"
                    title="Descendre la ligne"
                  >
                    ↓
                  </button>
                </div>
                <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  className="rounded border px-3 py-2"
                  value={item.type}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentItem,
                              type: event.target.value as ProjectItemType,
                            }
                          : currentItem,
                      ),
                    )
                  }
                >
                  {quoteItemTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  className="rounded border px-3 py-2 lg:col-span-2"
                  placeholder="Titre"
                  value={item.title}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, title: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                  required
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rounded border px-3 py-2"
                  placeholder="Quantite"
                  value={item.quantity}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentItem,
                              quantity: Number.isNaN(event.target.valueAsNumber)
                                ? 0
                                : event.target.valueAsNumber,
                            }
                          : currentItem,
                      ),
                    )
                  }
                />
                <input
                  className="rounded border px-3 py-2"
                  placeholder="Unite"
                  value={item.unit || ''}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, unit: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                />
                <textarea
                  className="min-h-24 rounded border px-3 py-2 sm:col-span-2 lg:col-span-4"
                  placeholder="Description"
                  value={item.description}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? { ...currentItem, description: event.target.value }
                          : currentItem,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rounded border px-3 py-2"
                  placeholder="Prix unitaire"
                  value={item.unitPrice}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentItem,
                              unitPrice: Number.isNaN(event.target.valueAsNumber)
                                ? 0
                                : event.target.valueAsNumber,
                            }
                          : currentItem,
                      ),
                    )
                  }
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="rounded border px-3 py-2"
                  placeholder="TVA %"
                  value={item.vatRate}
                  onChange={(event) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...currentItem,
                              vatRate: Number.isNaN(event.target.valueAsNumber)
                                ? 0
                                : event.target.valueAsNumber,
                            }
                          : currentItem,
                      ),
                    )
                  }
                />
                <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  Total ligne: {item.total.toFixed(2)} {form.currency || 'EUR'}
                </div>
                <button
                  type="button"
                  className="rounded border bg-red-300 px-3 py-2 hover:bg-red-500"
                  onClick={() =>
                    updateQuoteItems((items) =>
                      items.length === 1
                        ? [createEmptyQuoteItem(0)]
                        : items.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                >
                  Supprimer la ligne
                </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <h4 className="mb-3 text-lg font-semibold">Conditions et totaux</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <textarea
            className="min-h-28 rounded border px-3 py-2"
            placeholder="Conditions de paiement"
            value={form.paymentTerms}
            onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}
          />
          <textarea
            className="min-h-28 rounded border px-3 py-2"
            placeholder="Mentions legales"
            value={form.legalMentions}
            onChange={(event) => setForm({ ...form, legalMentions: event.target.value })}
          />
          <textarea
            className="min-h-28 rounded border px-3 py-2 sm:col-span-2"
            placeholder="Notes"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm text-slate-500">Sous-total HT</p>
            <p className="text-lg font-semibold">{form.subtotal.toFixed(2)} {form.currency || 'EUR'}</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
            <p className="text-sm text-slate-500">TVA</p>
            <p className="text-lg font-semibold">{form.vatAmount.toFixed(2)} {form.currency || 'EUR'}</p>
          </div>
          <div className="rounded border border-slate-200 bg-slate-900 px-3 py-2 text-white">
            <p className="text-sm text-slate-300">Total TTC</p>
            <p className="text-lg font-semibold">{form.total.toFixed(2)} {form.currency || 'EUR'}</p>
          </div>
        </div>
      </section>

      <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white">
        Creer le devis
      </button>
    </form>
  );
}