import { useEffect, useState } from "react";
import { CalendarEventType } from '@prisma/client';
import { CalendarDays, FolderKanban, Hammer, MapPin } from 'lucide-react';
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
  type: CalendarEventType;

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
    type: CalendarEventType.OTHER,

    color: '#64748b',
    notes:'',
    
    addressId: '',
    address: createEmptyAddress(),
    
    // customerId: '',
    // workOrderId: '',
    // createdById: '',
  };
}

const calendarEventTypeOptions: Array<{ value: CalendarEventType; label: string; color: string }> = [
  { value: CalendarEventType.CUSTOMER_APPOINTMENT, label: 'Rendez-vous client', color: '#2563eb' },
  { value: CalendarEventType.SITE_VISIT, label: 'Visite de chantier', color: '#0891b2' },
  { value: CalendarEventType.WORK, label: 'Travaux', color: '#16a34a' },
  { value: CalendarEventType.MAINTENANCE, label: 'Maintenance', color: '#d97706' },
  { value: CalendarEventType.DELIVERY, label: 'Livraison', color: '#9333ea' },
  { value: CalendarEventType.ADMINISTRATIVE, label: 'Administratif', color: '#475569' },
  { value: CalendarEventType.ABSENCE, label: 'Absence', color: '#dc2626' },
  { value: CalendarEventType.OTHER, label: 'Autre', color: '#64748b' },
];

// Independent "agenda" theme for this form only (violet accent, no reuse of the rest of the app's tokens).
function segClass(active: boolean): string {
  return `rounded-md px-3 py-1.5 text-xs font-semibold transition ${active ? 'bg-violet-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`;
}

