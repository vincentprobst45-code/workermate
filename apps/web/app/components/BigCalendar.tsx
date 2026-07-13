"use client"
import { Calendar, dayjsLocalizer, View } from 'react-big-calendar'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import localeData from 'dayjs/plugin/localeData'

import 'dayjs/locale/fr'
import "react-big-calendar/lib/css/react-big-calendar.css";

import { useApiClient } from '../api-client';
import { useEffect, useState } from 'react'
import AddressForm from './AddressForm'

dayjs.extend(localizedFormat)
dayjs.extend(localeData)

dayjs.locale('fr')

const localizer = dayjsLocalizer(dayjs)
// const myEventsList = [
//     {
//         title: "event 1",
//         start: new Date('2026-07-11T12:00:00.000Z'),
//         end: new Date('2026-07-11T13:00:00.000Z'),
//     }
// ]

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;

  color?: string;
  description?: string;
  notes?:string;
  
  customerId?: string;
  projectId?: string;
  addressId?: string;
  createdById?: string;
}

interface CalendarEventApi {
  id: string;
  title: string;
  startDate: string;
  endDate: string;

  color?:string;
  description?: string;
  notes?:string;

  customerId?: string;
  projectId?: string;
  addressId?: string;
  createdById?: string;
}

export function createEmptyCalendarEvent(): CalendarEventApi {
  return {
    id: '',
    title: '',
    startDate: '',
    endDate: '',

    description: '',
    color:'',
    notes:'',
    
    customerId: '',
    projectId: '',
    addressId: '',
    createdById: '',
  };
}

export function toCalendarEvent(dto: CalendarEventApi): CalendarEvent {
    return {
        id: dto.id,
        title: dto.title,
        start: new Date(dto.startDate),
        end: new Date(dto.endDate),
        
        description: dto.description,
        color: dto.color,
        notes: dto.notes,

        customerId: dto.customerId,
        projectId: dto.projectId,
        addressId: dto.addressId,
        createdById: dto.createdById,
    };
}

