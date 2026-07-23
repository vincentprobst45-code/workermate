import { useEffect, useState } from "react";
import SelectExistingAddress from "./SelectExistingAddress";
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';
import { useApiClient } from "../api-client";

type AddressMode = 'new' | 'existing' | 'none';

export type AddCalendarEventFormData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;

  color: string;
  notes: string;

  addressMode: AddressMode;
  addressId: string;
  address: AddAddressFormData;

  // customerId: '',
  // projectId: '',
  // createdById: '',
};

// type AddCalendarEventFormProps = {
//   calendarEvent: AddCalendarEventFormData;
//   onChange: (calendarEvent: AddCalendarEventFormData) => void;
// };

interface Project {
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
  projectId?: string;
  projectName?: string;
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
    
    addressMode: 'none',
    addressId: '',
    address: createEmptyAddress(),
    
    // customerId: '',
    // projectId: '',
    // createdById: '',
  };
}

type AddCalendarEventFormProps = {
  onCreated : (calendarEvent: CalendarEvent) => void;
};

export default function AddCalendarEventForm({ onCreated }: AddCalendarEventFormProps){
  const api = useApiClient();
  const [newCalendarEvent, setNewCalendarEvent] = useState<AddCalendarEventFormData>(createEmptyCalendarEvent());

  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsListOpen, setProjectsListOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
//   const [addressMode, setAddressMode] = useState<AddressMode>('new');
  const [projectsLite, setProjectsLite] = useState<Project[]>([]);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleSelectedProject(e: React.ChangeEvent<HTMLSelectElement>){
    setSelectedProject(e.target.value);
  }
  
  useEffect(() => {
    console.log("go get /projects")
    if(projectsListOpen && projectsLoading)
    {
      let cancelled = false;

      async function loadProjectsLite() {
        console.log("loadprojectelite")
        try {
          const res = await api.get('/projects');
          if (!res.ok) throw new Error('Erreur');
          const data = await res.json();
          if (!cancelled) {
            setProjectsLite(data);
          }
        } catch {
          if (!cancelled) {
            setError('Erreur lors de la récupération des chantiers');
          }
        } finally {
          if (!cancelled) {
            console.log("finally")
            setProjectsLoading(false);
            console.log("estprojload ; ", projectsLoading)
          }
        }
      };

      void loadProjectsLite();

      return () => {
        cancelled = true;
      };
    }
  }, [api,projectsListOpen, projectsLoading]);

  async function handleAddCalendarEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (newCalendarEvent.addressMode === 'existing' && !newCalendarEvent.addressId) {
        setError('Veuillez sélectionner une adresse existante');
        return;
      }

      const basePayload = { ...newCalendarEvent, projectId: selectedProject };
      // const calendarEventToAdd = addressMode === 'existing' ? { ...basePayload, address: undefined }
      //                           : addressMode === 'new' ? { ...basePayload, addressId: undefined }
      //                           : {...basePayload, address:undefined,addressId:undefined};
      // console.log("calendareventToAdd ::", calendarEventToAdd)
      const res = await api.post('/calendarevents', basePayload);
      console.log(res.status)
      console.log(res.statusText)
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      console.log("data",data)
    //   setCalendarEvents([toCalendarEvent(data), ...calendarEvents]);
      onCreated(data);
      setNewCalendarEvent(createEmptyCalendarEvent());
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch (error) {
      setError(`Erreur lors de l\'ajout ${error}`);
    }
  }
  
