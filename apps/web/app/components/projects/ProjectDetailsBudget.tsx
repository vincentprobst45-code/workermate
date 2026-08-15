'use client';

import { useEffect, useMemo, useState } from 'react';
import type { InvoiceStatus, QuoteStatus } from '@prisma/client';
import { useApiClient } from '../../api-client';
import type { Project } from '../AddProjectForm';

type ProjectDetailsBudgetProps = {
  project: Project;
};

type QuoteItem = {
  id: string;
  number: string;
  title: string;
  status: QuoteStatus;
  items: Array<{
    id: string;
    position: number;
    title: string;
    description: string;
    quantity: number | string;
    unit?: string | null;
    unitPrice: number | string;
    vatRate: number | string;
    total: number | string;
  }>;
  subtotal: number | string;
  vatAmount: number | string;
  total: number | string;
};

type InvoiceItem = {
  id: string;
  number: string;
  status: InvoiceStatus;
  items: Array<{
    id: string;
    position: number;
    title: string;
    description: string;
    quantity: number | string;
    unit?: string | null;
    unitPrice: number | string;
    vatRate: number | string;
    total: number | string;
  }>;
  subtotal: number | string;
  vatAmount: number | string;
  total: number | string;
};

type WorkOrderItem = {
  id: string;
  title: string;
  quantity: number | string;
  unitCost?: number | string | null;
  purchaseVatRate?: number | string | null;
  unit?: string | null;
};

type WorkOrderWithItems = {
  id: string;
  reference: string;
  title: string;
  items: WorkOrderItem[];
};

type WorkLogItem = {
  id: string;
  title?: string;
  quantity: number | string;
  unit?: string | null;
  unitCost: number | string;
  totalCost: number | string;
  purchaseVatRate?: number | string | null;
};

type WorkLogWithItems = {
  id: string;
  title?: string | null;
  date?: string;
  items: WorkLogItem[];
};

type ProjectData = {
  quotes: QuoteItem[];
  invoices: InvoiceItem[];
  workOrders: WorkOrderWithItems[];
  workLogs: WorkLogWithItems[];
};

type BudgetRow = {
  label: string;
  ht: number;
  tva: number;
  ttc: number;
  isMargin?: boolean;
};

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

