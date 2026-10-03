import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CalendarEventType } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import AddCalendarEventForm, { createEmptyCalendarEvent } from './AddCalendarEventForm';

const { postMock, getMock } = vi.hoisted(() => ({ postMock: vi.fn(), getMock: vi.fn() }));

vi.mock('../api-client', () => ({
  useApiClient: () => ({ post: postMock, get: getMock, put: vi.fn() }),
}));

vi.mock('./AddressForm', () => ({
  default: () => <div>Formulaire nouvelle adresse</div>,
  createEmptyAddress: () => ({ street1: '', street2: '', postalCode: '', city: '', region: '', countryCode: '', latitude: '', longitude: '', accessCode: '', floor: '', apartment: '', note: '' }),
}));

vi.mock('./SelectExistingAddress', () => ({
  default: () => <div>Sélecteur adresse existante</div>,
}));

vi.mock('./AddWorkOrderForm', () => ({
  default: () => <div>Formulaire chantier</div>,
}));

function createdEvent() {
  return {
    id: 'event-1',
    title: 'Visite client',
    startDate: '2026-10-10T09:00:00.000Z',
    endDate: '2026-10-10T10:00:00.000Z',
  };
}

describe('AddCalendarEventForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue({ ok: true, json: async () => [] });
  });

  it('provides the expected empty event defaults', () => {
    expect(createEmptyCalendarEvent()).toMatchObject({
      title: '',
      type: CalendarEventType.OTHER,
      color: '#64748b',
      addressId: '',
    });
  });

  it('posts a new event and reports the created event', async () => {
    postMock.mockResolvedValue({ ok: true, json: async () => createdEvent() });
    const onCreated = vi.fn();
    render(<AddCalendarEventForm onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText('Titre *'), { target: { value: 'Visite client' } });
    fireEvent.change(screen.getByLabelText('Début *'), { target: { value: '2026-10-10T09:00' } });
    fireEvent.change(screen.getByLabelText('Fin *'), { target: { value: '2026-10-10T10:30' } });
    expect(screen.getByText('Durée : 1 h 30 min')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ajouter/ }));

    await waitFor(() => expect(postMock).toHaveBeenCalledWith('/calendarevents', expect.objectContaining({
      title: 'Visite client',
      type: CalendarEventType.OTHER,
      addressId: '',
      address: undefined,
      workOrderId: '',
      projectId: '',
    })));
    expect(onCreated).toHaveBeenCalledWith(createdEvent());
    expect(screen.getByText('Évènement ajouté avec succès')).toBeInTheDocument();
  });

  it('shows a validation error when the dates are missing', () => {
    render(<AddCalendarEventForm onCreated={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Titre *'), { target: { value: 'Visite client' } });
    fireEvent.submit(screen.getByRole('button', { name: /Ajouter/ }).closest('form') as HTMLFormElement);

    expect(screen.getByText('Les dates de début et de fin sont obligatoires.')).toBeInTheDocument();
    expect(postMock).not.toHaveBeenCalled();
  });
});
