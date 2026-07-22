'use client';
import { useState, useEffect } from 'react';
import { useApiClient } from '../api-client';
import { ProtectedRoute } from '../protected-route';
import AddressForm from '../components/AddressForm';
import SelectExistingAddress from '../components/SelectExistingAddress';
import { Decimal } from '@prisma/client/runtime/library';
import { ProjectItemType, ProjectStatus } from '@prisma/client';

// enum ProjectStatus {
//   DRAFT,
//   PLANNED,
//   IN_PROGRESS,
//   COMPLETED,
//   CANCELLED,
// }

interface Project {
  id: string;
  title: string;
  description?: string;

  reference: string;

  startDate?: string;   
  endDate?: string;     

  status: ProjectStatus;

  projectItems?: ProjectItem[];

  customerId? : string;
  addressId? : string;
  createdById? : string;

  // createdAt: string;
}

export function createEmptyProject(): Project {
  return {
    id: '',
    title: '',
    description: '',

    reference: '',

    startDate: '',
    endDate: '',

    status: 'DRAFT',

    projectItems: [],
    
    customerId: '',
    addressId: '',
    createdById: '',

    // createdAt : '',
  };
}

// enum ProjectItemType {
//   LABOR,
//   MATERIAL,
//   EQUIPMENT,
//   TRAVEL,
//   SERVICE,
//   OTHER,
// }

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
    value: ProjectItemType.LABOR,
    label: 'Travaux',
  },
  {
    value: ProjectItemType.MATERIAL,
    label: 'Matériel',
  },
  {
    value: ProjectItemType.EQUIPMENT,
    label: 'Équipement',
  },
  {
    value: ProjectItemType.TRAVEL,
    label: 'Déplacement',
  },
  {
    value: ProjectItemType.SERVICE,
    label: 'Service',
  },
  {
    value: ProjectItemType.OTHER,
    label: 'Autre',
  },
];

interface AddressOneLine{
  street1?: string;
  postalCode?: string;
  city?: string;
}

type AddressMode = 'new' | 'existing' | 'none';

export default function ProjectsPage() {
  const api = useApiClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newProject, setNewProject] = useState<Project>(createEmptyProject());
  const [addressMode, setAddressMode] = useState<AddressMode>('new');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
    , postalCode: '', city: '', region: '', countryCode: ''
    , latitude: '', longitude: ''
    , accessCode: '', floor: '', apartment: '', note: ''
   });
   const [projectItems, setProjectItems] = useState<ProjectItem[]>([])

   
  function createEmptyProjectItem(): ProjectItem {
    return {
      id: '',
      position: projectItems.length,
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

  useEffect(() => {
    let cancelled = false;

    async function loadProjects() {
      try {
        const res = await api.get('/projects');
        if (!res.ok) throw new Error('Erreur');
        const data = await res.json();
        if (!cancelled) {
          setProjects(data);
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

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [api]);
  
  console.log(projects)

  async function handleAddProject(e: React.FormEvent) {
    e.preventDefault();
    try {

      let projectToAdd = addressMode === 'new' ? { ...newProject, address: newAddress }
                          : addressMode === 'existing' ? { ...newProject, addressId: selectedAddressId }
                          : {...newProject }
      projectToAdd = projectItems.length > 0 ? {...projectToAdd, projectItems: projectItems} : projectToAdd
      // setNewProject({...newProject, projectItems:projectItems})
      const res = await api.post('/projects', projectToAdd);
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      setProjects([data, ...projects]);
      setNewProject(createEmptyProject());
      setAddressMode('new');
    } catch {
      setError('Erreur lors de l\'ajout');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmer la suppression?')) return;
    try {
      const res = await api.delete(`/projects/${id}`);
      if (!res.ok) throw new Error('Erreur');
      setProjects(projects.filter((p) => p.id !== id));
    } catch {
      setError('Erreur lors de la suppression');
    }
  }



  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="text-2xl font-semibold mb-6">Gestion des Chantiers</h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

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
            <button type="button" onClick={() => {setProjectItems([...projectItems, createEmptyProjectItem()])}}
                    className='border-2 bg-blue-200 rounded-md p-2'
            >
              + Ajouter une étape
            </button>
            <div className='m-6'>
            {projectItems.map((projectItem,i) => {
              return(
              <div key={i} className='p-6 mt-6 border-2 flex flex-wrap gap-4 items-center'>
                <label htmlFor='title'>Titre : </label>
                <input name="title"
                  className="border px-3 py-2 rounded"
                  placeholder="Titre"
                  value={projectItem.title}
                  onChange={(e) => {
                    setProjectItems((currentItems) =>
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
                  value={projectItem.type}
                  onChange={(e) => {
                    setProjectItems((currentItems) =>
                      currentItems.map((item, index) =>
                        index === i
                          ? { ...item, type: e.target.value as ProjectItemType }
                          : item
                      )
                    );
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
                    setProjectItems((currentItems) =>
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
                  value={projectItem.quantity}
                  onChange={(e) => {
                    setProjectItems((currentItems) =>
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
                  value={projectItem.unit}
                  onChange={(e) => {
                    setProjectItems((currentItems) =>
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
                  value={projectItem.unitPrice}
                  onChange={(e) => {
                    setProjectItems((currentItems) =>
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
                  value={projectItem.vatRate}
                  onChange={(e) => {
                    setProjectItems((currentItems) =>
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
                  onClick={() => setProjectItems((currentItems) => {
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
        </form>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div key={project.id} className="p-4 bg-white rounded-lg shadow flex justify-between items-center">
                <div>
                  <p className="font-semibold">{project.title}</p>
                  {project.description && <p className="text-sm text-slate-600">{project.description}</p>}
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Supprimer
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
