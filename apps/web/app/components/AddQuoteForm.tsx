'use client';

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LineItemType as WorkOrderItemType, QuoteStatus } from '@prisma/client';
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
import CatalogItemList, { type CatalogItem } from './CatalogItemList';
import WorkOrdersList, { type WorkOrder } from './WorkOrdersList';
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
  type: WorkOrderItemType;
  position: number;
  title: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  total: number;
  lineIdentifier?: string;
  unitCode?: string;
  unitLabel?: string;
  subtotal?: number;
  vatCategory?: string;
}

export interface Quote {
  id: string;
  tenantId: string;
  customerId: string;
  workOrderId?: string;
  title: string;
  number: string;
  issueDate: string;
  validUntil?: string;
  workOrderReference?: string;
  workOrderTitle?: string;
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
  workOrderStartDate?: string;
  workOrderEndDate?: string;
  workOrderAddress?: string;
  workOrderPostalCode?: string;
  workOrderCity?: string;
  status: QuoteStatus;
  currency: string;
  subtotal?: number;
  vatAmount?: number;
  total?: number;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;
  depositAmount?: number;
  pdfFileId?: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItem[];
  tenantLegalName?: string;
  tenantSirenNumber?: string;
  tenantCountryCode?: string;
  customerName?: string;
  customerCountryCode?: string;
  lineNetTotal?: number;
  taxExclusiveAmount?: number;
  taxInclusiveAmount?: number;
  allowanceTotal?: number;
}

export interface AddQuoteItemFormData {
  rowId: string;
  type: WorkOrderItemType;
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
  workOrderReference: string;
  workOrderTitle: string;
  workOrderStartDate: string;
  workOrderEndDate: string;
  workOrderId: string;
  customerMode: CustomerMode;
  customerId: string;
  customer: AddCustomerFormData;
  workOrderAddressMode: AddressMode;
  workOrderAddressId: string;
  workOrderAddress: AddAddressFormData;
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
  workOrderId?: string;
  customer?: CreateCustomerDto;
  title: string;
  issueDate: string;
  validUntil?: string;
  workOrderReference?: string;
  workOrderTitle?: string;
  tenantName: string;
  tenantStreet1: string;
  tenantStreet2?: string;
  tenantPostalCode: string;
  tenantCity: string;
  tenantSiretNumber: string;
  tenantSirenNumber: string;
  tenantCountryCode: string;
  tenantVatNumber: string;
  tenantEmail: string;
  tenantPhoneNumber: string;
  tenantIban?: string;
  tenantBic?: string;
  customerFirstName: string;
  customerLastName: string;
  customerName: string;
  customerCountryCode: string;
  customerStreet1: string;
  customerStreet2?: string;
  customerPostalCode: string;
  customerCity: string;
  customerEmail?: string;
  customerPhoneNumber?: string;
  customerVatNumber?: string;
  workOrderStartDate?: string;
  workOrderEndDate?: string;
  workOrderAddressId?: string;
  workOrderAddress?: AddAddressFormData;
  status: QuoteStatus;
  currency: string;
  subtotal?: number;
  vatAmount?: number;
  total?: number;
  paymentTerms?: string;
  legalMentions?: string;
  notes?: string;
  depositAmount?: number;
  quoteItems: CreateQuoteItemPayload[];
}

interface CreateQuoteItemPayload {
  type: WorkOrderItemType;
  position: number;
  title: string;
  description: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  vatRate: number;
  total: number;
  sellerItemIdentifier?: string;
  unitCode: string;
  subtotal: number;
  vatCategory: string;
}

type AddQuoteFormProps = {
  onCreated: (quote: Quote) => void;
  show: boolean;
};

type WorkOrderSelectionMode = 'fillForm' | 'addLines';

const quoteStatusOptions: Array<{ value: QuoteStatus; label: string }> = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SENT', label: 'Envoye' },
  { value: 'ACCEPTED', label: 'Accepte' },
  { value: 'REJECTED', label: 'Refuse' },
  { value: 'EXPIRED', label: 'Expire' },
];

const quoteItemTypeOptions: Array<{ value: WorkOrderItemType; label: string }> = [
  { value: 'LABOR', label: 'Travaux' },
  { value: 'MATERIAL', label: 'Materiel' },
  { value: 'EQUIPMENT', label: 'Equipement' },
  { value: 'TRAVEL', label: 'Deplacement' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'OTHER', label: 'Autre' },
];

// Shared style tokens so every section/input/button in this form stays visually consistent.
const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100';
const lineLabelClass = 'text-xs font-medium uppercase tracking-wide text-slate-500';
const labelClass = 'text-sm font-medium text-slate-700';
// White cards on a tinted page background give each section clear contrast/edges.
const sectionClass = 'rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5';
const sectionTitleClass =
  'mb-3 flex items-center gap-2 border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500';
