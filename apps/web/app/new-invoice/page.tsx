'use client';

import NewInvoice, {
    type InvoiceCompany,
    type InvoiceMeta,
    type InvoiceProjectDetails,
} from '../components/NewInvoice';

export default function NewInvoicePage() {
    function handlePrintInvoice() {
        window.print();
    }

    const invoice: InvoiceMeta = {
        invoiceNumber: 'FAC-2026-0001',
        issueDate: '2026-08-02T00:00:00.000Z',
        dueDate: '2026-09-01T00:00:00.000Z',
    };

    const company: InvoiceCompany = {
        companyName: 'Artisan Batiment Dupont',
        siret: '123 456 789 00012',
        vatNumber: 'FR00123456789',
        email: 'contact@artisan-dupont.fr',
        phone: '01 02 03 04 05',
        address: {
            street1: '12 Rue des Artisans',
            postalCode: '75010',
            city: 'Paris',
            countryCode: 'FR',
        },
    };

    const project: InvoiceProjectDetails = {
        id: 'project-demo-1',
        title: 'Renovation salle de bain',
        reference: 'CH-2026-RENOV-SDB',
        description: 'Refection complete avec plomberie et carrelage.',
        startDate: '2026-08-20',
        endDate: '2026-09-05',
        notes: 'Acompte de 30% deja verse.',
        customer: {
            firstName: 'Jean',
            lastName: 'Martin',
            email: 'jean.martin@email.fr',
            mobile: '06 11 22 33 44',
            address: {
                street1: '8 Avenue Victor Hugo',
                postalCode: '75016',
                city: 'Paris',
                countryCode: 'FR',
            },
        },
        projectAddress: {
            street1: '8 Avenue Victor Hugo',
            postalCode: '75016',
            city: 'Paris',
            countryCode: 'FR',
        },
        projectItems: [
            {
                id: 'line-1',
                position: 0,
                type: 'LABOR',
                title: 'Depose des anciens equipements',
                description: 'Demontage et evacuation.',
                quantity: 1,
                unit: 'forfait',
                unitPrice: 450,
                vatRate: 10,
            },
            {
                id: 'line-2',
                position: 1,
                type: 'MATERIAL',
                title: 'Fourniture carrelage mural',
                quantity: 24,
                unit: 'm2',
                unitPrice: 39.9,
                vatRate: 20,
            },
            {
                id: 'line-3',
                position: 2,
                type: 'SERVICE',
                title: 'Pose des meubles et sanitaires',
                quantity: 1,
                unit: 'forfait',
                unitPrice: 980,
                vatRate: 10,
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
                <NewInvoice project={project} company={company} invoice={invoice} />
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