import { useEffect, useState } from "react";
import SelectExistingAddress from "./SelectExistingAddress";
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';
import { useApiClient } from "../api-client";
import AddWorkOrderForm from './AddWorkOrderForm';

type AddressMode = 'new' | 'existing' | 'none';
type AssociationMode = 'new' | 'existing' | 'none';

export type AddCalendarEventFormData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;

  color: string;
  notes: string;

  addressId: string;
  address: AddAddressFormData;

  // customerId: '',
  // workOrderId: '',
  // createdById: '',
};

// type AddCalendarEventFormProps = {
//   calendarEvent: AddCalendarEventFormData;
//   onChange: (calendarEvent: AddCalendarEventFormData) => void;
// };

interface WorkOrder {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;

  color?: string;
  description?: string;
  notes?:string;
  
  customerId?: string;
  customerName?: string;
  workOrderId?: string;
  workOrderName?: string;
  addressId?: string;
  addressName?: string;
  createdById?: string;
  createdByName?: string;

  address? : AddAddressFormData
}

export function createEmptyCalendarEvent(): AddCalendarEventFormData {
  return {
    title: '',
    description: '',
    startDate: '',
    endDate: '',

    color:'',
    notes:'',
    
    addressId: '',
    address: createEmptyAddress(),
    
    // customerId: '',
    // workOrderId: '',
    // createdById: '',
  };
}

type AddCalendarEventFormProps = {
  onCreated : (calendarEvent: CalendarEvent) => void;
  projectid?: string;
  projectTitle?: string;
};