function BigCalendar() {
  const api = useApiClient();
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState<View>('week');
  const [date, setDate] = useState(new Date());
  const [showAddEventModal,setShowAddEventModal] = useState(false)
  const [newCalendarEvent, setNewCalendarEvent] = useState<CalendarEventApi>(createEmptyCalendarEvent());
  const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
    , postalCode: '', city: '', region: '', countryCode: ''
    , latitude: '', longitude: ''
    , accessCode: '', floor: '', apartment: '', note: ''
   });
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
   console.log("calendarevents : ",calendarEvents)

  async function handleAddCalendarEvent(e: React.FormEvent) {
    e.preventDefault();
    try {
      const calendarEventToAdd = { ...newCalendarEvent, address: newAddress }
      console.log("calendareventToAdd ::", calendarEventToAdd)
      const res = await api.post('/calendarevents', calendarEventToAdd);
      console.log(res.status)
      console.log(res.statusText)
      if (!res.ok) throw new Error('Erreur');
      const data = await res.json();
      console.log("data",data)
      // const event:CalendarEvent = {
      //   id: data.id,
      //   title: data.title,
      //   start: new Date(data.startDate),
      //   end: new Date(data.endDate),
      // }
      // setCalendarEvents([event, ...calendarEvents]);
      setCalendarEvents([toCalendarEvent(data), ...calendarEvents]);
      setNewCalendarEvent(createEmptyCalendarEvent());
      setNewAddress({ street1: '', street2: ''
       , postalCode: '', city: '', region: '', countryCode: ''
       , latitude: '', longitude: ''
       , accessCode: '', floor: '', apartment: '', note: ''
      });
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch (error) {
      setError(`Erreur lors de l\'ajout ${error}`);
    }
  }

    const scrollTo = new Date()
    scrollTo.setHours(7, 0, 0, 0)
    // const myEventsList =  [
    //   {
    //     title: 'event',
    //     start: new Date(2026, 6, 11, 12, 0),
    //     end: new Date(2026, 6, 11, 13, 0),
    //   },
    // ]
    // const myEventsList = calendarEvents.map((e) => {
    //   title: e.title,
    //   start: e.startDate
    // }) 
      useEffect(() => {
        let cancelled = false;
    
        const loadCalendarEvents = async () => {
          try {
            const res = await api.get('/calendarEvents');
            if (!res.ok) throw new Error('Erreur');
            // const data = await res.json();
            const data: CalendarEventApi[] = await res.json();
            console.log("Data : ", data)

            // const events: CalendarEvent[] = data.map(event => ({
            //   id: event.id,
            //   title: event.title,
            //   start: new Date(event.startDate),
            //   end: new Date(event.endDate),
            // }));

            if (!cancelled) {
              setCalendarEvents(data.map(toCalendarEvent));
              // setCalendarEvents(events);
            }
          } catch {
            if (!cancelled) {
              setError('Erreur lors de la récupération des événements');
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        };
    
        void loadCalendarEvents();
      console.log("lolcalendar")
        return () => {
          cancelled = true;
        };
      }, [api]);

    function openAddEvent(){

      setShowAddEventModal(true)
    }  

    useEffect(() => {
      if (!showAddEventModal) return;
    
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setShowAddEventModal(false);
        }
      };
    
      window.addEventListener("keydown", handleKeyDown);
    
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [showAddEventModal]);

    return(
        <div className='py-8 my-8' style={{ display: loading ? "none" : "block" }}>

        {/* {loading ? (
          <p>Chargement du planning...</p>
        ) : ( */}
            <div className='relative'>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{success}</div>}
            <button className='border py-2 px-2' onClick={() => setShowAddEventModal(true)}>Ajouter un événement</button>
            {showAddEventModal &&
              <div
                className="fixed inset-0 bg-black/40 flex items-center justify-center z-9"
                onClick={() => setShowAddEventModal(false)}
              >
                <div className=' border absolute bg-red-200' onClick={(e) => e.stopPropagation()}>
                  <form onSubmit={handleAddCalendarEvent} className="mb-8 p-5 bg-white rounded-lg shadow">
                    <p>mdr</p>
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
                      placeholder="End"
                      value={newCalendarEvent.color}
                      onChange={(e) => setNewCalendarEvent({ ...newCalendarEvent, color: e.target.value })}
                      required
                    />
                    <h3 className="px-3 py-4">Adresse :</h3>
                      <AddressForm address={newAddress} onChange={setNewAddress} />
                    <button type="submit" className="mt-3 bg-slate-900 text-white px-4 py-2 rounded">
                      Ajouter
                    </button>
                  </form>
                </div>
              </div>}
              {/* <Calendar
                localizer={localizer}
                events={myEventsList}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 800 }}
                scrollToTime={scrollTo}
              /> */}
              <Calendar
  localizer={localizer}
  events={loading ? [] : calendarEvents}
  view={view}
  onView={setView}
  date={date}
  onNavigate={setDate}
  startAccessor="start"
  endAccessor="end"
  eventPropGetter={(event) => ({
    style: {
      backgroundColor: event.color ?? "#2563eb",
      borderColor: event.color ?? "#2563eb",
      color: "white",
    },
  })}
  onSelectEvent={(event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  }}
  defaultView="week"
  defaultDate={new Date(2026, 6, 11)}
  style={{ height: 800 }}
/>
  {showEventModal && selectedEvent && (
  <div
    className="fixed inset-0 bg-black/40 flex items-center justify-center z-9"
    onClick={() => {
      setShowEventModal(false);
      setSelectedEvent(null);
    }}
  >
    <div
      className="bg-white rounded-lg p-6"
      onClick={(e) => {e.stopPropagation();console.log(selectedEvent)}}
    >
      
      <h2>{selectedEvent.title}</h2>

      <p>
        Début : {selectedEvent.start.toLocaleString("fr-FR")}
      </p>

      <p>
        Fin : {selectedEvent.end.toLocaleString("fr-FR")}
      </p>
      <p>
        Description : {selectedEvent.description?.toLocaleString("fr-FR")}
      </p>

      <button
        onClick={() => {
          setShowEventModal(false);
          setSelectedEvent(null);
        }}
      >
        Fermer
      </button>
    </div>
  </div>
)}
    {loading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            Chargement...
        </div>
    )}
          </div>
         {/* )} */}
        </div>
)
}
export default BigCalendar