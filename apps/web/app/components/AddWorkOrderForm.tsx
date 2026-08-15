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
import { useEffect, useState } from "react";
import SelectExistingAddress from "./SelectExistingAddress";
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';
import { useApiClient } from "../api-client";
import QuotesList, { type Quote } from './QuotesList';
import NewQuote from './NewQuote';
import CatalogItemList, { type CatalogItem } from './CatalogItemList';


type WorkOrderStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

type WorkOrderItemType = 'LABOR' | 'MATERIAL' | 'EQUIPMENT' | 'TRAVEL' | 'SERVICE' | 'OTHER';

type AddressMode = 'new' | 'existing' | 'none';
type CustomerMode = 'existing' | 'none';
type QuoteSelectionMode = 'fillForm' | 'addLines';

interface CustomerOption {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressId?: string;
}

interface WorkOrderItem{
  id: string;
  rowId: string;
  position: number;
  type: WorkOrderItemType;

  title: string;
  description?: string;
  quantity : number;
  unit?: string;
  unitPrice: number;
  unitCost?: number;
  purchaseVatRate?: number;
  vatRate: number;

  // createdAt: string;
  // updatedAt: string;
}

const workOrderItemTypeOptions = [
  {
    value: 'LABOR',
    label: 'Travaux',
  },
  {
    value: 'MATERIAL',
    label: 'Matériel',
  },
  {
    value: 'EQUIPMENT',
    label: 'Équipement',
  },
  {
    value: 'TRAVEL',
    label: 'Déplacement',
  },
  {
    value: 'SERVICE',
    label: 'Service',
  },
  {
    value: 'OTHER',
    label: 'Autre',
  },
];

function createWorkOrderItemRowId(): string {
  return crypto.randomUUID();
}

function toDatetimeLocal(value?: string): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

type SortableWorkOrderLineProps = {
  workOrderItem: WorkOrderItem;
  index: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: WorkOrderItemType) => void;
  onDescriptionChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  onUnitPriceChange: (value: number) => void;
  onUnitCostChange: (value: number) => void;
  onPurchaseVatRateChange: (value: number) => void;
  onVatRateChange: (value: number) => void;
  onDelete: () => void;
};

