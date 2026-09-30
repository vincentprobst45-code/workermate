import { PdfService } from './pdf.service';

describe('PdfService', () => {
  it('renders a structured invoice PDF with invoice details and totals', async () => {
    const pdf = await new PdfService().createDocumentPdf({
      type: 'INVOICE',
      kind: 'STANDARD',
      number: 'FAC-2026-001',
      issueDate: '2026-09-30T00:00:00.000Z',
      dueDate: '2026-10-30T00:00:00.000Z',
      tenantName: 'Atelier Exemple',
      tenantStreet1: '1 rue des Lilas',
      tenantPostalCode: '75001',
      tenantCity: 'Paris',
      tenantEmail: 'contact@example.test',
      customerName: 'Client Exemple',
      customerStreet1: '2 avenue du Centre',
      customerPostalCode: '69001',
      customerCity: 'Lyon',
      currency: 'EUR',
      paymentTerms: 'Paiement a 30 jours.',
      tenantIban: 'FR761234567890',
      items: [
        {
          position: 0,
          title: 'Prestation de conseil',
          description: 'Accompagnement du projet',
          quantity: 2,
          unitLabel: 'heure',
          unitPrice: 100,
          subtotal: 200,
          vatCategory: 'STANDARD',
          vatRate: 20,
        },
      ],
      vatAmount: 40,
      taxExclusiveAmount: 200,
      taxInclusiveAmount: 240,
      amountDue: 240,
      vatBreakdowns: [{ vatCategory: 'STANDARD', vatRate: 20, vatAmount: 40 }],
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(1000);
  });
});