const stepBadgeClass = 'flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white';
const btnPrimary = 'rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700';
const btnSecondary =
  'rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50';
const btnSecondaryActive = 'rounded-lg border border-slate-900 bg-slate-900 px-3 py-2 text-sm font-medium text-white';
const btnAccent = 'rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700';
const btnConfirm = 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700';
const alertError = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700';
const alertSuccess = 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700';

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

function createQuoteItemRowId(): string {
  return crypto.randomUUID();
}

function createEmptyQuoteItem(position: number): AddQuoteItemFormData {
  return {
    rowId: createQuoteItemRowId(),
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

type SortableQuoteLineProps = {
  item: AddQuoteItemFormData;
  index: number;
  totalItems: number;
  currency: string;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTypeChange: (value: WorkOrderItemType) => void;
  onTitleChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onUnitPriceChange: (value: number) => void;
  onVatRateChange: (value: number) => void;
  onDelete: () => void;
};

function SortableQuoteLine({
  item,
  index,
  totalItems,
  currency,
  onMoveUp,
  onMoveDown,
  onTypeChange,
  onTitleChange,
  onQuantityChange,
  onUnitChange,
  onDescriptionChange,
  onUnitPriceChange,
  onVatRateChange,
  onDelete,
}: SortableQuoteLineProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.rowId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-3 transition sm:p-4 ${isDragging ? 'border-teal-300 bg-teal-50/40 opacity-80 shadow-lg' : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'}`}
    >
      <div className="flex gap-3">
        <div className="flex shrink-0 flex-col items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
            {index + 1}
          </span>
          <button
            type="button"
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 active:cursor-grabbing"
            aria-label="Glisser la ligne"
            title="Glisser la ligne"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Monter la ligne"
            title="Monter la ligne"
          >
            ↑
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onMoveDown}
            disabled={index === totalItems - 1}
            aria-label="Descendre la ligne"
            title="Descendre la ligne"
          >
            ↓
          </button>
        </div>
        <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className={lineLabelClass}>Type</span>
            <select
              className={inputClass}
              value={item.type}
              onChange={(event) => onTypeChange(event.target.value as WorkOrderItemType)}
            >
              {quoteItemTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 lg:col-span-2">
            <span className={lineLabelClass}>Titre</span>
            <input
              className={inputClass}
              placeholder="Titre"
              value={item.title}
              onChange={(event) => onTitleChange(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lineLabelClass}>Quantité</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="Quantite"
              value={item.quantity}
              onChange={(event) =>
                onQuantityChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lineLabelClass}>Unité</span>
            <input
              className={inputClass}
              placeholder="Unite"
              value={item.unit || ''}
              onChange={(event) => onUnitChange(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
            <span className={lineLabelClass}>Description</span>
            <textarea
              className={`${inputClass} min-h-20`}
              placeholder="Description"
              value={item.description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lineLabelClass}>Prix unitaire</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="Prix unitaire"
              value={item.unitPrice}
              onChange={(event) =>
                onUnitPriceChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lineLabelClass}>TVA (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              placeholder="TVA %"
              value={item.vatRate}
              onChange={(event) =>
                onVatRateChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
              }
            />
          </label>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-500">Total ligne</span>
            <span className="font-semibold text-slate-900">{item.total.toFixed(2)} {currency || 'EUR'}</span>
          </div>
          <div className="flex items-stretch">
            <button
              type="button"
              className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              onClick={onDelete}
            >
              Supprimer la ligne
            </button>
          </div>
        </div>
      </div>
    </div>
  );
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
    workOrderReference: '',
    workOrderTitle: '',
    workOrderStartDate: '',
    workOrderEndDate: '',
    workOrderId: '',
    customerMode: 'new',
    customerId: '',
    customer: createEmptyCustomer(),
    workOrderAddressMode: 'none',
    workOrderAddressId: '',
    workOrderAddress: createEmptyAddress(),
    status: 'DRAFT',
    currency: tenantDefaults?.defaultCurrency || 'EUR',
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    paymentTerms: tenantDefaults?.defaultPaymentTerms || '',
    legalMentions: tenantDefaults?.defaultLegalMentions || '',
    notes: tenantDefaults?.defaultInvoiceNotes || '',
    depositAmount: 0,
    quoteItems: [],
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
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [workOrdersError, setWorkOrdersError] = useState('');
  const [showWorkOrdersList, setShowWorkOrdersList] = useState(false);
  const [showWorkOrdersListTop, setShowWorkOrdersListTop] = useState(false);
  const [doubleCheckShowWorkOrdersListTop, setDoubleCheckShowWorkOrdersListTop] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [showWorkOrderAssociationList, setShowWorkOrderAssociationList] = useState(false);
  const [workOrderSelectionMode, setWorkOrderSelectionMode] = useState<WorkOrderSelectionMode>('addLines');
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [catalogItemsLoading, setCatalogItemsLoading] = useState(false);
  const [catalogItemsError, setCatalogItemsError] = useState('');
  const [showCatalogItemsList, setShowCatalogItemsList] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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
            workOrderAddressMode: currentForm.workOrderAddressMode,
            workOrderAddressId: currentForm.workOrderAddressId,
            workOrderAddress: currentForm.workOrderAddress,
            quoteItems: currentForm.quoteItems.length
              ? currentForm.quoteItems
              : [],
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    updateQuoteItems((items) => {
      const oldIndex = items.findIndex((item) => item.rowId === active.id);
      const newIndex = items.findIndex((item) => item.rowId === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return items;
      }

      return arrayMove(items, oldIndex, newIndex);
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
      workOrderAddressMode: customerAddressId ? 'existing' : 'none',
      workOrderAddressId: customerAddressId,
    }));

    if (!customerAddressId) {
      setAddressError('Ce client n\'a pas d\'adresse enregistree');
      setAddressSuccess('');
    } else {
      setAddressError('');
      setAddressSuccess('Adresse du client selectionnee');
    }
  }

  async function openWorkOrderSelector(mode: WorkOrderSelectionMode) {
    setWorkOrderSelectionMode(mode);
    setWorkOrdersError('');
    setShowWorkOrdersList(false);
    setShowWorkOrdersListTop(false);
    if(mode == 'addLines')
    {
      setDoubleCheckShowWorkOrdersListTop(false)
      setShowWorkOrdersList(true);
    } else {
      setDoubleCheckShowWorkOrdersListTop(true)
      setShowWorkOrdersListTop(true);
    }
    setShowCatalogItemsList(false);
    setSelectedWorkOrder(null);
    setWorkOrdersLoading(true);

    try {
      const response = await api.get('/workOrders');
      if (!response.ok) {
        throw new Error('Erreur');
      }

      const data: WorkOrder[] = await response.json();
      setWorkOrders(data);
    } catch {
      setWorkOrders([]);
      setWorkOrdersError('Erreur lors de la récupération des chantiers');
    } finally {
      setWorkOrdersLoading(false);
    }
  }

  async function openWorkOrderAssociationSelector() {
    setShowWorkOrderAssociationList(true);
    setWorkOrdersError('');
    setWorkOrdersLoading(true);

    try {
      const response = await api.get('/workOrders');
      if (!response.ok) {
        throw new Error('Erreur');
      }

      setWorkOrders(await response.json() as WorkOrder[]);
    } catch {
      setWorkOrders([]);
      setWorkOrdersError('Erreur lors de la récupération des chantiers');
    } finally {
      setWorkOrdersLoading(false);
    }
  }

  function chooseSelectedWorkOrder() {
    if (!selectedWorkOrder) {
      return;
    }

    const importedWorkOrderItems = selectedWorkOrder.items.map((workOrderItem, index) => ({
      rowId: createQuoteItemRowId(),
      type: workOrderItem.type,
      position: index,
      title: workOrderItem.title,
      description: workOrderItem.description ?? '',
      quantity: Number(workOrderItem.quantity) || 0,
      unit: workOrderItem.unit ?? '',
      unitPrice: Number(workOrderItem.unitPrice) || 0,
      vatRate: Number(workOrderItem.vatRate) || 0,
      total: 0,
    }));

    if (workOrderSelectionMode === 'fillForm') {
      const filledQuoteItems = recomputeQuote(importedWorkOrderItems);

      setForm((currentForm) => ({
        ...currentForm,
        title: `Devis-${selectedWorkOrder.title}`,
        workOrderTitle: selectedWorkOrder.title,
        workOrderReference: selectedWorkOrder.reference || '',
        workOrderId: selectedWorkOrder.id,
        workOrderStartDate: selectedWorkOrder.plannedStartDate ? toDatetimeLocal(new Date(selectedWorkOrder.plannedStartDate)) : '',
        workOrderEndDate: selectedWorkOrder.plannedEndDate ? toDatetimeLocal(new Date(selectedWorkOrder.plannedEndDate)) : '',
        customerMode: selectedWorkOrder.customerId ? 'existing' : currentForm.customerMode,
        customerId: selectedWorkOrder.customerId || '',
        workOrderAddressMode: selectedWorkOrder.addressId ? 'existing' : 'none',
        workOrderAddressId: selectedWorkOrder.addressId || '',
        ...filledQuoteItems,
      }));
    } else {
      if (!selectedWorkOrder.items.length) {
        setWorkOrdersError('Le chantier sélectionné ne contient aucune étape.');
        return;
      }
      updateQuoteItems((items) => [
        ...items,
        ...importedWorkOrderItems.map((workOrderItem, index) => ({
          ...workOrderItem,
          position: items.length + index,
        })),
      ]);
    }

    setShowWorkOrdersList(false);
    setSelectedWorkOrder(null);
    setWorkOrdersError('');
    setSuccess(
      workOrderSelectionMode === 'fillForm'
        ? 'Formulaire rempli depuis le chantier.'
        : 'Lignes importées depuis le chantier.',
    );
  }

  async function openCatalogItemSelector() {
    setCatalogItemsError('');
    setShowCatalogItemsList(true);
    setShowWorkOrdersList(false);
    setSelectedCatalogItem(null);
    setCatalogItemsLoading(true);

    try {
      const response = await api.get('/catalogitems');
      if (!response.ok) {
        throw new Error('Erreur');
      }

      const data: CatalogItem[] = await response.json();
      setCatalogItems(data);
    } catch {
      setCatalogItems([]);
      setCatalogItemsError('Erreur lors de la récupération des articles catalogue');
    } finally {
      setCatalogItemsLoading(false);
    }
  }

  function chooseSelectedCatalogItem() {
    if (!selectedCatalogItem) {
      return;
    }

    updateQuoteItems((items) => [
      ...items,
      {
        rowId: createQuoteItemRowId(),
        type: selectedCatalogItem.type,
        position: items.length,
        title: selectedCatalogItem.title,
        description: selectedCatalogItem.description ?? '',
        quantity: Number(selectedCatalogItem.defaultQuantity) || 1,
        unit: selectedCatalogItem.unit ?? '',
        unitPrice: Number(selectedCatalogItem.unitPrice) || 0,
        vatRate: Number(selectedCatalogItem.vatRate) || 0,
        total: 0,
      },
    ]);

    setShowCatalogItemsList(false);
    setSelectedCatalogItem(null);
    setCatalogItemsError('');
    setSuccess('Ligne importée depuis le catalogue.');
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

    if (form.workOrderAddressMode === 'existing' && !form.workOrderAddressId) {
      setError('Veuillez selectionner une adresse chantier existante.');
      return;
    }

    if (form.workOrderAddressMode === 'new') {
      const address = sanitizeAddress(form.workOrderAddress);
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
      workOrderReference: trimToUndefined(form.workOrderReference),
      workOrderTitle: trimToUndefined(form.workOrderTitle),
      tenantName: tenantDefaults?.name?.trim() || '',
      tenantStreet1: tenantDefaults?.address?.street1?.trim() || '',
      tenantStreet2: trimToUndefined(tenantDefaults?.address?.street2),
      tenantPostalCode: tenantDefaults?.address?.postalCode?.trim() || '',
      tenantCity: tenantDefaults?.address?.city?.trim() || '',
      tenantSiretNumber: tenantDefaults?.siretNumber?.trim() || '',
      tenantSirenNumber: tenantDefaults?.siretNumber?.replace(/\D/g, '').slice(0, 9) || '',
      tenantCountryCode: tenantDefaults?.address?.countryCode?.trim() || 'FR',
      tenantVatNumber: tenantDefaults?.vatNumber?.trim() || '',
      tenantEmail: tenantDefaults?.email?.trim() || '',
      tenantPhoneNumber: tenantDefaults?.phoneNumber?.trim() || '',
      tenantIban: trimToUndefined(tenantDefaults?.iban),
      tenantBic: trimToUndefined(tenantDefaults?.bic),
      customerId: customerPayload.customerId,
      customer: customerPayload.customer,
      customerFirstName: customerPayload.customerFirstName,
      customerLastName: customerPayload.customerLastName,
      customerName: [customerPayload.customerFirstName, customerPayload.customerLastName].filter(Boolean).join(' ').trim(),
      workOrderId: trimToUndefined(form.workOrderId),
      customerCountryCode: 'FR',
      customerStreet1: customerPayload.customerStreet1,
      customerStreet2: customerPayload.customerStreet2,
      customerPostalCode: customerPayload.customerPostalCode,
      customerCity: customerPayload.customerCity,
      customerEmail: customerPayload.customerEmail,
      customerPhoneNumber: customerPayload.customerPhoneNumber,
      customerVatNumber: customerPayload.customerVatNumber,
      workOrderStartDate: trimToUndefined(form.workOrderStartDate),
      workOrderEndDate: trimToUndefined(form.workOrderEndDate),
      workOrderAddressId:
        form.workOrderAddressMode === 'existing'
          ? trimToUndefined(form.workOrderAddressId)
          : undefined,
      workOrderAddress:
        form.workOrderAddressMode === 'new'
          ? sanitizeAddress(form.workOrderAddress)
          : undefined,
      status: form.status,
      currency: form.currency.trim() || 'EUR',
      paymentTerms: trimToUndefined(form.paymentTerms),
      legalMentions: trimToUndefined(form.legalMentions),
      notes: trimToUndefined(form.notes),
      depositAmount: form.depositAmount || undefined,
      quoteItems: form.quoteItems.map((item) => ({
        type: item.type,
        position: item.position,
        sellerItemIdentifier: undefined,
        title: item.title.trim(),
        description: item.description.trim(),
        quantity: item.quantity,
        unit: trimToUndefined(item.unit),
        unitCode: 'C62',
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        subtotal: item.total,
        vatCategory: 'STANDARD',
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
      className={`space-y-4 rounded-2xl border border-slate-600 bg-slate-200 p-4 shadow-sm sm:p-5 ${!show ? 'hidden' : ''}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Nouveau document</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900">Ajouter un devis</h3>
      </div>

      {error && <div className={alertError}>{error}</div>}
      {success && <div className={alertSuccess}>{success}</div>}

      <button
        type="button"
        className={btnSecondary}
        onClick={() => {
          void openWorkOrderSelector('fillForm');
        }}
      >
        Remplir les champs à partir d&apos;un chantier existant
      </button>

      {showWorkOrdersListTop && (
        <div className={sectionClass}>
          <div className="mb-4 flex items-center gap-3">
            <h4 className={`${sectionTitleClass} mb-0`}>Sélectionner un chantier</h4>
            <button
              type="button"
              className={`${btnSecondary} ml-auto`}
              onClick={() => setShowWorkOrdersListTop(false)}
            >
              Fermer la liste
            </button>
          </div>
          {workOrdersLoading ? (
            <p className="text-sm text-slate-500">Chargement des chantiers...</p>
          ) : (
            <WorkOrdersList
              workOrders={workOrders}
              onDelete={null}
              handleSelectedWorkOrder={(workOrder) => {
                setSelectedWorkOrder(workOrder);
                setShowWorkOrdersListTop(false);
                setWorkOrdersError('');
              }}
            />
          )}
        </div>
      )}

      {!showWorkOrdersListTop && doubleCheckShowWorkOrdersListTop && selectedWorkOrder &&  (
        <div className={sectionClass}>
          <h4 className={sectionTitleClass}>Chantier sélectionné</h4>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p><span className="font-medium text-slate-900">Titre :</span> {selectedWorkOrder.title}</p>
            <p><span className="font-medium text-slate-900">Description :</span> {selectedWorkOrder.description || '-'}</p>
            <p><span className="font-medium text-slate-900">Référence :</span> {selectedWorkOrder.reference || '-'}</p>
            <p><span className="font-medium text-slate-900">Nombre d&apos;étapes :</span> {selectedWorkOrder.items.length || 0}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={chooseSelectedWorkOrder}
              className={btnConfirm}
            >
              {workOrderSelectionMode === 'fillForm'
                ? 'Remplir le devis avec ce chantier'
                : 'Choisir ce chantier'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowWorkOrdersListTop(true);
              }}
              className={btnSecondary}
            >
              Choisir un autre chantier
            </button>
          </div>
        </div>
      )}

      <section className={sectionClass}>
        <h4 className={sectionTitleClass}>
          <span className={stepBadgeClass}>1</span>
          Informations du devis
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className={labelClass}>Titre du devis</span>
            <input
              className={inputClass}
              placeholder="Titre du devis"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Statut</span>
            <select
              className={inputClass}
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
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Date d&apos;émission</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.issueDate}
              onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Valable jusqu&apos;au</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.validUntil}
              onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Devise</span>
            <input
              className={inputClass}
              placeholder="Devise"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Référence chantier</span>
            <input
              className={inputClass}
              placeholder="Reference chantier"
              value={form.workOrderReference}
              onChange={(event) =>
                setForm({ ...form, workOrderReference: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Titre chantier</span>
            <input
              className={inputClass}
              placeholder="Titre chantier"
              value={form.workOrderTitle}
              onChange={(event) => setForm({ ...form, workOrderTitle: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Début chantier</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.workOrderStartDate}
              onChange={(event) =>
                setForm({ ...form, workOrderStartDate: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Fin chantier</span>
            <input
              type="datetime-local"
              className={inputClass}
              value={form.workOrderEndDate}
              onChange={(event) => setForm({ ...form, workOrderEndDate: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Acompte</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
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
          </label>
        </div>
      </section>

      <section className={sectionClass}>
        <h4 className={sectionTitleClass}>
          <span className={stepBadgeClass}>2</span>
          Chantier associé
        </h4>
        <p className="mb-3 text-sm text-slate-500">Associez ce devis à un chantier existant.</p>
        <button
          type="button"
          className={btnSecondary}
          onClick={() => void openWorkOrderAssociationSelector()}
        >
          {form.workOrderId ? 'Modifier le chantier associé' : 'Associer à un chantier existant'}
        </button>
        {form.workOrderId && (
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-700">
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-800">
              {workOrders.find((workOrder) => workOrder.id === form.workOrderId)?.title || form.workOrderId}
            </span>
            <button type="button" className="font-medium text-red-600 hover:text-red-800" onClick={() => setForm({ ...form, workOrderId: '' })}>
              Retirer
            </button>
          </p>
        )}
        {showWorkOrderAssociationList && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-3">
              <h5 className="text-sm font-semibold text-slate-700">Sélectionner un chantier</h5>
              <button type="button" className={`${btnSecondary} ml-auto`} onClick={() => setShowWorkOrderAssociationList(false)}>
                Fermer la liste
              </button>
            </div>
            {workOrdersLoading ? <p className="text-sm text-slate-500">Chargement des chantiers...</p> : (
              <WorkOrdersList
                workOrders={workOrders}
                onDelete={null}
                handleSelectedWorkOrder={(workOrder) => {
                  setForm({ ...form, workOrderId: workOrder.id });
                  setShowWorkOrderAssociationList(false);
                  setWorkOrdersError('');
                }}
              />
            )}
          </div>
        )}
        {workOrdersError && <p className={`mt-3 ${alertError}`}>{workOrdersError}</p>}
      </section>

      <section className={sectionClass}>
        <h4 className={sectionTitleClass}>
          <span className={stepBadgeClass}>3</span>
          Entreprise
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <strong className="block text-slate-900">{tenantDefaults?.name || 'Entreprise non configuree'}</strong>
            <span>{formatAddressLabel(tenantDefaults?.address || undefined)}</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <strong className="block text-slate-900">Contact</strong>
            <span>
              {tenantDefaults?.email || '-'} / {tenantDefaults?.phoneNumber || '-'}
            </span>
          </div>
        </div>
      </section>

      <section className={sectionClass}>
        <h4 className={sectionTitleClass}>
          <span className={stepBadgeClass}>4</span>
          Client
        </h4>
        <div className="mb-4 inline-flex rounded-lg border border-slate-300 bg-slate-50 p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${form.customerMode === 'existing' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => {
              setForm({ ...form, customerMode: 'existing' });
              setAddressError('');
            }}
          >
            Client existant
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${form.customerMode === 'new' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
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
              className={inputClass}
              value={form.customerId}
              onChange={(event) => {
                setForm({
                  ...form,
                  customerId: event.target.value,
                  workOrderAddressMode: 'none',
                  workOrderAddressId: '',
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
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <p className="font-medium text-slate-900">{formatCustomerLabel(selectedCustomer)}</p>
                <p>{selectedCustomer.email || '-'}</p>
                <p>{formatAddressLabel(selectedCustomer.address)}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Prénom</span>
                <input
                  className={inputClass}
                  placeholder="Prenom"
                  value={form.customer.firstName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, firstName: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Nom</span>
                <input
                  className={inputClass}
                  placeholder="Nom"
                  value={form.customer.lastName}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, lastName: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Entreprise</span>
                <input
                  className={inputClass}
                  placeholder="Entreprise"
                  value={form.customer.company}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, company: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Email</span>
                <input
                  className={inputClass}
                  placeholder="Email"
                  value={form.customer.email}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, email: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Téléphone</span>
                <input
                  className={inputClass}
                  placeholder="Telephone"
                  value={form.customer.phone}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, phone: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Téléphone mobile</span>
                <input
                  className={inputClass}
                  placeholder="Telephone mobile"
                  value={form.customer.mobile}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, mobile: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>SIRET</span>
                <input
                  className={inputClass}
                  placeholder="SIRET"
                  value={form.customer.siret}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, siret: event.target.value },
                    })
                  }
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={labelClass}>Numéro de TVA</span>
                <input
                  className={inputClass}
                  placeholder="Numero TVA"
                  value={form.customer.vatNumber}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      customer: { ...form.customer, vatNumber: event.target.value },
                    })
                  }
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Notes client</span>
              <textarea
                className={`${inputClass} min-h-24`}
                placeholder="Notes client"
                value={form.customer.notes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    customer: { ...form.customer, notes: event.target.value },
                  })
                }
              />
            </label>

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

      <section className={sectionClass}>
        <h4 className={sectionTitleClass}>
          <span className={stepBadgeClass}>5</span>
          Adresse du chantier
        </h4>
        {addressError && (
          <div className={`mb-3 ${alertError}`}>{addressError}</div>
        )}
        {addressSuccess && (
          <div className={`mb-3 ${alertSuccess}`}>{addressSuccess}</div>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={form.workOrderAddressMode === 'new' ? btnSecondaryActive : btnSecondary}
            onClick={() => {
              setForm({
                ...form,
                workOrderAddressMode: 'new',
                workOrderAddressId: '',
              });
              setAddressError('');
              setAddressSuccess('');
            }}
          >
            Nouvelle adresse
          </button>
          <button
            type="button"
            className={form.workOrderAddressMode === 'existing' ? btnSecondaryActive : btnSecondary}
            onClick={() => {
              setForm({
                ...form,
                workOrderAddressMode: 'existing',
              });
              setAddressError('');
              setAddressSuccess('');
            }}
          >
            Adresse existante
          </button>
          <button
            type="button"
            className={`${btnAccent} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
            onClick={handleUseCustomerAddress}
            disabled={form.customerMode !== 'existing' || !form.customerId}
          >
            Utiliser l&apos;adresse du client
          </button>
          <button
            type="button"
            className={form.workOrderAddressMode === 'none' ? btnSecondaryActive : btnSecondary}
            onClick={() => {
              setForm({
                ...form,
                workOrderAddressMode: 'none',
                workOrderAddressId: '',
              });
              setAddressError('');
              setAddressSuccess('');
            }}
          >
            Aucune adresse
          </button>
        </div>

        {form.workOrderAddressMode === 'new' ? (
          <AddressForm
            address={form.workOrderAddress}
            onChange={(workOrderAddress) => setForm({ ...form, workOrderAddress })}
          />
        ) : form.workOrderAddressMode === 'existing' ? (
          <SelectExistingAddress
            selectedAddressId={form.workOrderAddressId}
            onAddressChange={(workOrderAddressId) => {
              setForm({ ...form, workOrderAddressId });
              setAddressSuccess(workOrderAddressId ? 'Adresse selectionnee' : '');
            }}
            required={false}
          />
        ) : (
          <p className="text-sm text-slate-500">Le devis sera cree sans adresse de chantier.</p>
        )}
      </section>

      <section className={sectionClass}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h4 className={`${sectionTitleClass} mb-0 border-b-0 pb-0`}>
            <span className={stepBadgeClass}>6</span>
            Lignes du devis
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btnAccent}
              onClick={() =>
                updateQuoteItems((items) => [...items, createEmptyQuoteItem(items.length)])
              }
            >
              Ajouter une ligne
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                void openWorkOrderSelector('addLines');
              }}
            >
              Depuis un chantier
            </button>
            <button
              type="button"
              className={btnSecondary}
              onClick={() => {
                void openCatalogItemSelector();
              }}
            >
              Depuis le catalogue
            </button>
          </div>
        </div>

        {workOrdersError && (
          <div className={`mb-3 ${alertError}`}>{workOrdersError}</div>
        )}
        {catalogItemsError && (
          <div className={`mb-3 ${alertError}`}>{catalogItemsError}</div>
        )}

        {showWorkOrdersList && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-3">
              <h5 className="text-sm font-semibold text-slate-700">Sélectionner un chantier</h5>
              <button
                type="button"
                className={`${btnSecondary} ml-auto`}
                onClick={() => setShowWorkOrdersList(false)}
              >
                Fermer la liste
              </button>
            </div>
            {workOrdersLoading ? (
              <p className="text-sm text-slate-500">Chargement des chantiers...</p>
            ) : (
              <WorkOrdersList
                workOrders={workOrders}
                onDelete={null}
                handleSelectedWorkOrder={(workOrder) => {
                  setSelectedWorkOrder(workOrder);
                  setShowWorkOrdersList(false);
                  setWorkOrdersError('');
                }}
              />
            )}
          </div>
        )}

        {!showWorkOrdersList && !doubleCheckShowWorkOrdersListTop && selectedWorkOrder && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h5 className="mb-3 text-sm font-semibold text-slate-700">Chantier sélectionné</h5>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p><span className="font-medium text-slate-900">Titre :</span> {selectedWorkOrder.title}</p>
              <p><span className="font-medium text-slate-900">Description :</span> {selectedWorkOrder.description || '-'}</p>
              <p><span className="font-medium text-slate-900">Référence :</span> {selectedWorkOrder.reference || '-'}</p>
              <p><span className="font-medium text-slate-900">Nombre d&apos;étapes :</span> {selectedWorkOrder.items.length || 0}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={chooseSelectedWorkOrder}
                className={btnConfirm}
              >
                {workOrderSelectionMode === 'fillForm'
                  ? 'Remplir le devis avec ce chantier'
                  : 'Choisir ce chantier'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWorkOrdersList(true);
                }}
                className={btnSecondary}
              >
                Choisir un autre chantier
              </button>
            </div>
          </div>
        )}

        {showCatalogItemsList && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center gap-3">
              <h5 className="text-sm font-semibold text-slate-700">Sélectionner un article catalogue</h5>
              <button
                type="button"
                className={`${btnSecondary} ml-auto`}
                onClick={() => setShowCatalogItemsList(false)}
              >
                Fermer la liste
              </button>
            </div>
            {catalogItemsLoading ? (
              <p className="text-sm text-slate-500">Chargement des articles catalogue...</p>
            ) : (
              <CatalogItemList
                catalogItems={catalogItems}
                onDelete={null}
                handleSelectedCatalogItem={(catalogItem) => {
                  setSelectedCatalogItem(catalogItem);
                  setShowCatalogItemsList(false);
                  setCatalogItemsError('');
                }}
              />
            )}
          </div>
        )}

        {!showCatalogItemsList && selectedCatalogItem && (
          <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h5 className="mb-3 text-sm font-semibold text-slate-700">Article catalogue sélectionné</h5>
            <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p><span className="font-medium text-slate-900">Titre :</span> {selectedCatalogItem.title}</p>
              <p><span className="font-medium text-slate-900">Type :</span> {selectedCatalogItem.type}</p>
              <p><span className="font-medium text-slate-900">Description :</span> {selectedCatalogItem.description || '-'}</p>
              <p>
                <span className="font-medium text-slate-900">Quantité/Unité :</span> {Number(selectedCatalogItem.defaultQuantity) || 1} {selectedCatalogItem.unit || '-'}
              </p>
              <p>
                <span className="font-medium text-slate-900">Prix / TVA :</span> {Number(selectedCatalogItem.unitPrice) || 0} / {Number(selectedCatalogItem.vatRate) || 0}%
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={chooseSelectedCatalogItem}
                className={btnConfirm}
              >
                Choisir cet article
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCatalogItemsList(true);
                }}
                className={btnSecondary}
              >
                Choisir un autre article
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={form.quoteItems.map((item) => item.rowId)}
              strategy={verticalListSortingStrategy}
            >
              {form.quoteItems.map((item, index) => (
                <SortableQuoteLine
                  key={item.rowId}
                  item={item}
                  index={index}
                  totalItems={form.quoteItems.length}
                  currency={form.currency}
                  onMoveUp={() =>
                    updateQuoteItems((items) => {
                      if (index === 0) {
                        return items;
                      }

                      const nextItems = [...items];
                      [nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
                      return nextItems;
                    })
                  }
                  onMoveDown={() =>
                    updateQuoteItems((items) => {
                      if (index === items.length - 1) {
                        return items;
                      }

                      const nextItems = [...items];
                      [nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]];
                      return nextItems;
                    })
                  }
                  onTypeChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, type: value } : currentItem,
                      ),
                    )
                  }
                  onTitleChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, title: value } : currentItem,
                      ),
                    )
                  }
                  onQuantityChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, quantity: value } : currentItem,
                      ),
                    )
                  }
                  onUnitChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, unit: value } : currentItem,
                      ),
                    )
                  }
                  onDescriptionChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, description: value } : currentItem,
                      ),
                    )
                  }
                  onUnitPriceChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, unitPrice: value } : currentItem,
                      ),
                    )
                  }
                  onVatRateChange={(value) =>
                    updateQuoteItems((items) =>
                      items.map((currentItem, currentIndex) =>
                        currentIndex === index ? { ...currentItem, vatRate: value } : currentItem,
                      ),
                    )
                  }
                  onDelete={() =>
                    updateQuoteItems((items) =>
                      items.length === 1
                        ? []
                        : items.filter((_, currentIndex) => currentIndex !== index),
                    )
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
          {form.quoteItems.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Aucune ligne pour le moment. Ajoutez-en une manuellement ou depuis un chantier / le catalogue.
            </p>
          )}
        </div>
      </section>

      <section className={sectionClass}>
        <h4 className={sectionTitleClass}>
          <span className={stepBadgeClass}>7</span>
          Conditions et totaux
        </h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Conditions de paiement</span>
            <textarea
              className={`${inputClass} min-h-28`}
              placeholder="Conditions de paiement"
              value={form.paymentTerms}
              onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Mentions légales</span>
            <textarea
              className={`${inputClass} min-h-28`}
              placeholder="Mentions legales"
              value={form.legalMentions}
              onChange={(event) => setForm({ ...form, legalMentions: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelClass}>Notes</span>
            <textarea
              className={`${inputClass} min-h-28`}
              placeholder="Notes"
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Sous-total HT</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{form.subtotal.toFixed(2)} {form.currency || 'EUR'}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">TVA</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{form.vatAmount.toFixed(2)} {form.currency || 'EUR'}</p>
          </div>
          <div className="rounded-lg bg-slate-900 px-4 py-3 text-white">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-300">Total TTC</p>
            <p className="mt-1 text-lg font-semibold">{form.total.toFixed(2)} {form.currency || 'EUR'}</p>
          </div>
        </div>
      </section>

      <button type="submit" className={`${btnPrimary} w-full sm:w-auto`}>
        Créer le devis
      </button>
    </form>
  );
}