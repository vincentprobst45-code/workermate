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


type ProjectStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

type ProjectItemType = 'LABOR' | 'MATERIAL' | 'EQUIPMENT' | 'TRAVEL' | 'SERVICE' | 'OTHER';

type AddressMode = 'new' | 'existing' | 'none';
type CustomerMode = 'existing' | 'none';

interface CustomerOption {
  id: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  addressId?: string;
}

interface ProjectItem{
  id: string;
  rowId: string;
  position: number;
  type: ProjectItemType;

  title: string;
  description?: string;
  quantity : number;
  unit?: string;
  unitPrice: number;
  vatRate: number;

  // createdAt: string;
  // updatedAt: string;
}

const projectItemTypeOptions = [
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

function createProjectItemRowId(): string {
  return crypto.randomUUID();
}

type SortableProjectLineProps = {
  projectItem: ProjectItem;
  index: number;
  totalItems: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTitleChange: (value: string) => void;
  onTypeChange: (value: ProjectItemType) => void;
  onDescriptionChange: (value: string) => void;
  onQuantityChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  onUnitPriceChange: (value: number) => void;
  onVatRateChange: (value: number) => void;
  onDelete: () => void;
};

function SortableProjectLine({
  projectItem,
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
  onVatRateChange,
  onDelete,
}: SortableProjectLineProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: projectItem.rowId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-6 mt-6 border-2 flex flex-wrap gap-4 items-center ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
    >
      <div className="flex flex-col gap-2 mr-2">
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
      <label htmlFor='title'>Titre : </label>
      <input name="title"
        className="border px-3 py-2 rounded"
        placeholder="Titre"
        value={projectItem.title}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      <label htmlFor='itemtype'>Type : </label>
      <select name="itemtype"
        className="border px-3 py-2 rounded"
        value={projectItem.type}
        onChange={(e) => onTypeChange(e.target.value as ProjectItemType)}
      >
        {projectItemTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label htmlFor='description'>Description : </label>
      <input name="description"
        className="border px-3 py-2 rounded"
        placeholder="Description"
        value={projectItem.description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
      <label htmlFor='quantity'>Quantité : </label>
      <input type="number" name="quantity"
        className="border px-3 py-2 rounded"
        value={projectItem.quantity}
        onChange={(e) => onQuantityChange(e.target.valueAsNumber)}
      />
      <label htmlFor='unit'>Unité : </label>
      <input name="unit"
        className="border px-3 py-2 rounded"
        placeholder="unité"
        value={projectItem.unit}
        onChange={(e) => onUnitChange(e.target.value)}
      />
      <label htmlFor="unitprice">{`Prix à l'unité : `}</label>
      <input type="number" name="unitprice"
        className="border px-3 py-2 rounded"
        placeholder="Prix à l'unité"
        value={projectItem.unitPrice}
        onChange={(e) => onUnitPriceChange(e.target.valueAsNumber)}
      />
      <label htmlFor="vat">TVA : </label>
      <input type="number" name="vat"
        className="border px-3 py-2 rounded"
        placeholder="Taux de TVA"
        value={projectItem.vatRate}
        onChange={(e) => onVatRateChange(e.target.valueAsNumber)}
      />
      <button type="button"
        className='py-2 px-3 border-2 rounded-md bg-red-300 hover:bg-red-500 active:bg-red-800'
        onClick={onDelete}
      >
        {"Supprimer l'étape"}
      </button>
    </div>
  );
}

export type AddProjectFormData = {
    title: string;
    description: string;

    reference: string;

    startDate: string;
    endDate: string;

    status: ProjectStatus;

    projectItems: ProjectItem[];

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


export function createEmptyProject(): AddProjectFormData {
  return {
    title: '',
    description: '',

    reference: '',

    startDate: '',
    endDate: '',

    status: 'DRAFT',

    projectItems: [],

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

interface Project {
  id: string;
  title: string;
  description?: string;

  reference: string;

  startDate?: string;   
  endDate?: string;     

  status: ProjectStatus;

  projectItems: ProjectItem[];

  customerId? : string;
  addressId? : string;
  createdById? : string;

  // createdAt: string;
}

type AddProjectFormProps = {
  onCreated : (project: Project) => void;
  show : boolean;
};

export default function AddProjectForm({ onCreated, show }: AddProjectFormProps){
    const api = useApiClient();
    const [newProject, setNewProject] = useState<AddProjectFormData>(createEmptyProject());
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
    const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
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

    function createEmptyProjectItem(): ProjectItem {
      return {
        id: '',
        rowId: createProjectItemRowId(),
        position: newProject.projectItems ? newProject.projectItems.length : 0,
        type: 'LABOR',

        title: '',
        description: '',
        quantity: 1,
        unit: 'm2',
        unitPrice: 0,
        vatRate: 20,


        // createdAt : '',
        // updatedAt: '',
      };
    }

    function reorderProjectItems(items: ProjectItem[]): ProjectItem[] {
      return items.map((item, index) => ({
        ...item,
        position: index,
      }));
    }

    function updateProjectItems(updater: (items: ProjectItem[]) => ProjectItem[]) {
      setNewProject((currentProject) => ({
        ...currentProject,
        projectItems: reorderProjectItems(updater(currentProject.projectItems)),
      }));
    }

    function handleProjectItemDragEnd(event: DragEndEvent) {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        return;
      }

      updateProjectItems((items) => {
        const oldIndex = items.findIndex((item) => item.rowId === active.id);
        const newIndex = items.findIndex((item) => item.rowId === over.id);

        if (oldIndex === -1 || newIndex === -1) {
          return items;
        }

        return arrayMove(items, oldIndex, newIndex);
      });
    }

    async function openQuoteSelector() {
      setQuotesError('');
      setShowQuotesList(true);
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

      if (!selectedQuote.items?.length) {
        setQuotesError('Le devis sélectionné ne contient aucune ligne.');
        return;
      }

      setNewProject((currentProject) => {
        const basePosition = currentProject.projectItems.length;
        const importedItems: ProjectItem[] = selectedQuote.items!.map((quoteItem, index) => ({
          id: '',
          rowId: createProjectItemRowId(),
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
          ...currentProject,
          projectItems: [...currentProject.projectItems, ...importedItems],
        };
      });

      setShowQuotesList(false);
      setSelectedQuote(null)
      setQuotesError('');
      setSuccess('Étapes importées depuis le devis.');
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

      setNewProject((currentProject) => {
        const nextPosition = currentProject.projectItems.length;
        const itemToAdd: ProjectItem = {
          id: '',
          rowId: createProjectItemRowId(),
          position: nextPosition,
          type: selectedCatalogItem.type,
          title: selectedCatalogItem.title,
          description: selectedCatalogItem.description ?? '',
          quantity: Number(selectedCatalogItem.defaultQuantity) || 1,
          unit: selectedCatalogItem.unit ?? '',
          unitPrice: Number(selectedCatalogItem.unitPrice) || 0,
          vatRate: Number(selectedCatalogItem.vatRate) || 0,
        };

        return {
          ...currentProject,
          projectItems: [...currentProject.projectItems, itemToAdd],
        };
      });

      setShowCatalogItemsList(false);
      setSelectedCatalogItem(null);
      setCatalogItemsError('');
      setSuccess('Étape importée depuis le catalogue.');
    }

    function handleUseCustomerAddress() {
      if (!newProject.customerId) {
        setAddressError('Veuillez sélectionner un client existant');
        return;
      }

      const selectedCustomer = customerOptions.find((customer) => customer.id === newProject.customerId);
      const customerAddressId = selectedCustomer?.addressId ?? '';

      setNewProject((currentProject) => ({
        ...currentProject,
        customerMode: 'existing',
        customerId: currentProject.customerId,
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

    async function handleAddProject(e: React.FormEvent) {
      e.preventDefault();
      try {
        if (newProject.addressMode === 'existing' && !newProject.addressId) {
          setError('Veuillez sélectionner une adresse existante');
          return;
        }
        // if(newProject.customerMode == 'none'){
        //   setNewProject({...newProject, customerId: undefined})
        // }
        console.log(newProject)
        const res = await api.post('/projects', {
          ...newProject,
          customerId: newProject.customerId || undefined,
        });
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        // setProjects([data, ...projects]);
        onCreated(data);
        setNewProject(createEmptyProject());
        // setAddressMode('new');
      } catch {
        setError('Erreur lors de l\'ajout');
      }
    }

    return(
        <form onSubmit={handleAddProject} className={`mb-8 p-5 bg-white rounded-lg shadow border-2 ${!show && "hidden"}`}>
          <h3 className="font-semibold mb-4">Ajouter un chantier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Titre du chantier"
              value={newProject.title}
              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Description"
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            />
            <input type="datetime-local"
              className="border px-3 py-2 rounded"
              placeholder="Start"
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
              required
            />
            <input type="datetime-local"
              className="border px-3 py-2 rounded"
              placeholder="End"
              value={newProject.endDate}
              onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
              required
            />
          </div>
          <div className='p-6 border-2 m-6'>
            <div className="mb-4 flex flex-wrap gap-3">
              <button type="button" 
                  onClick={() => {
                    updateProjectItems((items) => [
                      ...items,
                      createEmptyProjectItem(),
                    ]);
                  }}
                  className='border-2 bg-blue-200 rounded-md p-2'
              >
                + Ajouter une étape
              </button>
              <button
                type="button"
                onClick={() => {
                  void openQuoteSelector();
                }}
                className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
              >
                Ajouter des étapes à partir d&apos;un devis
              </button>
              <button
                type="button"
                onClick={() => {
                  void openCatalogItemSelector();
                }}
                className="rounded-md border-2 bg-slate-200 p-2 hover:bg-slate-300 active:bg-slate-400"
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

            {!showQuotesList && selectedQuote && (
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
            <div className='m-6'>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectItemDragEnd}>
              <SortableContext
                items={newProject.projectItems.map((item) => item.rowId)}
                strategy={verticalListSortingStrategy}
              >
                {newProject.projectItems.map((projectItem,i) => {
                  return(
                  <SortableProjectLine
                    key={projectItem.rowId}
                    projectItem={projectItem}
                    index={i}
                    totalItems={newProject.projectItems.length}
                    onMoveUp={() =>
                      updateProjectItems((items) => {
                        if (i === 0) {
                          return items;
                        }

                        const nextItems = [...items];
                        [nextItems[i - 1], nextItems[i]] = [nextItems[i], nextItems[i - 1]];
                        return nextItems;
                      })
                    }
                    onMoveDown={() =>
                      updateProjectItems((items) => {
                        if (i === items.length - 1) {
                          return items;
                        }

                        const nextItems = [...items];
                        [nextItems[i], nextItems[i + 1]] = [nextItems[i + 1], nextItems[i]];
                        return nextItems;
                      })
                    }
                    onTitleChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, title: value } : item,
                        ),
                      )
                    }
                    onTypeChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, type: value } : item,
                        ),
                      )
                    }
                    onDescriptionChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, description: value } : item,
                        ),
                      )
                    }
                    onQuantityChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, quantity: value } : item,
                        ),
                      )
                    }
                    onUnitChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, unit: value } : item,
                        ),
                      )
                    }
                    onUnitPriceChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, unitPrice: value } : item,
                        ),
                      )
                    }
                    onVatRateChange={(value) =>
                      updateProjectItems((items) =>
                        items.map((item, index) =>
                          index === i ? { ...item, vatRate: value } : item,
                        ),
                      )
                    }
                    onDelete={() => 
                      updateProjectItems((items) => items.filter((item, index) => index !== i))
                    }
                  />
                )
                })}
              </SortableContext>
            </DndContext>
            </div>
          </div>
          <div className='border-2 rounded-md p-4 m-4'>
            <h3 className="py-2 text-xl font-bold">Associer à un client :</h3>
            {error && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{error}</div>}
            {success && <div className="mb-3 rounded bg-green-100 p-3 text-green-700">{success}</div>}
            <div className="flex flex-wrap gap-2 px-3 pb-3">
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newProject.customerMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setNewProject({ ...newProject, customerMode: 'existing' })}
              >
                Utiliser un client existant
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newProject.customerMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => { 
                  setNewProject({ ...newProject, customerMode: 'none', customerId: '', addressMode: 'none'});
                  setAddressSuccess('')
                }}
              >
                Ne pas ajouter de client
              </button>
            </div>
            {newProject.customerMode === 'existing' ? (
              <div className="px-3 pb-3">
                <label className="mb-2 block text-sm font-medium">Client existant</label>
                <select
                  className="w-full rounded border px-3 py-2"
                  value={newProject.customerId}
                  onChange={(e) => {
                    const customerId = e.target.value;
                    setNewProject((currentProject) => ({ ...currentProject, customerId, addressMode: 'none' }));
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
                className={`border py-2 px-3 rounded ${newProject.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {
                  setNewProject({ ...newProject, addressMode: 'new' });
                  setAddressSuccess('')
                }}
              >
                Nouvelle adresse
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newProject.addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {setNewProject({ ...newProject, addressMode: 'existing' })}}
              >
                Utiliser une adresse existante
              </button>
              <button
                type="button"
                className="rounded border border-slate-300 disabled:bg-slate-100 px-3 py-2 
                    bg-blue-400 hover:bg-blue-600 active:bg-blue-900 text-white disabled:text-black
                    text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={handleUseCustomerAddress}
                disabled={!newProject.customerId}
              >
                Sélectionner l&apos;adresse du client
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newProject.addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {
                  setNewProject({ ...newProject, addressMode: 'none' });
                  setAddressSuccess('')
                }}
              >
                {`Ne pas ajouter d'adresse`}
              </button>
            </div>
            {newProject.addressMode === 'new' ? (
                <AddressForm 
                    address={newProject.address} 
                    onChange={(address) => {setNewProject({ ...newProject, address})}}
                />
            ) : newProject.addressMode === 'existing' ? (
                <SelectExistingAddress 
                    selectedAddressId={newProject.addressId} 
                    onAddressChange={(addressId) => {
                      setNewProject({ ...newProject, addressId});
                      setAddressSuccess('Addresse sélectionnée')
                    }} 
                />
            ) : <span></span>}
          </div>
          <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        </form>
    )
}