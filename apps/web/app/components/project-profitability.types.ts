import type { ProjectStatus } from '@prisma/client';

export type ProfitabilitySummary = {
  acceptedRevenue: number;
  billedRevenue: number;
  collectedRevenue: number;
  laborConsumed: number;
  materialConsumed: number;
  otherConsumed: number;
  totalConsumed: number;
  assignedPurchasesNotConsumed: number;
  forecastRemaining: number;
  realizedMargin: number;
  realizedMarginRate: number | null;
  forecastMargin: number;
  progressPercent: number;
};

export type ProfitabilitySource = Record<string, unknown>;

export type ProjectProfitability = {
  project: {
    id: string;
    reference: string;
    title: string;
    status: ProjectStatus;
    customerName: string | null;
  };
  summary: ProfitabilitySummary;
  details: {
    quotes: ProfitabilitySource[];
    invoices: ProfitabilitySource[];
    plannedItems: ProfitabilitySource[];
    workLogItems: ProfitabilitySource[];
    companyExpenses: ProfitabilitySource[];
    purchaseItems: ProfitabilitySource[];
  };
};
