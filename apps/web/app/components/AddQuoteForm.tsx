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
      className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
    >
      <div className="flex gap-3">
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="cursor-grab rounded border px-2 py-1 text-sm active:cursor-grabbing"
            aria-label="Glisser la ligne"
            title="Glisser la ligne"
            {...attributes}
            {...listeners}
          >
            ≡
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label="Monter la ligne"
            title="Monter la ligne"
          >
            ↑
          </button>
          <button
            type="button"
            className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
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
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Type</span>
            <select
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Titre</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Titre"
              value={item.title}
              onChange={(event) => onTitleChange(event.target.value)}
              required
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Quantité</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Quantite"
              value={item.quantity}
              onChange={(event) =>
                onQuantityChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Unité</span>
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Unite"
              value={item.unit || ''}
              onChange={(event) => onUnitChange(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-4">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Description</span>
            <textarea
              className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Description"
              value={item.description}
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Prix unitaire</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="Prix unitaire"
              value={item.unitPrice}
              onChange={(event) =>
                onUnitPriceChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-600">TVA (%)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
              placeholder="TVA %"
              value={item.vatRate}
              onChange={(event) =>
                onVatRateChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)
              }
            />
          </label>
          <div className="flex items-end rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Total ligne: {item.total.toFixed(2)} {currency || 'EUR'}
          </div>
          <div className="flex items-end">
            <button
              type="button"
              className="w-full rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700 transition hover:bg-red-200"
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
        workOrderStartDate: selectedWorkOrder.startDate ? toDatetimeLocal(new Date(selectedWorkOrder.startDate)) : '',
        workOrderEndDate: selectedWorkOrder.endDate ? toDatetimeLocal(new Date(selectedWorkOrder.endDate)) : '',
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
      className={`mb-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ${!show ? 'hidden' : ''}`}
    >
      <h3 className="text-lg font-semibold text-zinc-900">Ajouter un devis</h3>

      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

      <div>
        <button
          type="button"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
          onClick={() => {
            void openWorkOrderSelector('fillForm');
          }}
        >
          Remplir les champs à partir d&apos;un projet existant
        </button>
      </div>

        {showWorkOrdersListTop && (
          <div className="mb-4 rounded-md border-2 p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-lg font-semibold">Sélectionner un chantier</h4>
              <button
                type="button"
                className="ml-auto rounded border px-3 py-2"
                onClick={() => setShowWorkOrdersListTop(false)}
              >
                Fermer la liste
              </button>
            </div>
            {workOrdersLoading ? (
              <p>Chargement des chantiers...</p>
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
          <div className="mb-4 rounded-md border-2 p-4">
            <h4 className="mb-3 text-lg font-semibold">Chantier sélectionné</h4>
            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
              <p><strong>Titre:</strong> {selectedWorkOrder.title}</p>
              <p><strong>Description:</strong> {selectedWorkOrder.description || '-'}</p>
              <p><strong>Référence:</strong> {selectedWorkOrder.reference || '-'}</p>
              <p><strong>Nombre d&apos;étapes:</strong> {selectedWorkOrder.items.length || 0}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={chooseSelectedWorkOrder}
                className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400"
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
                className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
              >
                Choisir un autre chantier
              </button>
            </div>
          </div>
        )}

      <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
        <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Informations du devis</h4>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Titre du devis</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Titre du devis"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Statut</span>
            <select
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
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
            <span className="text-sm font-medium text-zinc-700">Date d&apos;émission</span>
            <input
              type="datetime-local"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              value={form.issueDate}
              onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Valable jusqu&apos;au</span>
            <input
              type="datetime-local"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              value={form.validUntil}
              onChange={(event) => setForm({ ...form, validUntil: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Devise</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Devise"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
              required
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Référence chantier</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Reference chantier"
              value={form.workOrderReference}
              onChange={(event) =>
                setForm({ ...form, workOrderReference: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Titre chantier</span>
            <input
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Titre chantier"
              value={form.workOrderTitle}
              onChange={(event) => setForm({ ...form, workOrderTitle: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Début chantier</span>
            <input
              type="datetime-local"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              value={form.workOrderStartDate}
              onChange={(event) =>
                setForm({ ...form, workOrderStartDate: event.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Fin chantier</span>
            <input
              type="datetime-local"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              value={form.workOrderEndDate}
              onChange={(event) => setForm({ ...form, workOrderEndDate: event.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Acompte</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
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
            className={`rounded border px-3 py-2 ${form.workOrderAddressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
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
            className={`rounded border px-3 py-2 ${form.workOrderAddressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
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
            className="rounded border bg-blue-400 px-3 py-2 text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
            onClick={handleUseCustomerAddress}
            disabled={form.customerMode !== 'existing' || !form.customerId}
          >
            Utiliser l&apos;adresse du client
          </button>
          <button
            type="button"
            className={`rounded border px-3 py-2 ${form.workOrderAddressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
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

      <section className="mb-6 rounded-lg border border-slate-200 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h4 className="text-lg font-semibold">Lignes du devis</h4>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border bg-blue-400 px-3 py-2 text-white"
              onClick={() =>
                updateQuoteItems((items) => [...items, createEmptyQuoteItem(items.length)])
              }
            >
              Ajouter une ligne
            </button>
            <button
              type="button"
              className="rounded border bg-slate-200 px-3 py-2"
              onClick={() => {
                void openWorkOrderSelector('addLines');
              }}
            >
              Ajouter des lignes à partir d&apos;un chantier
            </button>
            <button
              type="button"
              className="rounded border bg-slate-200 px-3 py-2"
              onClick={() => {
                void openCatalogItemSelector();
              }}
            >
              Ajouter une ligne à partir du catalogue
            </button>
          </div>
        </div>

        {workOrdersError && (
          <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{workOrdersError}</div>
        )}
        {catalogItemsError && (
          <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{catalogItemsError}</div>
        )}

        {showWorkOrdersList && (
          <div className="mb-4 rounded-md border-2 p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-lg font-semibold">Sélectionner un chantier</h4>
              <button
                type="button"
                className="ml-auto rounded border px-3 py-2"
                onClick={() => setShowWorkOrdersList(false)}
              >
                Fermer la liste
              </button>
            </div>
            {workOrdersLoading ? (
              <p>Chargement des chantiers...</p>
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
          <div className="mb-4 rounded-md border-2 p-4">
            <h4 className="mb-3 text-lg font-semibold">Chantier sélectionné</h4>
            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
              <p><strong>Titre:</strong> {selectedWorkOrder.title}</p>
              <p><strong>Description:</strong> {selectedWorkOrder.description || '-'}</p>
              <p><strong>Référence:</strong> {selectedWorkOrder.reference || '-'}</p>
              <p><strong>Nombre d&apos;étapes:</strong> {selectedWorkOrder.items.length || 0}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={chooseSelectedWorkOrder}
                className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400"
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
                className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
              >
                Choisir un autre chantier
              </button>
            </div>
          </div>
        )}

        {showCatalogItemsList && (
          <div className="mb-4 rounded-md border-2 p-4">
            <div className="mb-3 flex items-center gap-2">
              <h4 className="text-lg font-semibold">Sélectionner un article catalogue</h4>
              <button
                type="button"
                className="ml-auto rounded border px-3 py-2"
                onClick={() => setShowCatalogItemsList(false)}
              >
                Fermer la liste
              </button>
            </div>
            {catalogItemsLoading ? (
              <p>Chargement des articles catalogue...</p>
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
          <div className="mb-4 rounded-md border-2 p-4">
            <h4 className="mb-3 text-lg font-semibold">Article catalogue sélectionné</h4>
            <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
              <p><strong>Titre:</strong> {selectedCatalogItem.title}</p>
              <p><strong>Type:</strong> {selectedCatalogItem.type}</p>
              <p><strong>Description:</strong> {selectedCatalogItem.description || '-'}</p>
              <p>
                <strong>Quantité/Unité:</strong> {Number(selectedCatalogItem.defaultQuantity) || 1} {selectedCatalogItem.unit || '-'}
              </p>
              <p>
                <strong>Prix / TVA:</strong> {Number(selectedCatalogItem.unitPrice) || 0} / {Number(selectedCatalogItem.vatRate) || 0}%
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={chooseSelectedCatalogItem}
                className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400"
              >
                Choisir cet article
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCatalogItemsList(true);
                }}
                className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
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