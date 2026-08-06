'use client';

import NewInvoice, { type Invoice } from '../components/NewInvoice';

export default function NewInvoicePage() {
    function handlePrintInvoice() {
        window.print();
    }

    const invoice: Invoice = {
        id: 'invoice-demo-1',
        tenantId: 'tenant-demo-1',
        customerId: 'customer-demo-1',
        workOrderId: 'workOrder-demo-1',
        number: 'FAC-2026-0001',
        issueDate: '2026-08-02T00:00:00.000Z',
        dueDate: '2026-09-01T00:00:00.000Z',
        workOrderReference: 'CH-2026-RENOV-SDB',
        workOrderTitle: 'Renovation salle de bain',
        tenantName: 'Artisan Batiment Dupont',
        tenantStreet1: '12 Rue des Artisans',
        tenantPostalCode: '75010',
        tenantCity: 'Paris',
        tenantSiretNumber: '123 456 789 00012',
        tenantVatNumber: 'FR00123456789',
        tenantEmail: 'contact@artisan-dupont.fr',
        tenantPhoneNumber: '01 02 03 04 05',
        customerFirstName: 'Jean',
        customerLastName: 'Martin',
        customerStreet1: '8 Avenue Victor Hugo',
        customerPostalCode: '75016',
        customerCity: 'Paris',
        customerEmail: 'jean.martin@email.fr',
        customerPhoneNumber: '06 11 22 33 44',
        workOrderStartDate: '2026-08-20T00:00:00.000Z',
        workOrderEndDate: '2026-09-05T00:00:00.000Z',
        workOrderAddress: '8 Avenue Victor Hugo',
        workOrderPostalCode: '75016',
        workOrderCity: 'Paris',
        status: 'DRAFT',
        currency: 'EUR',
        subtotal: 2387.6,
        vatAmount: 264.52,
        total: 2652.12,
        paymentTerms: 'Paiement a 30 jours fin de mois.',
        legalMentions: 'Merci pour votre confiance.',
        notes: 'Acompte de 30% deja verse.',
        pdpStatus: 'NOT_SENT',
        createdAt: '2026-08-02T10:00:00.000Z',
        updatedAt: '2026-08-02T10:00:00.000Z',
        items: [
            {
                id: 'line-1',
                invoiceId: 'invoice-demo-1',
                position: 0,
                title: 'Depose des anciens equipements',
                description: 'Demontage et evacuation.',
                quantity: 1,
                unit: 'forfait',
                unitPrice: 450,
                vatRate: 10,
                total: 495,
            },
            {
                id: 'line-2',
                invoiceId: 'invoice-demo-1',
                position: 1,
                title: 'Fourniture carrelage mural',
                quantity: 24,
                unit: 'm2',
                unitPrice: 39.9,
                vatRate: 20,
                description: '',
                total: 1149.12,
            },
            {
                id: 'line-3',
                invoiceId: 'invoice-demo-1',
                position: 2,
                title: 'Pose des meubles et sanitaires',
                quantity: 1,
                unit: 'forfait',
                unitPrice: 980,
                vatRate: 10,
                description: '',
                total: 1078,
            },
        ],
    };

    return (
        <main className="new-invoice-page mx-auto max-w-6xl px-5 py-6 sm:px-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
                <h2 className="text-2xl font-semibold">Nouvelle Facture</h2>
                <button
                    type="button"
                    onClick={handlePrintInvoice}
                    className="rounded-md border-2 border-slate-800 bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 active:bg-slate-950"
                >
                    Enregistrer en PDF
                </button>
            </div>

            <div id="invoice-print-area">
                <NewInvoice invoice={invoice} />
            </div>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }

                    #invoice-print-area,
                    #invoice-print-area * {
                        visibility: visible !important;
                    }

                    #invoice-print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm;
                    }
                }
            `}</style>
        </main>
    );
}