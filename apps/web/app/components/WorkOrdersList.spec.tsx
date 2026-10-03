import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LineItemType, WorkOrderStatus } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';
import WorkOrdersList, { type WorkOrder } from './WorkOrdersList';

vi.mock('./WorkOrderDetails', () => ({
  default: () => <div role="dialog">Détail du chantier</div>,
}));

vi.mock('./AddWorkOrderForm', () => ({
  default: () => <div>Modifier le chantier</div>,
}));

function workOrder(overrides: Partial<WorkOrder> = {}): WorkOrder {
  return {
    id: 'workorder-1',
    title: 'Rénovation cuisine',
    reference: 'CH-001',
    status: WorkOrderStatus.PLANNED,
    items: [{
      id: 'item-1',
      position: 0,
      type: LineItemType.LABOR,
      title: 'Pose',
      quantity: 1,
      unitPrice: 100,
      vatRate: 20,
    }],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('WorkOrdersList', () => {
  it('filters work orders by search text and status', () => {
    render(<WorkOrdersList workOrders={[
      workOrder(),
      workOrder({ id: 'workorder-2', title: 'Peinture salon', reference: 'CH-002', status: WorkOrderStatus.DRAFT }),
    ]} onDelete={null} />);

    fireEvent.change(screen.getByPlaceholderText('Rechercher par référence, titre ou description'), { target: { value: 'cuisine' } });
    expect(screen.getAllByText('Rénovation cuisine')).toHaveLength(2);
    expect(screen.queryByText('Peinture salon')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: WorkOrderStatus.DRAFT } });
    expect(screen.queryByText('Rénovation cuisine')).not.toBeInTheDocument();
    expect(screen.getByText('Aucun chantier à afficher.')).toBeInTheDocument();
  });

  it('filters future work orders and forwards the selected work order', () => {
    const handleSelectedWorkOrder = vi.fn();
    render(<WorkOrdersList workOrders={[
      workOrder({ startDate: '2099-01-01T09:00:00.000Z' }),
      workOrder({ id: 'workorder-2', title: 'Chantier passé', reference: 'CH-002', startDate: '2020-01-01T09:00:00.000Z' }),
    ]} onDelete={null} handleSelectedWorkOrder={handleSelectedWorkOrder} />);

    fireEvent.click(screen.getByLabelText('À venir'));
    expect(screen.getAllByText('Rénovation cuisine')).toHaveLength(2);
    expect(screen.queryByText('Chantier passé')).not.toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Ouvrir le chantier CH-001' })[0]);
    expect(handleSelectedWorkOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 'workorder-1' }));
  });

  it('confirms deletion and reports the selected work order id', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined);
    render(<WorkOrdersList workOrders={[workOrder()]} onDelete={onDelete} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Supprimer le chantier CH-001' })[0]);
    expect(screen.getByRole('dialog')).toHaveTextContent('Supprimer ce chantier ?');
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('workorder-1'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