export default function AddCalendarEventForm({ onCreated, projectid, projectTitle }: AddCalendarEventFormProps){
  const api = useApiClient();
  const [newCalendarEvent, setNewCalendarEvent] = useState<AddCalendarEventFormData>(createEmptyCalendarEvent());

  const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
  const [workOrdersListOpen, setWorkOrdersListOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState("")
  const [workOrderMode, setWorkOrderMode] = useState<AssociationMode>('none');
  const [addressMode, setAddressMode] = useState<AddressMode>('new');
  const [workOrdersLite, setWorkOrdersLite] = useState<WorkOrder[]>([]);
  const [projectMode, setProjectMode] = useState<AssociationMode>(projectid ? 'existing' : 'none');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<Array<{ id: string; title: string; reference?: string }>>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showNewWorkOrderModal, setShowNewWorkOrderModal] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSelectedWorkOrder(e: React.ChangeEvent<HTMLSelectElement>){
    setSelectedWorkOrder(e.target.value);
  }
  
  useEffect(() => {
    console.log("go get /workOrders")
    if(workOrderMode !== 'existing' || workOrdersLite.length > 0)
    {
      let cancelled = false;

      async function loadWorkOrdersLite() {
        try {
          const res = await api.get('/workOrders');
          if (!res.ok) throw new Error('Erreur');
          const data = await res.json();
          if (!cancelled) {
            setWorkOrdersLite(data);
          }
        } catch {
          if (!cancelled) {
            setError('Erreur lors de la récupération des chantiers');
          }
        } finally {
          if (!cancelled) {
            setWorkOrdersLoading(false);
          }
        }
      };

      void loadWorkOrdersLite();

      return () => {
        cancelled = true;
      };
    }
  }, [api, workOrderMode, workOrdersLite.length]);

  useEffect(() => {
    if (projectid || projectMode !== 'existing' || projects.length > 0) {
      return;
    }

    let cancelled = false;
    void api.get('/projects').then(async (response) => {
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json() as Array<{ id: string; title: string; reference?: string }>;
      if (!cancelled) setProjects(data);
    }).catch(() => {
      if (!cancelled) setError('Erreur lors de la récupération des projets');
    }).finally(() => {
      if (!cancelled) setProjectsLoading(false);
    });

    return () => { cancelled = true; };
  }, [api, projectMode, projectid, projects.length]);

  async function handleAddCalendarEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!newCalendarEvent.startDate || !newCalendarEvent.endDate) {
        setError('Les dates de début et de fin sont obligatoires.');
        return;
      }

      if (new Date(newCalendarEvent.startDate) > new Date(newCalendarEvent.endDate)) {
        setError('La date de début doit être antérieure ou égale à la date de fin.');
        return;
      }

      if (addressMode === 'existing' && !newCalendarEvent.addressId) {
        setError('Veuillez sélectionner une adresse existante');
        return;
      }

      const basePayload = {
        ...newCalendarEvent,
        workOrderId: workOrderMode === 'existing' ? selectedWorkOrder : undefined,
        projectId: projectid || (projectMode === 'existing' ? selectedProject : undefined),
      };
      const res = await api.post('/calendarevents', basePayload);
      console.log(res.status)
      console.log(res.statusText)
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      console.log("data",data)
    //   setCalendarEvents([toCalendarEvent(data), ...calendarEvents]);
      onCreated(data);
      setNewCalendarEvent(createEmptyCalendarEvent());
      setSelectedWorkOrder('');
      setSelectedProject('');
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch (error) {
      setError(`Erreur lors de l\'ajout ${error}`);
    }
  }
  


    console.log("addcalendareventform")

    return(
      <div>
    <form onSubmit={handleAddCalendarEvent} className="mb-8 p-5 bg-white rounded-lg shadow">                    
        <h3>Ajouter un événement</h3>
      {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}
        <div className="grid grid-cols-1 gap-3 py-3 sm:grid-cols-2">
          <label htmlFor="calendar-event-title" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Titre *</span>
            <input
              id="calendar-event-title"
              className="border px-3 py-2 rounded"
              value={newCalendarEvent.title}
              onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, title: e.target.value })}
              required
            />
          </label>
          <label htmlFor="calendar-event-color" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Couleur *</span>
            <input
              id="calendar-event-color"
              type="color"
              className="h-10 border px-3 py-2 rounded"
              value={newCalendarEvent.color}
              onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, color: e.target.value })}
              required
            />
          </label>
          <label htmlFor="calendar-event-description" className="flex flex-col gap-1.5 sm:col-span-2">
            <span className="text-sm font-medium text-zinc-700">Description</span>
            <input
              id="calendar-event-description"
              className="border px-3 py-2 rounded"
              value={newCalendarEvent.description || ''}
              onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, description: e.target.value })}
            />
          </label>
          <label htmlFor="calendar-event-start" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Date de début *</span>
            <input
              id="calendar-event-start"
              type="datetime-local"
              className="border px-3 py-2 rounded"
              value={newCalendarEvent.startDate}
              max={newCalendarEvent.endDate || undefined}
              onChange={(e) => {
                if (newCalendarEvent.endDate && e.target.value > newCalendarEvent.endDate) {
                  setError('La date de début doit être antérieure ou égale à la date de fin.');
                  return;
                }

                setError('');
                setNewCalendarEvent({ ...newCalendarEvent, startDate: e.target.value });
              }}
              required
            />
          </label>
          <label htmlFor="calendar-event-end" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Date de fin *</span>
            <input
              id="calendar-event-end"
              type="datetime-local"
              className="border px-3 py-2 rounded"
              value={newCalendarEvent.endDate}
              min={newCalendarEvent.startDate || undefined}
              onChange={(e) => {
                if (newCalendarEvent.startDate && e.target.value < newCalendarEvent.startDate) {
                  setError('La date de fin doit être postérieure ou égale à la date de début.');
                  return;
                }

                setError('');
                setNewCalendarEvent({ ...newCalendarEvent, endDate: e.target.value });
              }}
              required
            />
          </label>
        </div>  
        <label htmlFor="calendar-event-notes" className="flex w-full flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Notes</span>
          <textarea
            id="calendar-event-notes"
            className="min-h-24 border px-3 py-2 rounded sm:w-1/2"
            value={newCalendarEvent.notes}
            onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, notes: e.target.value })}
          />
        </label>
        {/* <button type="button" className="border py-2 px-2" onClick={() => {setWorkOrdersListOpen(true)}}>
          Associer à un chantier*
        </button>
        {workOrdersListOpen ? ( 
          <div>
           {workOrdersLoading ? (
            <p>Chargement...</p>
          ) : (
          <label htmlFor="calendar-event-work-order" className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Chantier associé</span>
            <select id="calendar-event-work-order" className='flex' value={selectedWorkOrder} onChange={handleSelectedWorkOrder}>
              <option value="">--Veuillez choisir un chantier--</option>
            {workOrdersLite.map((workOrder) => (
            <option key={workOrder.id} value={workOrder.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                {workOrder.title}
              </option>
            ))}
            </select>
          </label>
          )}
          </div>) : (<div></div>)
        } */}
        <h3 className="px-3 py-4">Associer à une adresse :</h3>
        <div className="flex gap-2 px-3 pb-3">
          <button
            type="button"
            className={`border py-2 px-3 rounded ${addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('new')}
            onClick={() => {setAddressMode('new')}}
          >
            Nouvelle adresse
          </button>
          <button
            type="button"
            className={`border py-2 px-3 rounded ${addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('existing')}
            onClick={() => {setAddressMode('existing')}}
          >
            Utiliser une adresse existante
          </button>
          <button
            type="button"
            className={`border py-2 px-3 rounded ${addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('none')}
            onClick={() => {setAddressMode('none')}}
          >
            {`Ne pas ajouter d'adresse`}
          </button>
        </div>

        {addressMode === 'new' ? (
            // <AddressForm address={newAddress} onChange={setNewAddress} />
            <AddressForm 
                address={newCalendarEvent.address} 
                onChange={(address) => {setNewCalendarEvent({ ...newCalendarEvent, address})}}
            />
        ) : addressMode === 'existing' ? (
            // <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />

            <SelectExistingAddress 
                selectedAddressId={newCalendarEvent.addressId} 
                onAddressChange={(addressId) => {setNewCalendarEvent({ ...newCalendarEvent, addressId})}} 
            />
        ) : (
        <span></span>
        )}

        <section className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Associer à un chantier</h3>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`rounded border px-3 py-2 ${workOrderMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => { setWorkOrderMode('new'); setShowNewWorkOrderModal(true); }}>Nouveau chantier</button>
            <button type="button" className={`rounded border px-3 py-2 ${workOrderMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => { setWorkOrderMode('existing'); setWorkOrdersListOpen(true); }}>Associer à un chantier</button>
            <button type="button" className={`rounded border px-3 py-2 ${workOrderMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => { setWorkOrderMode('none'); setSelectedWorkOrder(''); setWorkOrdersListOpen(false); }}>Ne pas associer à un chantier</button>
          </div>
          {workOrderMode === 'existing' && workOrdersListOpen && (
            <div className="mt-4">
              {workOrdersLoading ? <p>Chargement...</p> : <label htmlFor="calendar-event-work-order" className="flex flex-col gap-1.5"><span className="text-sm font-medium text-zinc-700">Chantier existant</span><select id="calendar-event-work-order" className="rounded border px-3 py-2" value={selectedWorkOrder} onChange={handleSelectedWorkOrder}><option value="">-- Veuillez choisir un chantier --</option>{workOrdersLite.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.title}</option>)}</select></label>}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Associer à un projet</h3>
          {projectid ? <p className="rounded border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">{projectTitle || 'Projet sélectionné'}</p> : <><div className="flex flex-wrap gap-2"><button type="button" className={`rounded border px-3 py-2 ${projectMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => setProjectMode('new')}>Nouveau projet</button><button type="button" className={`rounded border px-3 py-2 ${projectMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => setProjectMode('existing')}>Associer à un projet</button><button type="button" className={`rounded border px-3 py-2 ${projectMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => { setProjectMode('none'); setSelectedProject(''); }}>Ne pas associer à un projet</button></div>{projectMode === 'existing' && <label htmlFor="calendar-event-project" className="mt-4 flex flex-col gap-1.5"><span className="text-sm font-medium text-zinc-700">Projet existant</span><select id="calendar-event-project" className="rounded border px-3 py-2" value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}><option value="">-- Veuillez choisir un projet --</option>{projectsLoading ? <option disabled>Chargement...</option> : projects.map((projectOption) => <option key={projectOption.id} value={projectOption.id}>{projectOption.reference ? `${projectOption.reference} - ` : ''}{projectOption.title}</option>)}</select></label>}{projectMode === 'new' && <p className="mt-3 text-sm text-zinc-600">La création d’un nouveau projet est disponible depuis la gestion des projets.</p>}</>}
        </section>


        <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
          Ajouter
        </button>
    </form>

            {showNewWorkOrderModal && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNewWorkOrderModal(false)}><div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="mb-4 flex items-center justify-between"><h4 className="text-lg font-semibold">Nouveau chantier</h4><button type="button" className="rounded border px-3 py-2" onClick={() => setShowNewWorkOrderModal(false)}>Fermer</button></div><AddWorkOrderForm show={true} onCreated={(workOrder) => { setSelectedWorkOrder(workOrder.id); setWorkOrderMode('existing'); setWorkOrdersListOpen(true); setShowNewWorkOrderModal(false); }} /></div></div>}
</div>
    )
}
