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
  subtotal: number | string;
  vatAmount: number | string;
  total: number | string;
};

type InvoiceItem = {
  id: string;
  number: string;
  status: InvoiceStatus;
  subtotal: number | string;
  vatAmount: number | string;
  total: number | string;
};

type WorkOrderItem = {
  id: string;
  quantity: number | string;
  unitCost?: number | string | null;
  purchaseVatRate?: number | string | null;
};

type WorkOrderWithItems = {
  id: string;
  items: WorkOrderItem[];
};

type WorkLogItem = {
  id: string;
  quantity: number | string;
  unitCost: number | string;
  totalCost: number | string;
  purchaseVatRate?: number | string | null;
};

type WorkLogWithItems = {
  id: string;
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

    // 9. Marge encaissée : CA encaissé − coûts réellement payés (0 pour l'instant)
    const margeEncaisseeHt = caEncaisseHt - 0;
    const margeEncaisseeTva = caEncaisseTva - 0;
    const margeEncaisseeTtc = caEncaisseTtc - 0;

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
    </div>
  );
}