function formatDuration(startIso: string, endIso: string): string | null {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!startIso || !endIso || Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return null;
  }

  const minutes = Math.round((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} h`;
  return `${hours} h ${remainingMinutes} min`;
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
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      onCreated(data);
      setNewCalendarEvent(createEmptyCalendarEvent());
      setSelectedWorkOrder('');
      setSelectedProject('');
      setError('');
      setSuccess('Évènement ajouté avec succès');
    } catch (error) {
      setError(`Erreur lors de l\'ajout ${error}`);
    }
  }
  


    const eventDuration = formatDuration(newCalendarEvent.startDate, newCalendarEvent.endDate);

    return(
      <div>
        <form onSubmit={handleAddCalendarEvent} className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-slate-200">
          <div className="h-2 w-full transition-colors" style={{ backgroundColor: newCalendarEvent.color }} />
          <div className="space-y-6 p-6 sm:p-8">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
                <CalendarDays className="h-3.5 w-3.5" /> Planning
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900">Nouvel évènement</h3>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>
            )}

            <label htmlFor="calendar-event-title" className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Titre *</span>
              <input
                id="calendar-event-title"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-medium text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                placeholder="Ex : Pose de la chaudière"
                value={newCalendarEvent.title}
                onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, title: e.target.value })}
                required
              />
            </label>

            <div>
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">Type d&apos;évènement *</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {calendarEventTypeOptions.map((option) => {
                  const selected = newCalendarEvent.type === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewCalendarEvent({ ...newCalendarEvent, type: option.value, color: option.color })}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                        selected ? 'border-transparent text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                      style={selected ? { backgroundColor: option.color } : undefined}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: selected ? 'rgba(255,255,255,0.9)' : option.color }}
                      />
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
              <label htmlFor="calendar-event-color" className="mt-3 flex items-center gap-2">
                <input
                  id="calendar-event-color"
                  type="color"
                  className="h-8 w-8 cursor-pointer appearance-none rounded-full border-2 border-white shadow ring-1 ring-slate-300 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0"
                  value={newCalendarEvent.color}
                  onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, color: e.target.value })}
                  required
                />
                <span className="text-xs text-slate-500">Couleur personnalisée</span>
              </label>
            </div>

            <label htmlFor="calendar-event-description" className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Description</span>
              <input
                id="calendar-event-description"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                placeholder="Résumé en une ligne"
                value={newCalendarEvent.description || ''}
                onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, description: e.target.value })}
              />
            </label>

            <div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label htmlFor="calendar-event-start" className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Début *</span>
                  <input
                    id="calendar-event-start"
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fin *</span>
                  <input
                    id="calendar-event-end"
                    type="datetime-local"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
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
              {eventDuration && (
                <p className="mt-1.5 text-xs font-semibold text-violet-700">Durée : {eventDuration}</p>
              )}
            </div>

            <label htmlFor="calendar-event-notes" className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
              <textarea
                id="calendar-event-notes"
                className="min-h-20 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                value={newCalendarEvent.notes}
                onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, notes: e.target.value })}
              />
            </label>
            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <MapPin className="h-4 w-4 text-violet-600" /> Lieu
              </div>
              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button type="button" className={segClass(addressMode === 'new')} onClick={() => setAddressMode('new')}>Nouvelle adresse</button>
                <button type="button" className={segClass(addressMode === 'existing')} onClick={() => setAddressMode('existing')}>Existante</button>
                <button type="button" className={segClass(addressMode === 'none')} onClick={() => setAddressMode('none')}>Aucune</button>
              </div>

              {addressMode === 'new' ? (
                <AddressForm
                  address={newCalendarEvent.address}
                  onChange={(address) => setNewCalendarEvent({ ...newCalendarEvent, address })}
                />
              ) : addressMode === 'existing' ? (
                <SelectExistingAddress
                  selectedAddressId={newCalendarEvent.addressId}
                  onAddressChange={(addressId) => setNewCalendarEvent({ ...newCalendarEvent, addressId })}
                />
              ) : (
                <p className="text-sm text-slate-500">Aucune adresse ne sera associée à cet évènement.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Hammer className="h-4 w-4 text-violet-600" /> Chantier
              </div>
              <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button type="button" className={segClass(workOrderMode === 'new')} onClick={() => { setWorkOrderMode('new'); setShowNewWorkOrderModal(true); }}>Nouveau</button>
                <button type="button" className={segClass(workOrderMode === 'existing')} onClick={() => { setWorkOrderMode('existing'); setWorkOrdersListOpen(true); }}>Existant</button>
                <button type="button" className={segClass(workOrderMode === 'none')} onClick={() => { setWorkOrderMode('none'); setSelectedWorkOrder(''); setWorkOrdersListOpen(false); }}>Aucun</button>
              </div>
              {workOrderMode === 'existing' && workOrdersListOpen && (
                <label htmlFor="calendar-event-work-order" className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chantier existant</span>
                  {workOrdersLoading ? (
                    <p className="text-sm text-slate-500">Chargement...</p>
                  ) : (
                    <select
                      id="calendar-event-work-order"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                      value={selectedWorkOrder}
                      onChange={handleSelectedWorkOrder}
                    >
                      <option value="">-- Veuillez choisir un chantier --</option>
                      {workOrdersLite.map((workOrder) => (
                        <option key={workOrder.id} value={workOrder.id}>{workOrder.title}</option>
                      ))}
                    </select>
                  )}
                </label>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
                <FolderKanban className="h-4 w-4 text-violet-600" /> Projet
              </div>
              {projectid ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {projectTitle || 'Projet sélectionné'}
                </p>
              ) : (
                <>
                  <div className="mb-3 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    <button type="button" className={segClass(projectMode === 'new')} onClick={() => setProjectMode('new')}>Nouveau</button>
                    <button type="button" className={segClass(projectMode === 'existing')} onClick={() => setProjectMode('existing')}>Existant</button>
                    <button type="button" className={segClass(projectMode === 'none')} onClick={() => { setProjectMode('none'); setSelectedProject(''); }}>Aucun</button>
                  </div>
                  {projectMode === 'existing' && (
                    <label htmlFor="calendar-event-project" className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Projet existant</span>
                      <select
                        id="calendar-event-project"
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={selectedProject}
                        onChange={(event) => setSelectedProject(event.target.value)}
                      >
                        <option value="">-- Veuillez choisir un projet --</option>
                        {projectsLoading ? (
                          <option disabled>Chargement...</option>
                        ) : (
                          projects.map((projectOption) => (
                            <option key={projectOption.id} value={projectOption.id}>
                              {projectOption.reference ? `${projectOption.reference} - ` : ''}{projectOption.title}
                            </option>
                          ))
                        )}
                      </select>
                    </label>
                  )}
                  {projectMode === 'new' && (
                    <p className="text-sm text-slate-500">La création d&apos;un nouveau projet est disponible depuis la gestion des projets.</p>
                  )}
                </>
              )}
            </section>

            <button
              type="submit"
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 sm:w-auto"
            >
              Ajouter l&apos;évènement
            </button>
          </div>
        </form>

        {showNewWorkOrderModal && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNewWorkOrderModal(false)}>
            <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-900">Nouveau chantier</h4>
                <button type="button" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setShowNewWorkOrderModal(false)}>Fermer</button>
              </div>
              <AddWorkOrderForm show={true} onCreated={(workOrder) => { setSelectedWorkOrder(workOrder.id); setWorkOrderMode('existing'); setWorkOrdersListOpen(true); setShowNewWorkOrderModal(false); }} />
            </div>
          </div>
        )}
      </div>
    )
}