export default function ProjectDetailsBudget({ project }: ProjectDetailsBudgetProps) {
  const api = useApiClient();
  const [data, setData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBudgetRow, setSelectedBudgetRow] = useState<BudgetRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectData() {
      setLoading(true);
      try {
        const response = await api.get(`/projects/${project.id}`);
        if (!response.ok) {
          throw new Error('Erreur');
        }

        const projectDetails = (await response.json()) as ProjectData;
        if (!cancelled) {
          setData(projectDetails);
          setError('');
        }
      } catch {
        if (!cancelled) {
          setError('Erreur lors de la récupération des données budgétaires.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadProjectData();

    return () => {
      cancelled = true;
    };
  }, [api, project.id]);

  const budgetRows = useMemo<BudgetRow[]>(() => {
    if (!data) {
      return [];
    }

    // 1. CA prévu : total des devis acceptés
    const acceptedQuotes = (data.quotes || []).filter((q) => q.status === 'ACCEPTED');
    const caPrevuHt = acceptedQuotes.reduce((acc, q) => acc + Number(q.subtotal || 0), 0);
    const caPrevuTva = acceptedQuotes.reduce((acc, q) => acc + Number(q.vatAmount || 0), 0);
    const caPrevuTtc = acceptedQuotes.reduce((acc, q) => acc + Number(q.total || 0), 0);

    // 2. CA facturé : total des factures envoyées ou payées
    const billedInvoices = (data.invoices || []).filter(
      (i) => i.status === 'SENT' || i.status === 'PAID',
    );
    const caFactureHt = billedInvoices.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
    const caFactureTva = billedInvoices.reduce((acc, i) => acc + Number(i.vatAmount || 0), 0);
    const caFactureTtc = billedInvoices.reduce((acc, i) => acc + Number(i.total || 0), 0);

    // 3. CA encaissé : total des factures payées
    const paidInvoices = (data.invoices || []).filter((i) => i.status === 'PAID');
    const caEncaisseHt = paidInvoices.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
    const caEncaisseTva = paidInvoices.reduce((acc, i) => acc + Number(i.vatAmount || 0), 0);
    const caEncaisseTtc = paidInvoices.reduce((acc, i) => acc + Number(i.total || 0), 0);

    // 4. Coûts prévus : unitCost * quantity sur les WorkOrderItems
    let coutsPrevusHt = 0;
    let coutsPrevusTva = 0;
    for (const wo of data.workOrders || []) {
      for (const item of wo.items || []) {
        const qty = Number(item.quantity || 0);
        const unitCost = Number(item.unitCost || 0);
        const vatRate = Number(item.purchaseVatRate || 0);
        const lineHt = qty * unitCost;
        const lineTva = lineHt * (vatRate / 100);
        coutsPrevusHt += lineHt;
        coutsPrevusTva += lineTva;
      }
    }
    const coutsPrevusTtc = coutsPrevusHt + coutsPrevusTva;

    // 5. Coûts engagés : 0 pour l'instant
    const coutsEngagesHt = 0;
    const coutsEngagesTva = 0;
    const coutsEngagesTtc = 0;

    // 6. Coûts réels : totalCost des WorkLogItems
    let coutsReelsHt = 0;
    let coutsReelsTva = 0;
    for (const wl of data.workLogs || []) {
      for (const item of wl.items || []) {
        const lineHt =
          item.totalCost !== undefined && item.totalCost !== null
            ? Number(item.totalCost)
            : Number(item.quantity || 0) * Number(item.unitCost || 0);
        const vatRate = Number(item.purchaseVatRate || 0);
        const lineTva = lineHt * (vatRate / 100);
        coutsReelsHt += lineHt;
        coutsReelsTva += lineTva;
      }
    }
    const coutsReelsTtc = coutsReelsHt + coutsReelsTva;

    // 7. Marge prévisionnelle : CA prévu − Coûts prévus
    const margePrevisionnelleHt = caPrevuHt - coutsPrevusHt;
    const margePrevisionnelleTva = caPrevuTva - coutsPrevusTva;
    const margePrevisionnelleTtc = caPrevuTtc - coutsPrevusTtc;

    // 8. Marge actuelle : CA facturé − Coûts réels
    const margeActuelleHt = caFactureHt - coutsReelsHt;
    const margeActuelleTva = caFactureTva - coutsReelsTva;
    const margeActuelleTtc = caFactureTtc - coutsReelsTtc;

    // 9. Marge encaissée : CA encaissé − coûts réels
    const margeEncaisseeHt = caEncaisseHt - coutsReelsHt;
    const margeEncaisseeTva = caEncaisseTva - coutsReelsTva;
    const margeEncaisseeTtc = caEncaisseTtc - coutsReelsTtc;

    return [
      { label: 'CA prévu', ht: caPrevuHt, tva: caPrevuTva, ttc: caPrevuTtc },
      { label: 'CA facturé', ht: caFactureHt, tva: caFactureTva, ttc: caFactureTtc },
      { label: 'CA encaissé', ht: caEncaisseHt, tva: caEncaisseTva, ttc: caEncaisseTtc },
      { label: 'Coûts prévus', ht: coutsPrevusHt, tva: coutsPrevusTva, ttc: coutsPrevusTtc },
      { label: 'Coûts engagés', ht: coutsEngagesHt, tva: coutsEngagesTva, ttc: coutsEngagesTtc },
      { label: 'Coûts réels', ht: coutsReelsHt, tva: coutsReelsTva, ttc: coutsReelsTtc },
      {
        label: 'Marge prévisionnelle',
        ht: margePrevisionnelleHt,
        tva: margePrevisionnelleTva,
        ttc: margePrevisionnelleTtc,
        isMargin: true,
      },
      {
        label: 'Marge actuelle',
        ht: margeActuelleHt,
        tva: margeActuelleTva,
        ttc: margeActuelleTtc,
        isMargin: true,
      },
      {
        label: 'Marge encaissée',
        ht: margeEncaisseeHt,
        tva: margeEncaisseeTva,
        ttc: margeEncaisseeTtc,
        isMargin: true,
      },
    ];
  }, [data]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-zinc-900">Budget</h3>

      {loading && <p className="text-sm text-zinc-600">Chargement des données budgétaires...</p>}
      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50 font-semibold text-zinc-700">
                <th className="px-4 py-3">Indicateur</th>
                <th className="px-4 py-3 text-right">Valeur HT</th>
                <th className="px-4 py-3 text-right">+ TVA en euros</th>
                <th className="px-4 py-3 text-right">Total TTC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {budgetRows.map((row, index) => {
                const isMarginSectionStart = row.isMargin && index === 6;
                const isCostsSectionStart = index === 3;

                return (
                  <tr
                    key={row.label}
                    onClick={() => setSelectedBudgetRow(row)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedBudgetRow(row);
                      }
                    }}
                    className={`transition-colors hover:bg-zinc-50/80 ${
                      row.isMargin
                        ? 'bg-zinc-50/50 font-semibold text-zinc-900'
                        : 'text-zinc-700'
                    } ${isMarginSectionStart || isCostsSectionStart ? 'border-t-2 border-zinc-300' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <span className={row.isMargin ? 'font-semibold text-zinc-900' : ''}>
                        {row.label}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right ${
                        row.isMargin && row.ht < 0
                          ? 'text-red-600'
                          : row.isMargin && row.ht > 0
                            ? 'text-emerald-700'
                            : ''
                      }`}
                    >
                      {formatCurrency(row.ht)}
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-600">
                      {formatCurrency(row.tva)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${
                        row.isMargin && row.ttc < 0
                          ? 'text-red-600'
                          : row.isMargin && row.ttc > 0
                            ? 'text-emerald-700'
                            : 'text-zinc-900'
                      }`}
                    >
                      {formatCurrency(row.ttc)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedBudgetRow && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedBudgetRow(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h4 className="text-xl font-semibold text-zinc-900">Détail du calcul: {selectedBudgetRow.label}</h4>
              <button
                type="button"
                className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
                onClick={() => setSelectedBudgetRow(null)}
              >
                Fermer
              </button>
            </div>

            {selectedBudgetRow.label === 'CA prévu' && data && (
              <div className="space-y-4">
                {(data.quotes || []).filter((quote) => quote.status === 'ACCEPTED').map((quote) => (
                  <section key={quote.id} className="border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <h5 className="font-semibold text-zinc-900">{quote.title}</h5>
                        <p className="text-sm text-zinc-600">Numéro: {quote.number}</p>
                      </div>
                      <p className="text-sm font-medium text-zinc-700">{formatCurrency(Number(quote.total || 0))} TTC</p>
                    </div>
                    {quote.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-white text-zinc-700">
                            <tr>
                              <th className="border border-zinc-200 px-2 py-1">Ligne</th>
                              <th className="border border-zinc-200 px-2 py-1">Description</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Quantité</th>
                              <th className="border border-zinc-200 px-2 py-1">Unité</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">PU HT</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">TVA</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {quote.items.map((item) => (
                              <tr key={item.id}>
                                <td className="border border-zinc-200 px-2 py-1 font-medium">{item.title}</td>
                                <td className="border border-zinc-200 px-2 py-1 text-zinc-600">{item.description || '-'}</td>
                                <td className="border border-zinc-200 px-2 py-1 text-right">{Number(item.quantity || 0)}</td>
                                <td className="border border-zinc-200 px-2 py-1">{item.unit || '-'}</td>
                                <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(Number(item.unitPrice || 0))}</td>
                                <td className="border border-zinc-200 px-2 py-1 text-right">{Number(item.vatRate || 0).toFixed(2)}%</td>
                                <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(Number(item.total || 0))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-600">Aucune ligne dans ce devis.</p>
                    )}
                    <div className="mt-3 grid gap-2 text-right text-sm sm:grid-cols-3">
                      <p>HT: <strong>{formatCurrency(Number(quote.subtotal || 0))}</strong></p>
                      <p>TVA: <strong>{formatCurrency(Number(quote.vatAmount || 0))}</strong></p>
                      <p>TTC: <strong>{formatCurrency(Number(quote.total || 0))}</strong></p>
                    </div>
                  </section>
                ))}
                <div className="border-t-2 border-zinc-300 pt-3 text-right font-semibold">
                  CA prévu: {formatCurrency(selectedBudgetRow.ht)} HT + {formatCurrency(selectedBudgetRow.tva)} TVA = {formatCurrency(selectedBudgetRow.ttc)} TTC
                </div>
              </div>
            )}

            {selectedBudgetRow.label === 'CA facturé' && data && (
              <div className="space-y-4">
                {(data.invoices || [])
                  .filter((invoice) => invoice.status === 'SENT' || invoice.status === 'PAID')
                  .map((invoice) => (
                    <section key={invoice.id} className="border border-zinc-200 bg-zinc-50 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-semibold text-zinc-900">Facture {invoice.number}</h5>
                          <p className="text-sm text-zinc-600">Statut: {invoice.status === 'PAID' ? 'Payée' : 'Envoyée'}</p>
                        </div>
                        <p className="text-sm font-medium text-zinc-700">{formatCurrency(Number(invoice.total || 0))} TTC</p>
                      </div>
                      {invoice.items.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-white text-zinc-700">
                              <tr>
                                <th className="border border-zinc-200 px-2 py-1">Ligne</th>
                                <th className="border border-zinc-200 px-2 py-1">Description</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">Quantité</th>
                                <th className="border border-zinc-200 px-2 py-1">Unité</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">PU HT</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">TVA</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="border border-zinc-200 px-2 py-1 font-medium">{item.title}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-zinc-600">{item.description || '-'}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{Number(item.quantity || 0)}</td>
                                  <td className="border border-zinc-200 px-2 py-1">{item.unit || '-'}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(Number(item.unitPrice || 0))}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{Number(item.vatRate || 0).toFixed(2)}%</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(Number(item.total || 0))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-600">Aucune ligne dans cette facture.</p>
                      )}
                      <div className="mt-3 grid gap-2 text-right text-sm sm:grid-cols-3">
                        <p>HT: <strong>{formatCurrency(Number(invoice.subtotal || 0))}</strong></p>
                        <p>TVA: <strong>{formatCurrency(Number(invoice.vatAmount || 0))}</strong></p>
                        <p>TTC: <strong>{formatCurrency(Number(invoice.total || 0))}</strong></p>
                      </div>
                    </section>
                  ))}
                <div className="border-t-2 border-zinc-300 pt-3 text-right font-semibold">
                  CA facturé: {formatCurrency(selectedBudgetRow.ht)} HT + {formatCurrency(selectedBudgetRow.tva)} TVA = {formatCurrency(selectedBudgetRow.ttc)} TTC
                </div>
              </div>
            )}

            {selectedBudgetRow.label === 'CA encaissé' && data && (
              <div className="space-y-4">
                {(data.invoices || [])
                  .filter((invoice) => invoice.status === 'PAID')
                  .map((invoice) => (
                    <section key={invoice.id} className="border border-zinc-200 bg-zinc-50 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <h5 className="font-semibold text-zinc-900">Facture {invoice.number}</h5>
                          <p className="text-sm text-zinc-600">Statut: Payée</p>
                        </div>
                        <p className="text-sm font-medium text-zinc-700">{formatCurrency(Number(invoice.total || 0))} TTC</p>
                      </div>
                      {invoice.items.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse text-left text-sm">
                            <thead className="bg-white text-zinc-700">
                              <tr>
                                <th className="border border-zinc-200 px-2 py-1">Ligne</th>
                                <th className="border border-zinc-200 px-2 py-1">Description</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">Quantité</th>
                                <th className="border border-zinc-200 px-2 py-1">Unité</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">PU HT</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">TVA</th>
                                <th className="border border-zinc-200 px-2 py-1 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoice.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="border border-zinc-200 px-2 py-1 font-medium">{item.title}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-zinc-600">{item.description || '-'}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{Number(item.quantity || 0)}</td>
                                  <td className="border border-zinc-200 px-2 py-1">{item.unit || '-'}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(Number(item.unitPrice || 0))}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{Number(item.vatRate || 0).toFixed(2)}%</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(Number(item.total || 0))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-600">Aucune ligne dans cette facture.</p>
                      )}
                      <div className="mt-3 grid gap-2 text-right text-sm sm:grid-cols-3">
                        <p>HT: <strong>{formatCurrency(Number(invoice.subtotal || 0))}</strong></p>
                        <p>TVA: <strong>{formatCurrency(Number(invoice.vatAmount || 0))}</strong></p>
                        <p>TTC: <strong>{formatCurrency(Number(invoice.total || 0))}</strong></p>
                      </div>
                    </section>
                  ))}
                <div className="border-t-2 border-zinc-300 pt-3 text-right font-semibold">
                  CA encaissé: {formatCurrency(selectedBudgetRow.ht)} HT + {formatCurrency(selectedBudgetRow.tva)} TVA = {formatCurrency(selectedBudgetRow.ttc)} TTC
                </div>
              </div>
            )}

            {selectedBudgetRow.label === 'Coûts prévus' && data && (
              <div className="space-y-4">
                {(data.workOrders || []).map((workOrder) => (
                  <section key={workOrder.id} className="border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-3">
                      <h5 className="font-semibold text-zinc-900">{workOrder.reference} - {workOrder.title}</h5>
                      <p className="text-sm text-zinc-600">Étapes prises en compte dans les coûts prévus</p>
                    </div>
                    {workOrder.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-white text-zinc-700">
                            <tr>
                              <th className="border border-zinc-200 px-2 py-1">Étape</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Quantité</th>
                              <th className="border border-zinc-200 px-2 py-1">Unité</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Coût unitaire HT</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">TVA achat</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Coût HT</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">TVA en euros</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Total TTC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workOrder.items.map((item) => {
                              const quantity = Number(item.quantity || 0);
                              const unitCost = Number(item.unitCost || 0);
                              const vatRate = Number(item.purchaseVatRate || 0);
                              const ht = quantity * unitCost;
                              const tva = ht * vatRate / 100;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-zinc-200 px-2 py-1 font-medium">{item.title}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{quantity}</td>
                                  <td className="border border-zinc-200 px-2 py-1">{item.unit || '-'}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(unitCost)}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{vatRate.toFixed(2)}%</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(ht)}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(tva)}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(ht + tva)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-600">Aucune étape dans ce chantier.</p>
                    )}
                  </section>
                ))}
                <div className="border-t-2 border-zinc-300 pt-3 text-right font-semibold">
                  Coûts prévus: {formatCurrency(selectedBudgetRow.ht)} HT + {formatCurrency(selectedBudgetRow.tva)} TVA = {formatCurrency(selectedBudgetRow.ttc)} TTC
                </div>
              </div>
            )}

            {selectedBudgetRow.label === 'Coûts réels' && data && (
              <div className="space-y-4">
                {(data.workLogs || []).map((workLog) => (
                  <section key={workLog.id} className="border border-zinc-200 bg-zinc-50 p-4">
                    <div className="mb-3">
                      <h5 className="font-semibold text-zinc-900">{workLog.title || 'Fiche de suivi'}</h5>
                      {workLog.date && <p className="text-sm text-zinc-600">Date: {new Date(workLog.date).toLocaleDateString('fr-FR')}</p>}
                    </div>
                    {workLog.items.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                          <thead className="bg-white text-zinc-700">
                            <tr>
                              <th className="border border-zinc-200 px-2 py-1">Élément</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Quantité</th>
                              <th className="border border-zinc-200 px-2 py-1">Unité</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Coût unitaire HT</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">TVA achat</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Coût HT</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">TVA en euros</th>
                              <th className="border border-zinc-200 px-2 py-1 text-right">Total TTC</th>
                            </tr>
                          </thead>
                          <tbody>
                            {workLog.items.map((item) => {
                              const quantity = Number(item.quantity || 0);
                              const unitCost = Number(item.unitCost || 0);
                              const totalCost = Number(item.totalCost || quantity * unitCost);
                              const vatRate = Number(item.purchaseVatRate || 0);
                              const tva = totalCost * vatRate / 100;

                              return (
                                <tr key={item.id}>
                                  <td className="border border-zinc-200 px-2 py-1 font-medium">{item.title || item.id}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{quantity}</td>
                                  <td className="border border-zinc-200 px-2 py-1">{item.unit || '-'}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(unitCost)}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{vatRate.toFixed(2)}%</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(totalCost)}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(tva)}</td>
                                  <td className="border border-zinc-200 px-2 py-1 text-right">{formatCurrency(totalCost + tva)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-600">Aucun élément dans cette fiche de suivi.</p>
                    )}
                  </section>
                ))}
                <div className="border-t-2 border-zinc-300 pt-3 text-right font-semibold">
                  Coûts réels: {formatCurrency(selectedBudgetRow.ht)} HT + {formatCurrency(selectedBudgetRow.tva)} TVA = {formatCurrency(selectedBudgetRow.ttc)} TTC
                </div>
              </div>
            )}

            {selectedBudgetRow.label === 'Marge prévisionnelle' && budgetRows.length > 0 && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-lg border border-zinc-200">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead className="bg-zinc-50 text-zinc-700">
                      <tr>
                        <th className="border-b border-zinc-200 px-4 py-3">Indicateur</th>
                        <th className="border-b border-zinc-200 px-4 py-3 text-right">Valeur HT</th>
                        <th className="border-b border-zinc-200 px-4 py-3 text-right">+ TVA en euros</th>
                        <th className="border-b border-zinc-200 px-4 py-3 text-right">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-emerald-50 text-emerald-800">
                        <td className="border-b border-emerald-100 px-4 py-3 font-semibold">CA prévu</td>
                        <td className="border-b border-emerald-100 px-4 py-3 text-right">{formatCurrency(budgetRows[0].ht)}</td>
                        <td className="border-b border-emerald-100 px-4 py-3 text-right">{formatCurrency(budgetRows[0].tva)}</td>
                        <td className="border-b border-emerald-100 px-4 py-3 text-right font-medium">{formatCurrency(budgetRows[0].ttc)}</td>
                      </tr>
                      <tr className="bg-red-50 text-red-800">
                        <td className="border-b border-red-100 px-4 py-3 font-semibold">Coûts prévus</td>
                        <td className="border-b border-red-100 px-4 py-3 text-right">{formatCurrency(budgetRows[3].ht)}</td>
                        <td className="border-b border-red-100 px-4 py-3 text-right">{formatCurrency(budgetRows[3].tva)}</td>
                        <td className="border-b border-red-100 px-4 py-3 text-right font-medium">{formatCurrency(budgetRows[3].ttc)}</td>
                      </tr>
                      <tr className={selectedBudgetRow.ht >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}>
                        <td className={`px-4 py-3 font-semibold ${selectedBudgetRow.ht >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>Marge prévisionnelle</td>
                        <td className={`px-4 py-3 text-right ${selectedBudgetRow.ht >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>{formatCurrency(selectedBudgetRow.ht)}</td>
                        <td className={`px-4 py-3 text-right ${selectedBudgetRow.ht >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>{formatCurrency(selectedBudgetRow.tva)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${selectedBudgetRow.ht >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>{formatCurrency(selectedBudgetRow.ttc)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedBudgetRow.label === 'Marge actuelle' && budgetRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="border-b border-zinc-200 px-4 py-3">Indicateur</th>
                      <th className="border-b border-zinc-200 px-4 py-3 text-right">Valeur HT</th>
                      <th className="border-b border-zinc-200 px-4 py-3 text-right">+ TVA en euros</th>
                      <th className="border-b border-zinc-200 px-4 py-3 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-emerald-50 text-emerald-800">
                      <td className="border-b border-emerald-100 px-4 py-3 font-semibold">CA facturé</td>
                      <td className="border-b border-emerald-100 px-4 py-3 text-right">{formatCurrency(budgetRows[1].ht)}</td>
                      <td className="border-b border-emerald-100 px-4 py-3 text-right">{formatCurrency(budgetRows[1].tva)}</td>
                      <td className="border-b border-emerald-100 px-4 py-3 text-right font-medium">{formatCurrency(budgetRows[1].ttc)}</td>
                    </tr>
                    <tr className="bg-red-50 text-red-800">
                      <td className="border-b border-red-100 px-4 py-3 font-semibold">Coûts réels</td>
                      <td className="border-b border-red-100 px-4 py-3 text-right">{formatCurrency(budgetRows[5].ht)}</td>
                      <td className="border-b border-red-100 px-4 py-3 text-right">{formatCurrency(budgetRows[5].tva)}</td>
                      <td className="border-b border-red-100 px-4 py-3 text-right font-medium">{formatCurrency(budgetRows[5].ttc)}</td>
                    </tr>
                    <tr className={selectedBudgetRow.ht >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}>
                      <td className="px-4 py-3 font-semibold">Marge actuelle</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(selectedBudgetRow.ht)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(selectedBudgetRow.tva)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(selectedBudgetRow.ttc)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedBudgetRow.label === 'Marge encaissée' && budgetRows.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-zinc-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-zinc-50 text-zinc-700">
                    <tr>
                      <th className="border-b border-zinc-200 px-4 py-3">Indicateur</th>
                      <th className="border-b border-zinc-200 px-4 py-3 text-right">Valeur HT</th>
                      <th className="border-b border-zinc-200 px-4 py-3 text-right">+ TVA en euros</th>
                      <th className="border-b border-zinc-200 px-4 py-3 text-right">Total TTC</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-emerald-50 text-emerald-800">
                      <td className="border-b border-emerald-100 px-4 py-3 font-semibold">CA encaissé</td>
                      <td className="border-b border-emerald-100 px-4 py-3 text-right">{formatCurrency(budgetRows[2].ht)}</td>
                      <td className="border-b border-emerald-100 px-4 py-3 text-right">{formatCurrency(budgetRows[2].tva)}</td>
                      <td className="border-b border-emerald-100 px-4 py-3 text-right font-medium">{formatCurrency(budgetRows[2].ttc)}</td>
                    </tr>
                    <tr className="bg-red-50 text-red-800">
                      <td className="border-b border-red-100 px-4 py-3 font-semibold">Coûts réels</td>
                      <td className="border-b border-red-100 px-4 py-3 text-right">{formatCurrency(budgetRows[5].ht)}</td>
                      <td className="border-b border-red-100 px-4 py-3 text-right">{formatCurrency(budgetRows[5].tva)}</td>
                      <td className="border-b border-red-100 px-4 py-3 text-right font-medium">{formatCurrency(budgetRows[5].ttc)}</td>
                    </tr>
                    <tr className={selectedBudgetRow.ht >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}>
                      <td className="px-4 py-3 font-semibold">Marge encaissée</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(selectedBudgetRow.ht)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(selectedBudgetRow.tva)}</td>
                      <td className="px-4 py-3 text-right font-medium">{formatCurrency(selectedBudgetRow.ttc)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedBudgetRow.label !== 'CA prévu' && selectedBudgetRow.label !== 'CA facturé' && selectedBudgetRow.label !== 'CA encaissé' && selectedBudgetRow.label !== 'Coûts prévus' && selectedBudgetRow.label !== 'Coûts réels' && selectedBudgetRow.label !== 'Marge prévisionnelle' && selectedBudgetRow.label !== 'Marge actuelle' && selectedBudgetRow.label !== 'Marge encaissée' && (
              <div className="space-y-3 text-sm text-zinc-700">
                <p>Valeur HT: <strong>{formatCurrency(selectedBudgetRow.ht)}</strong></p>
                <p>TVA: <strong>{formatCurrency(selectedBudgetRow.tva)}</strong></p>
                <p>Total TTC: <strong>{formatCurrency(selectedBudgetRow.ttc)}</strong></p>
                <p className="text-zinc-600">Le détail des sources de cette ligne sera affiché dans cette modale au fur et à mesure de l’implémentation des calculs détaillés.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
