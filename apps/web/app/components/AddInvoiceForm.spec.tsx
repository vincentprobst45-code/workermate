import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InvoiceKind } from '@prisma/client';
import { AuthProvider } from '../auth.context';
import type { Session } from '../lib/auth.types';
import AddInvoiceForm from './AddInvoiceForm';
import type { Invoice } from './InvoicesList';

vi.mock('./AddCustomerForm', () => ({ default: () => null }));
vi.mock('./AddWorkOrderForm', () => ({ default: () => null }));
vi.mock('./CatalogItemList', () => ({ default: () => null }));
vi.mock('./QuotesList', () => ({ default: () => null }));
vi.mock('./WorkOrdersList', () => ({ default: () => null }));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const session: Session = {
  user: { id: 'user-1', email: 'user@example.com', firstname: 'Jane', lastname: 'Doe' },
  tenants: [{ tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' }],
  activeTenant: { tenantId: 'tenant-1', tenantName: 'Acme', role: 'OWNER' },
};

function response(body: unknown) {
  return { ok: true, status: 200, json: vi.fn().mockResolvedValue(body) };
}

function mockInitialRequests() {
  fetchMock.mockImplementation((url: string) => {
    if (url.endsWith('/invoices')) return Promise.resolve(response([]));
    if (url.endsWith('/tenants/current')) return Promise.resolve(response({}));
    if (url.endsWith('/customers')) {
      return Promise.resolve(response([{
        id: 'customer-1',
        firstName: 'Jane',
        lastName: 'Doe',
        address: { street1: '2 Rue Client', postalCode: '75002', city: 'Paris' },
      }]));
    }
    if (url.endsWith('/workOrders')) return Promise.resolve(response([]));
    if (url.endsWith('/quotes')) return Promise.resolve(response([]));
    if (url.endsWith('/catalogitems')) return Promise.resolve(response([]));
    return Promise.resolve(response({}));
  });
}

function renderForm(initialInvoice?: Invoice, invoiceKind = InvoiceKind.STANDARD) {
  return render(
    <AuthProvider session={session}>
      <AddInvoiceForm
        show
        invoiceKind={invoiceKind}
        initialInvoice={initialInvoice}
        onCreated={vi.fn()}
        onUpdated={vi.fn()}
      />
    </AuthProvider>,
  );
}

const invoiceForEdit = {
  id: 'invoice-1',
  tenantId: 'tenant-1',
  customerId: 'customer-1',
  number: 'FAC-2026-0001',
  issueDate: '2026-08-29T10:00:00.000Z',
  workOrderReference: '',
  workOrderTitle: '',
  tenantName: 'Acme',
  tenantStreet1: '1 Rue Test',
  tenantPostalCode: '75001',
  tenantCity: 'Paris',
  tenantSiretNumber: '12345678901234',
  tenantVatNumber: 'FR12345678901',
  tenantEmail: 'acme@example.com',
  tenantPhoneNumber: '0102030405',
  customerFirstName: 'Jane',
  customerLastName: 'Doe',
  customerStreet1: '2 Rue Client',
  customerPostalCode: '75002',
  customerCity: 'Paris',
  status: 'DRAFT',
  currency: 'EUR',
  subtotal: 100,
  vatAmount: 20,
  total: 120,
  pdpStatus: 'NOT_SENT',
  pdpMessageId: '',
  createdAt: '2026-08-29T10:00:00.000Z',
  updatedAt: '2026-08-29T10:00:00.000Z',
  items: [
    {
      id: 'item-1',
      invoiceId: 'invoice-1',
      position: 0,
      title: 'Prestation',
      description: '',
      quantity: 2,
      unitPrice: 50,
      vatRate: 20,
      subtotal: 100,
      total: 0,
    },
  ],
} as Invoice;

describe('AddInvoiceForm', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    mockInitialRequests();
  });

  it('recalculates the line total from Prisma subtotal and VAT when editing', async () => {
    renderForm(invoiceForEdit);

    expect(await screen.findByText('100.00 EUR')).toBeInTheDocument();
  });

  it('sends inline payments when creating an invoice', async () => {
    const createdInvoice = { ...invoiceForEdit, id: 'invoice-2' };
    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.endsWith('/invoices') && options?.method === 'POST') {
        return Promise.resolve(response(createdInvoice));
      }
      if (url.endsWith('/invoices')) return Promise.resolve(response([]));
      if (url.endsWith('/tenants/current')) {
        return Promise.resolve(response({
          name: 'Acme',
          email: 'acme@example.com',
          phoneNumber: '0102030405',
          siretNumber: '12345678901234',
          vatNumber: 'FR12345678901',
          address: { street1: '1 Rue Test', postalCode: '75001', city: 'Paris' },
        }));
      }
      if (url.endsWith('/customers')) {
        return Promise.resolve(response([{
          id: 'customer-1',
          firstName: 'Jane',
          lastName: 'Doe',
          address: { street1: '2 Rue Client', postalCode: '75002', city: 'Paris' },
        }]));
      }
      return Promise.resolve(response([]));
    });

    renderForm();
    fireEvent.click(screen.getByRole('button', { name: 'Remplir depuis un client existant' }));
    fireEvent.click(await screen.findByRole('button', { name: /Jane Doe/ }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Modifier' })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter un paiement' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Modifier' })[0]);

    fireEvent.change(screen.getByLabelText('Prénom client *'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByLabelText('Nom client *'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText('Adresse client *'), { target: { value: '2 Rue Client' } });
    fireEvent.change(screen.getByLabelText('Code postal client *'), { target: { value: '75002' } });
    fireEvent.change(screen.getByLabelText('Ville client *'), { target: { value: 'Paris' } });
    fireEvent.change(screen.getByLabelText('Entreprise *'), { target: { value: 'Acme' } });
    fireEvent.change(screen.getByLabelText('Adresse entreprise *'), { target: { value: '1 Rue Test' } });
    fireEvent.change(screen.getByLabelText('Code postal entreprise *'), { target: { value: '75001' } });
    fireEvent.change(screen.getByLabelText('Ville entreprise *'), { target: { value: 'Paris' } });
    fireEvent.change(screen.getByLabelText('Email entreprise *'), { target: { value: 'acme@example.com' } });
    fireEvent.change(screen.getByLabelText('Téléphone entreprise *'), { target: { value: '0102030405' } });
    fireEvent.change(screen.getByLabelText('SIRET *'), { target: { value: '12345678901234' } });
    fireEvent.change(screen.getByLabelText('TVA entreprise *'), { target: { value: 'FR12345678901' } });
    fireEvent.change(screen.getByLabelText('Libellé *'), { target: { value: 'Prestation' } });
    fireEvent.change(screen.getByLabelText('Montant *'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Date du paiement *'), { target: { value: '2026-07-20T10:00' } });

    fireEvent.click(screen.getByRole('button', { name: 'Créer la facture' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/invoices',
      expect.objectContaining({ method: 'POST' }),
    ));

    const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST' && String(fetchMock.mock.calls.find(([, candidateOptions]) => candidateOptions === options)?.[0]).endsWith('/invoices'));
    expect(postCall).toBeDefined();
    expect(JSON.parse(postCall?.[1].body as string).payments).toEqual([
      expect.objectContaining({ amount: 25, paidAt: '2026-07-20T10:00' }),
    ]);
  }, 30000);

  it('selects a source invoice and sends its id for a corrective invoice', async () => {
    const sourceInvoice = {
      ...invoiceForEdit,
      id: 'source-invoice',
      number: 'FAC-2026-0002',
      issueDate: '2026-08-28T10:00:00.000Z',
      workOrderTitle: 'Chantier source',
      customerName: 'Jane Doe',
      taxInclusiveAmount: 120,
    };
    const updatedInvoice = { ...invoiceForEdit, kind: InvoiceKind.CORRECTIVE };

    fetchMock.mockImplementation((url: string, options?: RequestInit) => {
      if (url.endsWith('/invoices/source-invoice')) return Promise.resolve(response(sourceInvoice));
      if (url.endsWith('/invoices') && options?.method === 'PUT') return Promise.resolve(response(updatedInvoice));
      if (url.endsWith('/invoices')) return Promise.resolve(response([sourceInvoice]));
      if (url.endsWith('/tenants/current')) return Promise.resolve(response({}));
      if (url.endsWith('/customers')) return Promise.resolve(response([]));
      if (url.endsWith('/workOrders')) return Promise.resolve(response([]));
      return Promise.resolve(response([]));
    });

    renderForm(invoiceForEdit, InvoiceKind.CORRECTIVE);

    fireEvent.click(screen.getByRole('button', { name: 'Choisir la facture à corriger' }));
    expect((await screen.findAllByText('FAC-2026-0002')).length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText('FAC-2026-0002')[0]);

    expect(screen.getByText((_, element) => element?.tagName === 'P' && (element.textContent?.includes('Chantier source') ?? false))).toBeInTheDocument();
    expect(screen.getByText('FAC-2026-0002')).toBeInTheDocument();
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:4000/invoices/invoice-1',
      expect.objectContaining({ method: 'PUT' }),
    ));

    const putCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PUT');
    expect(JSON.parse(putCall?.[1].body as string).correctedInvoiceId).toBe('source-invoice');
  });
});
