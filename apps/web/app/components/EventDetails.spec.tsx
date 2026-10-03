import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EventDetails from './EventDetails';
import type { CalendarEvent } from './calendar.types';

const event: CalendarEvent = {
  id: 'event-1',
  title: 'Visite client',
  start: new Date('2026-10-10T09:00:00.000Z'),
  end: new Date('2026-10-10T10:30:00.000Z'),
  type: 'CUSTOMER_APPOINTMENT',
  customerName: 'Jane Doe',
  projectName: 'Cuisine Martin',
  addressName: '14 rue A, 75001 Paris',
  createdByName: 'Paul Artisan',
  description: 'Valider les métrés',
  notes: 'Prévoir les échantillons',
};

describe('EventDetails', () => {
  it('renders event associations and notes', () => {
    render(<EventDetails event={event} onClose={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Visite client' })).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Cuisine Martin')).toBeInTheDocument();
    expect(screen.getByText('14 rue A, 75001 Paris')).toBeInTheDocument();
    expect(screen.getByText('Valider les métrés')).toBeInTheDocument();
    expect(screen.getByText('Prévoir les échantillons')).toBeInTheDocument();
  });

  it('calls close on the button and Escape, and forwards edit', () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    render(<EventDetails event={event} onClose={onClose} onEdit={onEdit} />);

    fireEvent.click(screen.getByRole('button', { name: "Fermer les détails de l'événement" }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
