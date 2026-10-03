import { fireEvent, render, screen } from '@testing-library/react';
import { LineItemType, WorkOrderStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import WorkOrderDetails from './WorkOrderDetails';
import type { WorkOrder } from './WorkOrdersList';

function createWorkOrder(): WorkOrder {
  return {
    id: 'workorder-1',
    title: 'Rénovation cuisine',
    reference: 'CH-001',
    description: 'Remise à neuf',
    status: WorkOrderStatus.IN_PROGRESS,
    startDate: '2026-10-10T09:00:00.000Z',
    endDate: '2026-10-12T17:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    customer: { firstName: 'Jane', lastName: 'Doe' },
    address: { street1: '1 rue A', postalCode: '75001', city: 'Paris' },
    items: [
      {
        id: 'item-1',
        position: 0,
        type: LineItemType.LABOR,
        title: 'Pose',
        quantity: 2,
        unitPrice: 100,
        unitCost: 40,
        subtotal: 200,
        vatRate: 20,
        unitLabel: 'heure',
      },
      {
        id: 'item-2',
        position: 1,
        type: LineItemType.MATERIAL,
        title: 'Carrelage',
        quantity: 1,
        unitPrice: 50,
        unitCost: 10,
        subtotal: 50,
        vatRate: 20,
        unitLabel: 'm²',
      },
    ],
  };
}

describe('WorkOrderDetails', () => {
  it('renders work order information and calculated totals', () => {
    render(<WorkOrderDetails workOrder={createWorkOrder()} onClose={vi.fn()} onEdit={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Rénovation cuisine' })).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('1 rue A, 75001 Paris')).toBeInTheDocument();
    expect(screen.getByText(/250,00/)).toBeInTheDocument();
    expect(screen.getByText(/3 unités/)).toBeInTheDocument();
    expect(screen.getByText(/Coût estimé : 90,00/)).toBeInTheDocument();
    expect(screen.getByText('Pose')).toBeInTheDocument();
    expect(screen.getByText('Carrelage')).toBeInTheDocument();
  });

  it('calls close on the close button and Escape, and forwards edit/select actions', () => {
    const onClose = vi.fn();
    const onEdit = vi.fn();
    const onSelect = vi.fn();
    render(<WorkOrderDetails workOrder={createWorkOrder()} onClose={onClose} onEdit={onEdit} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fermer les détails du chantier' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    fireEvent.click(screen.getByRole('button', { name: 'Sélectionner' }));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