function SortableWorkOrderLine({
  workOrderItem,
  index,
  totalItems,
  onMoveUp,
  onMoveDown,
  onTitleChange,
  onTypeChange,
  onDescriptionChange,
  onQuantityChange,
  onUnitChange,
  onUnitPriceChange,
  onUnitCostChange,
  onPurchaseVatRateChange,
  onVatRateChange,
  onDelete,
}: SortableWorkOrderLineProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: workOrderItem.rowId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mt-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
    >
      <div className="flex gap-3">
      <div className="mr-1 flex flex-col gap-2">
        <button
          type="button"
          className="cursor-grab rounded border px-2 py-1 text-sm active:cursor-grabbing"
          aria-label="Glisser l'etape"
          title="Glisser l'etape"
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
          aria-label="Monter l'etape"
          title="Monter l'etape"
        >
          ↑
        </button>
        <button
          type="button"
          className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          onClick={onMoveDown}
          disabled={index === totalItems - 1}
          aria-label="Descendre l'etape"
          title="Descendre l'etape"
        >
          ↓
        </button>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Titre</span>
          <input
            name="title"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Titre"
            value={workOrderItem.title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Type</span>
          <select
            name="itemtype"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={workOrderItem.type}
            onChange={(e) => onTypeChange(e.target.value as WorkOrderItemType)}
          >
            {workOrderItemTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Description</span>
          <input
            name="description"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Description"
            value={workOrderItem.description}
            onChange={(e) => onDescriptionChange(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Quantité</span>
          <input
            type="number"
            name="quantity"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            value={workOrderItem.quantity}
            onChange={(e) => onQuantityChange(e.target.valueAsNumber)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Unité</span>
          <input
            name="unit"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Unité"
            value={workOrderItem.unit}
            onChange={(e) => onUnitChange(e.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Prix unitaire</span>
          <input
            type="number"
            name="unitprice"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Prix unitaire"
            value={workOrderItem.unitPrice}
            onChange={(e) => onUnitPriceChange(e.target.valueAsNumber)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">Coût d&apos;achat unitaire</span>
          <input
            type="number"
            name="unitcost"
            min="0"
            step="0.01"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Coût d'achat unitaire"
            value={workOrderItem.unitCost ?? ''}
            onChange={(e) => onUnitCostChange(e.target.valueAsNumber)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">TVA achat (%)</span>
          <input
            type="number"
            name="purchasevat"
            min="0"
            step="0.01"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="TVA achat"
            value={workOrderItem.purchaseVatRate ?? ''}
            onChange={(e) => onPurchaseVatRateChange(e.target.valueAsNumber)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-600">TVA (%)</span>
          <input
            type="number"
            name="vat"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Taux de TVA"
            value={workOrderItem.vatRate}
            onChange={(e) => onVatRateChange(e.target.valueAsNumber)}
          />
        </label>
        <div className="flex items-end">
          <button
            type="button"
            className="w-full rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700 transition hover:bg-red-200"
            onClick={onDelete}
          >
            Supprimer l&apos;étape
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}

export type AddWorkOrderFormData = {
    title: string;
    description: string;

    reference: string;

    startDate: string;
    endDate: string;

    status: WorkOrderStatus;

    items: WorkOrderItem[];

    notes: string;

    customerMode: CustomerMode;
    customerId?: string;
    addressMode: AddressMode;
    addressId: string;
    address: AddAddressFormData;

//   customerId? : string;
//   addressId? : string;
//   createdById? : string;
};


export function createEmptyWorkOrder(): AddWorkOrderFormData {
  return {
    title: '',
    description: '',

    reference: '',

    startDate: '',
    endDate: '',

    status: 'DRAFT',

    items: [],

    notes: '',
    
    customerMode: 'none',
    customerId: '',
    addressMode: 'none',
    addressId: '',
    address: createEmptyAddress(),

    // customerId: '',
    // addressId: '',
    // createdById: '',

    // createdAt : '',
  };
}

export interface WorkOrder {
  id: string;
  title: string;
  description?: string;

  reference: string;

  startDate?: string;   
  endDate?: string;     

  status: WorkOrderStatus;

  items: WorkOrderItem[];

  customerId? : string;
  addressId? : string;
  createdById? : string;

  // createdAt: string;
}

export type WorkOrderEditInput = Omit<WorkOrder, 'items'> & {
  items: Array<Omit<WorkOrderItem, 'rowId'> & { rowId?: string }>;
};

type AddWorkOrderFormProps = {
  onCreated : (workOrder: WorkOrder) => void;
  onUpdated?: (workOrder: WorkOrder) => void;
  initialWorkOrder?: WorkOrderEditInput;
  show : boolean;
};

export default function AddWorkOrderForm({ onCreated, onUpdated, initialWorkOrder, show }: AddWorkOrderFormProps){
    const api = useApiClient();
    const [newWorkOrder, setNewWorkOrder] = useState<AddWorkOrderFormData>(() => {
      if (!initialWorkOrder) {
        return createEmptyWorkOrder();
      }

      return {
        ...createEmptyWorkOrder(),
        title: initialWorkOrder.title,
        description: initialWorkOrder.description ?? '',
        reference: initialWorkOrder.reference,
        startDate: toDatetimeLocal(initialWorkOrder.startDate),
        endDate: toDatetimeLocal(initialWorkOrder.endDate),
        status: initialWorkOrder.status,
        customerMode: initialWorkOrder.customerId ? 'existing' : 'none',
        customerId: initialWorkOrder.customerId ?? '',
        addressMode: initialWorkOrder.addressId ? 'existing' : 'none',
        addressId: initialWorkOrder.addressId ?? '',
        items: initialWorkOrder.items.map((item, index) => ({
          ...item,
          rowId: item.rowId ?? createWorkOrderItemRowId(),
          position: index,
          description: item.description ?? '',
          unit: item.unit ?? '',
        })),
      };
    });
    const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [addressError, setAddressError] = useState('');
    const [addressSuccess, setAddressSuccess] = useState('');
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [quotesLoading, setQuotesLoading] = useState(false);
    const [quotesError, setQuotesError] = useState('');
    const [showQuotesList, setShowQuotesList] = useState(false);
    const [showQuotesListTop, setShowQuotesListTop] = useState(false);
    const [doubleCheckShowQuotesListTop, setDoubleCheckShowQuotesListTop] = useState(false);
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
    const [quoteSelectionMode, setQuoteSelectionMode] = useState<QuoteSelectionMode>('addLines');
    const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
    const [catalogItemsLoading, setCatalogItemsLoading] = useState(false);
    const [catalogItemsError, setCatalogItemsError] = useState('');
    const [showCatalogItemsList, setShowCatalogItemsList] = useState(false);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
    const sensors = useSensors(useSensor(PointerSensor));

    useEffect(() => {
      let cancelled = false;

      async function loadCustomers() {
        setCustomersLoading(true);
        try {
          const res = await api.get('/customers');
          if (!res.ok) throw new Error('Erreur');
          const data: CustomerOption[] = await res.json();
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

    function createEmptyWorkOrderItem(): WorkOrderItem {
      return {
        id: '',
        rowId: createWorkOrderItemRowId(),
        position: newWorkOrder.items ? newWorkOrder.items.length : 0,
        type: 'LABOR',

        title: '',
        description: '',
        quantity: 1,
        unit: 'm2',
        unitPrice: 0,
        unitCost: undefined,
        purchaseVatRate: undefined,
        vatRate: 20,


        // createdAt : '',
        // updatedAt: '',
      };
    }

    function reorderWorkOrderItems(items: WorkOrderItem[]): WorkOrderItem[] {
      return items.map((item, index) => ({
        ...item,
        position: index,
      }));
    }

    function updateWorkOrderItems(updater: (items: WorkOrderItem[]) => WorkOrderItem[]) {
      setNewWorkOrder((currentWorkOrder) => ({
        ...currentWorkOrder,
        items: reorderWorkOrderItems(updater(currentWorkOrder.items)),
      }));
    }

    function handleWorkOrderItemDragEnd(event: DragEndEvent) {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      updateWorkOrderItems((items) => {
        const oldIndex = items.findIndex((item) => item.rowId === active.id);
        const newIndex = items.findIndex((item) => item.rowId === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    async function openQuoteSelector(mode: QuoteSelectionMode) {
      setQuoteSelectionMode(mode);
      setQuotesError('');
      setShowQuotesList(false);
      setShowQuotesListTop(false);
      if (mode === 'addLines') {
        setDoubleCheckShowQuotesListTop(false);
        setShowQuotesList(true);
      } else {
        setDoubleCheckShowQuotesListTop(true);
        setShowQuotesListTop(true);
      }
      setShowCatalogItemsList(false);
      setSelectedQuote(null);
      setQuotesLoading(true);

      try {
        const response = await api.get('/quotes');
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const data: Quote[] = await response.json();
        setQuotes(data);
      } catch {
        setQuotes([]);
        setQuotesError('Erreur lors de la récupération des devis');
      } finally {
        setQuotesLoading(false);
      }
    }

    function chooseSelectedQuote() {
      if (!selectedQuote) {
        return;
      }

      if (!selectedQuote.items.length) {
        setQuotesError('Le devis sélectionné ne contient aucune ligne.');
        return;
      }

      if (quoteSelectionMode === 'fillForm') {
        const selectedCustomer = customerOptions.find(
          (customer) => customer.id === selectedQuote.customerId,
        );
        const selectedCustomerAddressId = selectedCustomer?.addressId ?? '';
        const filledItems: WorkOrderItem[] = selectedQuote.items.map((quoteItem, index) => ({
          id: '',
          rowId: createWorkOrderItemRowId(),
          position: index,
          type: 'SERVICE',
          title: quoteItem.title,
          description: quoteItem.description,
          quantity: quoteItem.quantity,
          unit: quoteItem.unit ?? '',
          unitPrice: quoteItem.unitPrice,
          vatRate: quoteItem.vatRate,
        }));

        setNewWorkOrder((currentWorkOrder) => ({
          ...currentWorkOrder,
          title: selectedQuote.workOrderTitle || selectedQuote.title || '',
          description: selectedQuote.notes || '',
          reference: selectedQuote.workOrderReference || selectedQuote.number || '',
          startDate: toDatetimeLocal(selectedQuote.workOrderStartDate),
          endDate: toDatetimeLocal(selectedQuote.workOrderEndDate),
          customerMode: selectedQuote.customerId ? 'existing' : currentWorkOrder.customerMode,
          customerId: selectedQuote.customerId || '',
          addressMode: selectedCustomerAddressId ? 'existing' : 'none',
          addressId: selectedCustomerAddressId,
          items: filledItems,
        }));

        setSuccess('Formulaire rempli depuis le devis.');
      } else {
        setNewWorkOrder((currentWorkOrder) => {
          const basePosition = currentWorkOrder.items.length;
          const importedItems: WorkOrderItem[] = selectedQuote.items.map((quoteItem, index) => ({
            id: '',
            rowId: createWorkOrderItemRowId(),
            position: basePosition + index,
            type: 'SERVICE',
            title: quoteItem.title,
            description: quoteItem.description,
            quantity: quoteItem.quantity,
            unit: quoteItem.unit ?? '',
            unitPrice: quoteItem.unitPrice,
            vatRate: quoteItem.vatRate,
          }));

          return {
            ...currentWorkOrder,
            items: [...currentWorkOrder.items, ...importedItems],
          };
        });

        setSuccess('Étapes importées depuis le devis.');
      }

      setShowQuotesList(false);
      setShowQuotesListTop(false);
      setSelectedQuote(null);
      setQuotesError('');
    }

    async function openCatalogItemSelector() {
      setCatalogItemsError('');
      setShowCatalogItemsList(true);
      setShowQuotesList(false);
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

      setNewWorkOrder((currentWorkOrder) => {
        const nextPosition = currentWorkOrder.items.length;
        const itemToAdd: WorkOrderItem = {
          id: '',
          rowId: createWorkOrderItemRowId(),
          position: nextPosition,
          type: selectedCatalogItem.type,
          title: selectedCatalogItem.title,
          description: selectedCatalogItem.description ?? '',
          quantity: Number(selectedCatalogItem.defaultQuantity) || 1,
          unit: selectedCatalogItem.unit ?? '',
          unitPrice: Number(selectedCatalogItem.unitPrice) || 0,
          unitCost: selectedCatalogItem.unitCost === undefined || selectedCatalogItem.unitCost === null
            ? undefined
            : Number(selectedCatalogItem.unitCost),
          purchaseVatRate:
            selectedCatalogItem.purchaseVatRate === undefined || selectedCatalogItem.purchaseVatRate === null
              ? undefined
              : Number(selectedCatalogItem.purchaseVatRate),
          vatRate: Number(selectedCatalogItem.vatRate) || 0,
        };

        return {
          ...currentWorkOrder,
          items: [...currentWorkOrder.items, itemToAdd],
        };
      });

      setShowCatalogItemsList(false);
      setSelectedCatalogItem(null);
      setCatalogItemsError('');
      setSuccess('Étape importée depuis le catalogue.');
    }

    function handleUseCustomerAddress() {
      if (!newWorkOrder.customerId) {
        setAddressError('Veuillez sélectionner un client existant');
        return;
      }

      const selectedCustomer = customerOptions.find((customer) => customer.id === newWorkOrder.customerId);
      const customerAddressId = selectedCustomer?.addressId ?? '';

      setNewWorkOrder((currentWorkOrder) => ({
        ...currentWorkOrder,
        customerMode: 'existing',
        customerId: currentWorkOrder.customerId,
        addressMode: customerAddressId ? 'existing' : 'none',
        addressId: customerAddressId,
      }));

      if (!customerAddressId) {
        setAddressError('Ce client n\'a pas d\'adresse enregistrée');
        setAddressSuccess('')
      } else {
        setAddressError('');
        setAddressSuccess("Addresse du client sélectionnée")
      }
    }

    async function handleAddWorkOrder(e: React.FormEvent) {
      e.preventDefault();
      try {
        if (newWorkOrder.addressMode === 'existing' && !newWorkOrder.addressId) {
          setError('Veuillez sélectionner une adresse existante');
          return;
        }
        // if(newWorkOrder.customerMode == 'none'){
        //   setNewWorkOrder({...newWorkOrder, customerId: undefined})
        // }
        const payload = {
          reference: newWorkOrder.reference,
          title: newWorkOrder.title,
          description: newWorkOrder.description || undefined,
          status: newWorkOrder.status,
          startDate: newWorkOrder.startDate || undefined,
          endDate: newWorkOrder.endDate || undefined,
          customerId: newWorkOrder.customerId || undefined,
          addressId: newWorkOrder.addressId || undefined,
          notes: newWorkOrder.notes || undefined,
          items: newWorkOrder.items.map((item) => ({
            position: item.position,
            type: item.type,
            title: item.title,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            purchaseVatRate: item.purchaseVatRate,
            vatRate: item.vatRate,
          })),
        };
        const res = initialWorkOrder
          ? await api.put(`/workOrders/${initialWorkOrder.id}`, payload)
          : await api.post('/workOrders', payload);
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (initialWorkOrder) {
          onUpdated?.(data);
        } else {
          onCreated(data);
        }
        setNewWorkOrder(createEmptyWorkOrder());
        // setAddressMode('new');
      } catch {
        setError('Erreur lors de l\'ajout');
      }
    }


    return(
        <form onSubmit={handleAddWorkOrder} className={`mb-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ${!show && "hidden"}`}>
          <h3 className="text-lg font-semibold text-zinc-900">
            {initialWorkOrder ? 'Modifier un chantier' : 'Ajouter un chantier'}
          </h3>
          <div>
            <button
              type="button"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
              onClick={() => {
                void openQuoteSelector('fillForm');
              }}
            >
              Remplir les champs à partir d&apos;un devis existant
            </button>
          </div>

          {showQuotesListTop && (
            <div className="rounded-md border-2 p-4">
              <div className="mb-3 flex items-center gap-2">
                <h4 className="text-lg font-semibold">Sélectionner un devis</h4>
                <button
                  type="button"
                  className="ml-auto rounded border px-3 py-2"
                  onClick={() => setShowQuotesListTop(false)}
                >
                  Fermer la liste
                </button>
              </div>
              {quotesLoading ? (
                <p>Chargement des devis...</p>
              ) : (
                <QuotesList
                  quotes={quotes}
                  onDelete={null}
                  handleSelectedQuote={(quote) => {
                    setSelectedQuote(quote);
                    setShowQuotesListTop(false);
                    setQuotesError('');
                  }}
                />
              )}
            </div>
          )}

          {!showQuotesListTop && doubleCheckShowQuotesListTop && selectedQuote && (
            <div className="rounded-md border-2 p-4">
              <h4 className="mb-3 text-lg font-semibold">Devis sélectionné</h4>
              <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
                <p><strong>Titre:</strong> {selectedQuote.title}</p>
                <p><strong>Référence:</strong> {selectedQuote.workOrderReference || selectedQuote.number || '-'}</p>
                <p><strong>Chantier:</strong> {selectedQuote.workOrderTitle || '-'}</p>
                <p><strong>Nombre de lignes:</strong> {selectedQuote.items.length || 0}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={chooseSelectedQuote}
                  className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400"
                >
                  Remplir le chantier avec ce devis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuotesListTop(true);
                  }}
                  className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
                >
                  Choisir un autre devis
                </button>
              </div>
            </div>
          )}

          <section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Informations générales</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Titre du chantier</span>
                <input
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="Titre du chantier"
                  value={newWorkOrder.title}
                  onChange={(e) => setNewWorkOrder({ ...newWorkOrder, title: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Description</span>
                <input
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="Description"
                  value={newWorkOrder.description}
                  onChange={(e) => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Début</span>
                <input type="datetime-local"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="Start"
                  value={newWorkOrder.startDate}
                  onChange={(e) => setNewWorkOrder({ ...newWorkOrder, startDate: e.target.value })}
                  required
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-zinc-700">Fin</span>
                <input type="datetime-local"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
                  placeholder="End"
                  value={newWorkOrder.endDate}
                  onChange={(e) => setNewWorkOrder({ ...newWorkOrder, endDate: e.target.value })}
                  required
                />
              </label>
            </div>
          </section>
          <section className='rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5'>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Étapes du chantier</h4>
            <div className="mb-4 flex flex-wrap gap-3">
              <button type="button" 
                  onClick={() => {
                    updateWorkOrderItems((items) => [
                      ...items,
                      createEmptyWorkOrderItem(),
                    ]);
                  }}
                  className='rounded-md border border-blue-300 bg-blue-100 px-3 py-2 text-sm text-blue-900 transition hover:bg-blue-200'
              >
                + Ajouter une étape
              </button>
              <button
                type="button"
                onClick={() => {
                  void openQuoteSelector('addLines');
                }}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
              >
                Ajouter des étapes à partir d&apos;un devis
              </button>
              <button
                type="button"
                onClick={() => {
                  void openCatalogItemSelector();
                }}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
              >
                Ajouter une étape à partir du catalogue
              </button>
            </div>

            {quotesError && (
              <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{quotesError}</div>
            )}
            {catalogItemsError && (
              <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{catalogItemsError}</div>
            )}

            {showQuotesList && (
              <div className="mb-4 rounded-md border-2 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <h4 className="text-lg font-semibold">Sélectionner un devis</h4>
                  <button
                    type="button"
                    className="ml-auto rounded border px-3 py-2"
                    onClick={() => setShowQuotesList(false)}
                  >
                    Fermer la liste
                  </button>
                </div>
                {quotesLoading ? (
                  <p>Chargement des devis...</p>
                ) : (
                  <QuotesList
                    quotes={quotes}
                    onDelete={null}
                    handleSelectedQuote={(quote) => {
                      setSelectedQuote(quote);
                      setShowQuotesList(false);
                      setQuotesError('');
                    }}
                  />
                )}
              </div>
            )}

            {!showQuotesList && !doubleCheckShowQuotesListTop && selectedQuote && (
              <div className="mb-4 rounded-md border-2 p-4">
                <h4 className="mb-3 text-lg font-semibold">Devis sélectionné</h4>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={chooseSelectedQuote}
                    className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400"
                  >
                    Choisir ce devis
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuotesList(true);
                    }}
                    className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
                  >
                    Choisir un autre devis
                  </button>
                </div>
                <NewQuote quote={selectedQuote} />
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
            <div className='mt-4'>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleWorkOrderItemDragEnd}>
              <SortableContext
                items={newWorkOrder.items.map((item) => item.rowId)}
                strategy={verticalListSortingStrategy}
              >
                {newWorkOrder.items.map((workOrderItem,i) => {
                  return(
                  <SortableWorkOrderLine
                    key={workOrderItem.rowId}
                    workOrderItem={workOrderItem}
                    index={i}
                    totalItems={newWorkOrder.items.length}
                    onMoveUp={() =>
                      updateWorkOrderItems((items) => {
                        if (i === 0) {
                          return items;
                        }

                        const nextItems = [...items];
                        [nextItems[i - 1], nextItems[i]] = [nextItems[i], nextItems[i - 1]];
                        return nextItems;
                      })
                    }
                    onMoveDown={() =>
                      updateWorkOrderItems((items) => {
                        if (i === items.length - 1) {
                          return items;
                        }

                        const nextItems = [...items];
                        [nextItems[i], nextItems[i + 1]] = [nextItems[i + 1], nextItems[i]];
                        return nextItems;
                      })
                    }
                    onTitleChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, title: value } : item,
                        ),
                      )
                    }
                    onTypeChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, type: value } : item,
                        ),
                      )
                    }
                    onDescriptionChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, description: value } : item,
                        ),
                      )
                    }
                    onQuantityChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, quantity: value } : item,
                        ),
                      )
                    }
                    onUnitChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, unit: value } : item,
                        ),
                      )
                    }
                    onUnitPriceChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, unitPrice: value } : item,
                        ),
                      )
                    }
                    onUnitCostChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i
                            ? { ...item, unitCost: Number.isNaN(value) ? undefined : value }
                            : item,
                        ),
                      )
                    }
                    onPurchaseVatRateChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i
                            ? { ...item, purchaseVatRate: Number.isNaN(value) ? undefined : value }
                            : item,
                        ),
                      )
                    }
                    onVatRateChange={(value) =>
                      updateWorkOrderItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, vatRate: value } : item,
                        ),
                      )
                    }
                    onDelete={() => 
                      updateWorkOrderItems((items) => items.filter((item, index) => index !== i))
                    }
                  />
                )
                })}
              </SortableContext>
            </DndContext>
            </div>
          </section>
          <section className='rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5'>
            <h3 className="py-2 text-xl font-bold">Associer à un client :</h3>
            {error && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{error}</div>}
            {success && <div className="mb-3 rounded bg-green-100 p-3 text-green-700">{success}</div>}
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newWorkOrder.customerMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setNewWorkOrder({ ...newWorkOrder, customerMode: 'existing' })}
              >
                Utiliser un client existant
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newWorkOrder.customerMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => { 
                  setNewWorkOrder({ ...newWorkOrder, customerMode: 'none', customerId: '', addressMode: 'none'});
                  setAddressSuccess('')
                }}
              >
                Ne pas ajouter de client
              </button>
            </div>
            {newWorkOrder.customerMode === 'existing' ? (
              <div className="px-3 pb-3">
                <label className="mb-2 block text-sm font-medium">Client existant</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={newWorkOrder.customerId}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    setNewWorkOrder((currentWorkOrder) => ({ ...currentWorkOrder, customerId, addressMode: 'none' }));
                    setAddressError('');
                    setAddressSuccess('');
                  }}
                >
                  <option value="">-- Veuillez choisir un client --</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {[customer.firstName, customer.lastName, customer.company].filter(Boolean).join(' ') || customer.id}
                    </option>
                  ))}
                </select>
                {customersLoading ? (
                  <p className="mt-2 text-sm text-slate-500">Chargement des clients...</p>
                ) : customerOptions.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Aucun client disponible pour le moment.</p>
                ) : null}
              </div>
            ) : null}
            <h3 className="py-2 text-xl font-bold">Associer à une adresse :</h3>
            {addressError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{addressError}</div>}
            {addressSuccess && <div className="mb-3 rounded bg-green-100 p-3 text-green-700">{addressSuccess}</div>}
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newWorkOrder.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {
                  setNewWorkOrder({ ...newWorkOrder, addressMode: 'new' });
                  setAddressSuccess('')
                }}
              >
                Nouvelle adresse
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newWorkOrder.addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {setNewWorkOrder({ ...newWorkOrder, addressMode: 'existing' })}}
              >
                Utiliser une adresse existante
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 disabled:bg-slate-100 px-3 py-2 
                    bg-blue-400 hover:bg-blue-600 active:bg-blue-900 text-white disabled:text-black
                    text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleUseCustomerAddress}
                disabled={!newWorkOrder.customerId}
              >
                Sélectionner l&apos;adresse du client
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newWorkOrder.addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {
                  setNewWorkOrder({ ...newWorkOrder, addressMode: 'none' });
                  setAddressSuccess('')
                }}
              >
                {`Ne pas ajouter d'adresse`}
              </button>
            </div>
            {newWorkOrder.addressMode === 'new' ? (
                <AddressForm 
                    address={newWorkOrder.address} 
                    onChange={(address) => {setNewWorkOrder({ ...newWorkOrder, address})}}
                />
            ) : newWorkOrder.addressMode === 'existing' ? (
                <SelectExistingAddress 
                    selectedAddressId={newWorkOrder.addressId} 
                    onAddressChange={(addressId) => {
                      setNewWorkOrder({ ...newWorkOrder, addressId});
                      setAddressSuccess('Addresse sélectionnée')
                    }} 
                />
            ) : <span></span>}
          </section>
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
            {initialWorkOrder ? 'Modifier' : 'Ajouter'}
          </button>
        </form>
    )
}