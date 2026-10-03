import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AddWorkLogItemForm from './AddWorkLogItemForm';
import AddWorklogForm from './AddWorklogForm';
import WorkLogsList from './WorkLogsList';

const { api } = vi.hoisted(() => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../api-client', () => ({ useApiClient: () => api }));

const workLog = {
  id: 'worklog-1',
  projectId: 'project-1',
  workOrderId: 'work-order-1',
  date: '2026-10-01T08:30:00.000Z',
  title: 'Pose du tableau',
  description: 'Contrôle effectué',
  timePlannedMinutes: 120,
  timeSpentMinutes: 135,
  createdAt: '2026-10-01T08:30:00.000Z',
};

const workLogItem = {
  id: 'item-1',
  title: 'Câble cuivre',
  description: '',
  quantity: 2,
  unitLabel: 'm',
  position: 0,
  unitCode: 'MTR',
  baseQuantity: 1,
  unitCost: 4,
  purchaseVatRate: 20,
  totalCost: 8,
  type: 'MATERIAL' as const,
  createdAt: '2026-10-01T08:30:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({ ok: true, json: async () => [] });
  api.post.mockResolvedValue({ ok: true, json: async () => workLog });
  api.put.mockResolvedValue({ ok: true, json: async () => workLog });
  api.delete.mockResolvedValue({ ok: true });
});

describe('AddWorklogForm', () => {
  it('creates a sheet with durations converted to minutes', async () => {
    const onCreated = vi.fn();
    render(<AddWorklogForm projectId="project-1" workOrderId="work-order-1" onCreated={onCreated} />);

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: '  Pose du tableau  ' } });
    fireEvent.change(screen.getAllByLabelText('Heures')[0], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText('Heures')[1], { target: { value: '2' } });
    fireEvent.change(screen.getAllByLabelText('Minutes')[1], { target: { value: '15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Créer la fiche de suivi' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workLog));
    expect(api.post).toHaveBeenCalledWith('/worklogs', expect.objectContaining({
      projectId: 'project-1',
      workOrderId: 'work-order-1',
      title: 'Pose du tableau',
      timePlannedMinutes: 120,
      timeSpentMinutes: 135,
    }));
  });

  it('uses the PUT endpoint when editing a sheet', async () => {
    const onUpdated = vi.fn();
    render(<AddWorklogForm projectId="project-1" workOrderId="work-order-1" initialWorkLog={workLog} onCreated={vi.fn()} onUpdated={onUpdated} />);

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Tableau terminé' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer les modifications' }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(workLog));
    expect(api.put).toHaveBeenCalledWith('/worklogs/worklog-1', expect.objectContaining({ title: 'Tableau terminé' }));
  });
});

describe('AddWorkLogItemForm', () => {
  it('loads a catalog item, fills the form, and creates a consumption line', async () => {
    const onCreated = vi.fn();
    api.get.mockResolvedValueOnce({
      ok: true,
      json: async () => [{
        id: 'catalog-1', type: 'MATERIAL', title: 'Câble cuivre', description: '3G2.5',
        defaultQuantity: 2, unitCode: 'MTR', unitLabel: 'm', reference: 'CAB-1', unitCost: 4,
      }],
    });
    api.post.mockResolvedValueOnce({ ok: true, json: async () => workLogItem });
    render(<AddWorkLogItemForm workLogId="worklog-1" workOrderId="work-order-1" onCreated={onCreated} />);

    fireEvent.click(screen.getByRole('button', { name: 'Remplir à partir du catalogue' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Câble cuivre' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter une consommation' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(workLogItem));
    expect(api.get).toHaveBeenCalledWith('/catalogitems');
    expect(api.post).toHaveBeenCalledWith('/worklogs/worklog-1/items', expect.objectContaining({
      title: 'Câble cuivre', quantity: 2, reference: 'CAB-1', unitCode: 'MTR', unitCost: 4,
    }));
  });
});

describe('WorkLogsList', () => {
  it('loads sheets, reports the count, and deletes a sheet', async () => {
    const onCountChange = vi.fn();
    const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);
    api.get.mockResolvedValueOnce({ ok: true, json: async () => [{ ...workLog, items: [workLogItem] }] });
    render(<WorkLogsList workOrderId="work-order-1" refreshKey={0} onCountChange={onCountChange} />);

    expect(await screen.findByText('Pose du tableau')).toBeInTheDocument();
    expect(onCountChange).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la fiche' }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/worklogs/worklog-1'));
    expect(screen.queryByText('Pose du tableau')).not.toBeInTheDocument();
    confirmMock.mockRestore();
  });
});
