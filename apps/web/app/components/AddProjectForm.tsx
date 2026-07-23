import { useEffect, useState } from "react";
import SelectExistingAddress from "./SelectExistingAddress";
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';
import { useApiClient } from "../api-client";


type ProjectStatus = 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

type ProjectItemType = 'LABOR' | 'MATERIAL' | 'EQUIPMENT' | 'TRAVEL' | 'SERVICE' | 'OTHER';

type AddressMode = 'new' | 'existing' | 'none';

interface ProjectItem{
  id: string;
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

export type AddProjectFormData = {
    title: string;
    description: string;

    reference: string;

    startDate: string;
    endDate: string;

    status: ProjectStatus;

    projectItems: ProjectItem[];

    notes: string;

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
};

export default function AddProjectForm({ onCreated }: AddProjectFormProps){
    const api = useApiClient();
    const [newProject, setNewProject] = useState<AddProjectFormData>(createEmptyProject());

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    function createEmptyProjectItem(): ProjectItem {
      return {
        id: '',
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

    async function handleAddProject(e: React.FormEvent) {
      e.preventDefault();
      try {
        if (newProject.addressMode === 'existing' && !newProject.addressId) {
          setError('Veuillez sélectionner une adresse existante');
          return;
        }

        // let projectToAdd = addressMode === 'new' ? { ...newProject, address: newAddress }
        //                     : addressMode === 'existing' ? { ...newProject, addressId: selectedAddressId }
        //                     : {...newProject }
        // projectToAdd = projectItems.length > 0 ? {...projectToAdd, projectItems: projectItems} : projectToAdd
        // setNewProject({...newProject, projectItems:projectItems})
        const res = await api.post('/projects', newProject);
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
        <form onSubmit={handleAddProject} className="mb-8 p-5 bg-white rounded-lg shadow border-2">
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
            <button type="button" 
                // onClick={() => {setProjectItems([...projectItems, createEmptyProjectItem()])}}
                // onClick={() => {setNewProject([...newProject, [...newProject.projectItems, createEmptyProjectItem()]])}}
                onClick={() => {
                  setNewProject((currentProject) => ({
                    ...currentProject,
                    projectItems: [
                      ...currentProject.projectItems,
                      createEmptyProjectItem(),
                    ],
                  }));
                }}
                className='border-2 bg-blue-200 rounded-md p-2'
            >
              + Ajouter une étape
            </button>
            <div className='m-6'>
            {newProject.projectItems.map((projectItem,i) => {
              return(
              <div key={i} className='p-6 mt-6 border-2 flex flex-wrap gap-4 items-center'>
                <label htmlFor='title'>Titre : </label>
                <input name="title"
                  className="border px-3 py-2 rounded"
                  placeholder="Titre"
                  value={projectItem.title}
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, title: e.target.value }
                            : item
                      ),
                    }));
                  }}
                />
                <label htmlFor='itemtype'>Type : </label>
                <select name="itemtype"
                  className="border px-3 py-2 rounded"
                  value={projectItem.type}
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, type: e.target.value as ProjectItemType }
                            : item
                      ),
                    }));
                  }}
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
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, description: e.target.value }
                            : item
                      ),
                    }));
                  }}
                />
                <label htmlFor='quantity'>Quantité : </label>
                <input type="number" name="quantity"
                  className="border px-3 py-2 rounded"
                  value={projectItem.quantity}
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, quantity: e.target.valueAsNumber }
                            : item
                      ),
                    }));
                  }}
                />
                <label htmlFor='unit'>Unité : </label>
                <input name="unit"
                  className="border px-3 py-2 rounded"
                  placeholder="unité"
                  value={projectItem.unit}
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, unit: e.target.value }
                            : item
                      ),
                    }));
                  }}
                />
                <label htmlFor="unitprice">{`Prix à l'unité : `}</label>
                <input type="number" name="unitprice"
                  className="border px-3 py-2 rounded"
                  placeholder="Prix à l'unité"
                  value={projectItem.unitPrice}
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, unitPrice: e.target.valueAsNumber }
                            : item
                      ),
                    }));
                  }}
                />
                <label htmlFor="vat">TVA : </label>
                <input type="number" name="vat"
                  className="border px-3 py-2 rounded"
                  placeholder="Taux de TVA"
                  value={projectItem.vatRate}
                  onChange={(e) => {
                    setNewProject((currentProject) => ({
                      ...currentProject,
                      projectItems: currentProject.projectItems.map(
                        (item, index) =>
                          index === i
                            ? { ...item, vatRate: e.target.valueAsNumber }
                            : item
                      ),
                    }));
                  }}
                />
                <button type="button"
                  className='py-2 px-3 border-2 rounded-md bg-red-300 hover:bg-red-500 active:bg-red-800'

                onClick={() => { 
                    setNewProject((currentProject) => ({
                        ...currentProject,
                        projectItems: currentProject.projectItems.filter(( item, index) => index !== i)
                    }))
                }}
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
                className={`border py-2 px-3 rounded ${newProject.addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {setNewProject({ ...newProject, addressMode: 'new' })}}
              >
                Nouvelle adresse
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newProject.addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                // onClick={() => setAddressMode('existing')}
                onClick={() => {setNewProject({ ...newProject, addressMode: 'existing' })}}
              >
                Utiliser une adresse existante
              </button>
              <button
                type="button"
                className={`border py-2 px-3 rounded ${newProject.addressMode === 'none' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                onClick={() => {setNewProject({ ...newProject, addressMode: 'none' })}}
              >
                {`Ne pas ajouter d'adresse`}
              </button>
            </div>
            {newProject.addressMode === 'new' ? (
            //   <AddressForm address={newAddress} onChange={setNewAddress} />
                <AddressForm 
                    address={newProject.address} 
                    onChange={(address) => {setNewProject({ ...newProject, address})}}
                />
            ) : newProject.addressMode === 'existing' ? (
            //   <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />
                <SelectExistingAddress 
                    selectedAddressId={newProject.addressId} 
                    onAddressChange={(addressId) => {setNewProject({ ...newProject, addressId})}} 
                />
            ) : <span></span>}
          </div>
          <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
            Ajouter
          </button>
        </form>
    )
}