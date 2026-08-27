'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { ProtectedRoute } from '../protected-route';
import AddWorkOrderForm from '../components/AddWorkOrderForm';
import WorkOrdersList, { type WorkOrder } from '../components/WorkOrdersList';

// enum WorkOrderStatus {
//   DRAFT,
//   PLANNED,
//   IN_PROGRESS,
//   COMPLETED,
//   CANCELLED,
// }

export function createEmptyWorkOrder(): WorkOrder {
  return {
    id: '',
    title: '',
    description: '',

    reference: '',

    startDate: '',
    endDate: '',

    status: 'DRAFT',

    items: [],
    
    customerId: '',
    addressId: '',
    createdById: '',

    createdAt : '',
  };
}

export default function WorkOrdersPage() {
  const api = useApiClient();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddWorkOrderForm, setShowAddWorkOrderForm] = useState(false)
  const [workOrderFormWasOpened, setWorkOrderFormWasOpened] = useState(false)
  // const [newWorkOrder, setNewWorkOrder] = useState<WorkOrder>(createEmptyWorkOrder());
  // const [addressMode, setAddressMode] = useState<AddressMode>('new');
  // const [selectedAddressId, setSelectedAddressId] = useState('');
  // const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
  //   , postalCode: '', city: '', region: '', countryCode: ''
  //   , latitude: '', longitude: ''
  //   , accessCode: '', floor: '', apartment: '', note: ''
  //  });
  //  const [workOrderItems, setWorkOrderItems] = useState<WorkOrderItem[]>([])

   
  // function createEmptyWorkOrderItem(): WorkOrderItem {
  //   return {
  //     id: '',
  //     position: workOrderItems.length,
  //     type: 'LABOR',

  //     title: '',
  //     description: '',
  //     quantity: 1,
  //     unit: 'm2',
  //     unitPrice: 0,
  //     vatRate: 20,


  //     // createdAt : '',
  //     // updatedAt: '',
  //   };
  // }

  useEffect(() => {
    let cancelled = false;

    async function loadWorkOrders() {
      try {
        const res = await api.get('/workOrders');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (!cancelled) {
          setWorkOrders(data.map((workOrder: WorkOrder) => ({
            ...workOrder,
            startDate: workOrder.startDate ?? workOrder.plannedStartDate,
            endDate: workOrder.endDate ?? workOrder.plannedEndDate,
          })));
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des chantiers');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadWorkOrders();

    return () => {
      cancelled = true;
    };
  }, [api]);
  
  console.log(workOrders)

  // async function handleAddWorkOrder(e: React.FormEvent) {
  //   e.preventDefault();
  //   try {

  //     let workOrderToAdd = addressMode === 'new' ? { ...newWorkOrder, address: newAddress }
  //                         : addressMode === 'existing' ? { ...newWorkOrder, addressId: selectedAddressId }
  //                         : {...newWorkOrder }
  //     workOrderToAdd = workOrderItems.length > 0 ? {...workOrderToAdd, workOrderItems: workOrderItems} : workOrderToAdd
  //     // setNewWorkOrder({...newWorkOrder, workOrderItems:workOrderItems})
  //     const res = await api.post('/workOrders', workOrderToAdd);
  //     if (!res.ok) throw new Error('Erreur');
  //     const data = await res.json();
  //     setWorkOrders([data, ...workOrders]);
  //     setNewWorkOrder(createEmptyWorkOrder());
  //     setAddressMode('new');
  //   } catch {
  //     setError('Erreur lors de l\'ajout');
  //   }
  // }

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/workOrders/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setWorkOrders(workOrders.filter((p) => p.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6">Gestion des Chantiers</h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <button
          className='border-double border-gray-700 border-2 shadow-md text-xl text-white 
                    rounded-sm mx-4 my-2 py-2 px-3 bg-blue-400 
                    hover:bg-blue-600 active:bg-blue-900' 
          onClick={() => {setShowAddWorkOrderForm(!showAddWorkOrderForm);setWorkOrderFormWasOpened(true);}}>
            {showAddWorkOrderForm ? ("Fermer") : workOrderFormWasOpened ? ("Ouvrir") : ("Ajouter un chantier")}
        </button>
        {workOrderFormWasOpened &&
        <button
          className='border-double border-gray-700 border-2 shadow-md text-xl text-white 
                    rounded-sm mx-4 my-2 py-2 px-3 float-right bg-red-400
                    hover:bg-red-600 active:bg-red-900' 
          onClick={() => {setShowAddWorkOrderForm(false);setWorkOrderFormWasOpened(false);}}>
            Effacer le formulaire
        </button>
        }
        {workOrderFormWasOpened &&
        <AddWorkOrderForm show={showAddWorkOrderForm} onCreated={(data)=> {setWorkOrders((currentWorkOrders) => [{
          ...data,
          startDate: data.startDate ?? data.plannedStartDate,
          endDate: data.endDate ?? data.plannedEndDate,
        }, ...currentWorkOrders])}} />
        }
        {/* <form onSubmit={handleAddWorkOrder} className="mb-8 p-5 bg-white rounded-lg shadow border-2">
          <h3 className="font-semibold mb-4">Ajouter un chantier</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Titre du chantier"
              value={newWorkOrder.title}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, title: e.target.value })}
              required
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Description"
              value={newWorkOrder.description}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })}
            />
            <input type="datetime-local"
              className="border px-3 py-2 rounded"
              placeholder="Start"
              value={newWorkOrder.startDate}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, startDate: e.target.value })}
              required
            />
            <input type="datetime-local"
              className="border px-3 py-2 rounded"
              placeholder="End"
              value={newWorkOrder.endDate}
              onChange={(e) => setNewWorkOrder({ ...newWorkOrder, endDate: e.target.value })}
              required
            />
          </div>
          <div className='p-6 border-2 m-6'>
            <button type="button" onClick={() => {setWorkOrderItems([...workOrderItems, createEmptyWorkOrderItem()])}}
                    className='border-2 bg-blue-200 rounded-md p-2'
            >
              + Ajouter une étape
            </button>
            <div className='m-6'>
            {workOrderItems.map((workOrderItem,i) => {
              return(
              <div key={i} className='p-6 mt-6 border-2 flex flex-wrap gap-4 items-center'>
                <label htmlFor='title'>Titre : </label>
                <input name="title"
                  className="border px-3 py-2 rounded"
                  placeholder="Titre"
                  value={workOrderItem.title}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, title: e.target.value }
                          : item
                      )
                    );
                  }}
                />
                <label htmlFor='itemtype'>Type : </label>
                <select name="itemtype"
                  className="border px-3 py-2 rounded"
                  value={workOrderItem.type}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, type: e.target.value as WorkOrderItemType }
                          : item
                      )
                    );
                  }}
                >
                  {workOrderItemTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <label htmlFor='description'>Description : </label>
                <input name="description"
                  className="border px-3 py-2 rounded"
                  placeholder="Description"
                  value={workOrderItem.description}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, description: e.target.value }
                          : item
                      )
                    );
                  }}
                />
                <label htmlFor='quantity'>Quantité : </label>
                <input type="number" name="quantity"
                  className="border px-3 py-2 rounded"
                  value={workOrderItem.quantity}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, quantity: e.target.valueAsNumber }
                          : item
                      )
                    );
                  }}
                />
                <label htmlFor='unit'>Unité : </label>
                <input name="unit"
                  className="border px-3 py-2 rounded"
                  placeholder="unité"
                  value={workOrderItem.unit}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, unit: e.target.value }
                          : item
                      )
                    );
                  }}
                />
                <label htmlFor="unitprice">{`Prix à l'unité : `}</label>
                <input type="number" name="unitprice"
                  className="border px-3 py-2 rounded"
                  placeholder="Prix à l'unité"
                  value={workOrderItem.unitPrice}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, unitPrice: e.target.valueAsNumber }
                          : item
                      )
                    );
                  }}
                />
                <label htmlFor="vat">TVA : </label>
                <input type="number" name="vat"
                  className="border px-3 py-2 rounded"
                  placeholder="Taux de TVA"
                  value={workOrderItem.vatRate}
                  onChange={(e) => {
                    setWorkOrderItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, vatRate: e.target.valueAsNumber }
                          : item
                      )
                    );
                  }}
                />
                <button type="button"
                  className='py-2 px-3 border-2 rounded-md bg-red-300 hover:bg-red-500 active:bg-red-800'
                  onClick={() => setWorkOrderItems((currentItems) => {
                    const filtered = currentItems.filter((item, index) => 
                       index !== i 
                    )
                    return filtered
                })
                }
                > 
                  {"Supprimer l'étape"}
                </button>
              </div>
            )
            })}
            </div>
          </div>
          <div className='border-2 rounded-md p-4 m-4'>
            <h3 className="py-2 text-xl font-bold">Associer à une adresse :</h3>
            <div className="flex gap-2 px-3 pb-3">
              <button
                type="button"
                className={`border py-2 px-3 rounded ${addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setAddressMode('new')}
              >
                Nouvelle adresse
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setAddressMode('existing')}
              >
                Utiliser une adresse existante
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => setAddressMode('none')}
              >
                {`Ne pas ajouter d'adresse`}
              </button>
            </div>
            {addressMode === 'new' ? (
              <AddressForm address={newAddress} onChange={setNewAddress} />
            ) : addressMode === 'existing' ? (
              <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />
            ) : <span></span>}
          </div>
          <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        </form> */}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <WorkOrdersList workOrders={workOrders} onDelete={handleDelete} />
        )}
      </main>
    </ProtectedRoute>
  );
}