//   const [addressMode, setAddressMode] = useState<AddressMode>('none');
//   const [selectedAddressId, setSelectedAddressId] = useState('');
//   const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
//     , postalCode: '', city: '', region: '', countryCode: ''
//     , latitude: '', longitude: ''
//     , accessCode: '', floor: '', apartment: '', note: ''
//    });


    console.log("addcalendareventform")

    return(

    <form onSubmit={handleAddCalendarEvent} className="mb-8 p-5 bg-white rounded-lg shadow">                    
        <h3>Ajouter un événement</h3>
        <div className='py-3'>
          <input
            className="border px-3 py-2 rounded"
            placeholder="Titre"
            value={newCalendarEvent.title}
            onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, title: e.target.value })}
            required
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="Description"
            value={newCalendarEvent.description || ''}
            onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, description: e.target.value })}
            required
          />
          <input type="datetime-local"
            className="border px-3 py-2 rounded"
            placeholder="Start"
            value={newCalendarEvent.startDate}
            onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, startDate: e.target.value })}
            required
          />
          <input type="datetime-local"
            className="border px-3 py-2 rounded"
            placeholder="End"
            value={newCalendarEvent.endDate}
            onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, endDate: e.target.value })}
            required
          />
          <input type="color"
            className="border px-3 py-2 rounded"
            placeholder="color"
            value={newCalendarEvent.color}
            onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, color: e.target.value })}
            required
          />
        </div>  
        <textarea
          className="border px-3 py-2 rounded w-1/2"
          placeholder="Notes"
          value={newCalendarEvent.notes}
          onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, notes: e.target.value })}
          required
        />
        {/* <button type="button" className="border py-2 px-2" onClick={() => {setProjectsListOpen(true)}}>
          Associer à un chantier*
        </button>
        {projectsListOpen ? ( 
          <div>
           {projectsLoading ? (
            <p>Chargement...</p>
          ) : (
          <select className='flex' value={selectedProject} onChange={handleSelectedProject}>
              <option value="">--Veuillez choisir un chantier--</option>
            {projectsLite.map((project) => (
            <option key={project.id} value={project.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                {project.title}
              </option>
            ))}
          </select>
          )}
          </div>) : (<div></div>)
        } */}
        <h3 className="px-3 py-4">Adresse :</h3>
        <div className="flex gap-2 px-3 pb-3">
          <button
            type="button"
            className={`border py-2 px-3 rounded ${newCalendarEvent.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('new')}
            onClick={() => {setNewCalendarEvent({ ...newCalendarEvent, addressMode: 'new' })}}
          >
            Nouvelle adresse
          </button>
          <button
            type="button"
            className={`border py-2 px-3 rounded ${newCalendarEvent.addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('existing')}
            onClick={() => {setNewCalendarEvent({ ...newCalendarEvent, addressMode: 'existing' })}}
          >
            Utiliser une adresse existante
          </button>
          <button
            type="button"
            className={`border py-2 px-3 rounded ${newCalendarEvent.addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('none')}
            onClick={() => {setNewCalendarEvent({ ...newCalendarEvent, addressMode: 'none' })}}
          >
            {`Ne pas ajouter d'adresse`}
          </button>
        </div>

        {newCalendarEvent.addressMode === 'new' ? (
            // <AddressForm address={newAddress} onChange={setNewAddress} />
            <AddressForm 
                address={newCalendarEvent.address} 
                onChange={(address) => {setNewCalendarEvent({ ...newCalendarEvent, address})}}
            />
        ) : newCalendarEvent.addressMode === 'existing' ? (
            // <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />

            <SelectExistingAddress 
                selectedAddressId={newCalendarEvent.addressId} 
                onAddressChange={(addressId) => {setNewCalendarEvent({ ...newCalendarEvent, addressId})}} 
            />
        ) : (
        <span></span>
        )}

        <button type="button" className="border py-2 px-2" onClick={() => {setProjectsListOpen(true)}}>
          Associer à un chantier*
        </button>
        {projectsListOpen ? ( 
          <div>
           {projectsLoading ? (
            <p>Chargement...</p>
          ) : (
          <select className='flex' value={selectedProject} onChange={handleSelectedProject}>
              <option value="">--Veuillez choisir un chantier--</option>
            {projectsLite.map((project) => (
            <option key={project.id} value={project.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                {project.title}
              </option>
            ))}
          </select>
          )}
          </div>) : (<div></div>)
        }

        <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
          Ajouter
        </button>
    </form>
    )
}
