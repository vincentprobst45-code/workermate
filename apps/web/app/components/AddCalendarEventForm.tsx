import { useState } from "react";
import SelectExistingAddress from "./SelectExistingAddress";
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';

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

type AddCalendarEventFormProps = {
  calendarEvent: AddCalendarEventFormData;
  onChange: (calendarEvent: AddCalendarEventFormData) => void;
};

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

export default function AddCalendarEventForm({ calendarEvent, onChange }: AddCalendarEventFormProps){

//   const [addressMode, setAddressMode] = useState<AddressMode>('none');
//   const [selectedAddressId, setSelectedAddressId] = useState('');
//   const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
//     , postalCode: '', city: '', region: '', countryCode: ''
//     , latitude: '', longitude: ''
//     , accessCode: '', floor: '', apartment: '', note: ''
//    });


    console.log("addcalendareventform")

    return(
        <div>
        <h3>Ajouter un événement</h3>
        <div className='py-3'>
          <input
            className="border px-3 py-2 rounded"
            placeholder="Titre"
            value={calendarEvent.title}
            onChange={(e) => onChange({ ...calendarEvent, title: e.target.value })}
            required
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="Description"
            value={calendarEvent.description || ''}
            onChange={(e) => onChange({ ...calendarEvent, description: e.target.value })}
            required
          />
          <input type="datetime-local"
            className="border px-3 py-2 rounded"
            placeholder="Start"
            value={calendarEvent.startDate}
            onChange={(e) => onChange({ ...calendarEvent, startDate: e.target.value })}
            required
          />
          <input type="datetime-local"
            className="border px-3 py-2 rounded"
            placeholder="End"
            value={calendarEvent.endDate}
            onChange={(e) => onChange({ ...calendarEvent, endDate: e.target.value })}
            required
          />
          <input type="color"
            className="border px-3 py-2 rounded"
            placeholder="color"
            value={calendarEvent.color}
            onChange={(e) => onChange({ ...calendarEvent, color: e.target.value })}
            required
          />
        </div>  
        <textarea
          className="border px-3 py-2 rounded w-1/2"
          placeholder="Notes"
          value={calendarEvent.notes}
          onChange={(e) => onChange({ ...calendarEvent, notes: e.target.value })}
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
            className={`border py-2 px-3 rounded ${calendarEvent.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('new')}
            onClick={() => {onChange({ ...calendarEvent, addressMode: 'new' })}}
          >
            Nouvelle adresse
          </button>
          <button
            type="button"
            className={`border py-2 px-3 rounded ${calendarEvent.addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('existing')}
            onClick={() => {onChange({ ...calendarEvent, addressMode: 'existing' })}}
          >
            Utiliser une adresse existante
          </button>
          <button
            type="button"
            className={`border py-2 px-3 rounded ${calendarEvent.addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
            // onClick={() => setAddressMode('none')}
            onClick={() => {onChange({ ...calendarEvent, addressMode: 'none' })}}
          >
            {`Ne pas ajouter d'adresse`}
          </button>
        </div>

        {calendarEvent.addressMode === 'new' ? (
            // <AddressForm address={newAddress} onChange={setNewAddress} />
            <AddressForm 
                address={calendarEvent.address} 
                onChange={(address) => {onChange({ ...calendarEvent, address})}}
            />
        ) : calendarEvent.addressMode === 'existing' ? (
            // <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />

            <SelectExistingAddress 
                selectedAddressId={calendarEvent.addressId} 
                onAddressChange={(addressId) => {onChange({ ...calendarEvent, addressId})}} 
            />
        ) : (
        <span></span>
        )}
        <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
          Ajouter
        </button>
    </div>
    )
}
