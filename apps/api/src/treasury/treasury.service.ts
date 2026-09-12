import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BankTransactionDirection, BankTransactionType, Prisma, TreasuryAlertSeverity, TreasuryReconciliationStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateReconciliationDto } from './create-reconciliation.dto';
import { CreateTransferDto } from './create-transfer.dto';
import { ForecastPaymentTiming, ForecastQueryDto } from './forecast-query.dto';

@Injectable()
export class TreasuryService {
  constructor(private readonly prisma: PrismaService) {}

  async listReconciliations(tenantId: string, paymentAccountId?: string) {
    return this.prisma.treasuryReconciliation.findMany({
      where: { tenantId, paymentAccountId },
      include: { paymentAccount: true, transactions: true },
      orderBy: { reconciledAt: 'desc' },
    });
  }

  async reconcile(tenantId: string, dto: CreateReconciliationDto) {
    const account = await this.prisma.paymentAccount.findFirst({ where: { id: dto.paymentAccountId, tenantId } });
    if (!account) throw new NotFoundException('Compte bancaire introuvable.');
    const reconciledAt = new Date();
    const previous = await this.prisma.treasuryReconciliation.findFirst({ where: { tenantId, paymentAccountId: account.id }, orderBy: { reconciledAt: 'desc' } });
    const transactions = await this.prisma.bankTransaction.findMany({ where: { tenantId, paymentAccountId: account.id, transactionDate: { lte: reconciledAt } } });
    const calculatedBalance = Number(account.openingBalance) + transactions
      .filter((transaction) => !account.openingBalanceDate || transaction.transactionDate >= account.openingBalanceDate)
      .reduce((total, transaction) => total + (transaction.direction === BankTransactionDirection.DEBIT ? -1 : 1) * Number(transaction.amount), 0);
    const actualBalance = Number(dto.actualBalance);
    const difference = actualBalance - calculatedBalance;

    return this.prisma.$transaction(async (tx) => {
      const reconciliation = await tx.treasuryReconciliation.create({
        data: {
          tenantId,
          paymentAccountId: account.id,
          openingBalance: account.openingBalance,
          calculatedBalance: new Prisma.Decimal(calculatedBalance.toFixed(2)),
          actualBalance: new Prisma.Decimal(actualBalance.toFixed(2)),
          difference: new Prisma.Decimal(difference.toFixed(2)),
          reconciledAt,
          previousReconciliationDate: previous?.reconciledAt,
          status: Math.abs(difference) < 0.01 ? TreasuryReconciliationStatus.COMPLETED : TreasuryReconciliationStatus.DISCREPANCY,
          notes: dto.notes?.trim() || undefined,
        },
      });
      await tx.bankTransaction.updateMany({ where: { tenantId, paymentAccountId: account.id, transactionDate: { lte: reconciledAt }, reconciliationId: null }, data: { reconciliationId: reconciliation.id } });
      return tx.treasuryReconciliation.findUnique({ where: { id: reconciliation.id }, include: { paymentAccount: true, transactions: true } });
    });
  }

  async listTransfers(tenantId: string) {
    return this.prisma.treasuryTransfer.findMany({ where: { tenantId }, include: { fromAccount: true, toAccount: true, transactions: true }, orderBy: { transferDate: 'desc' } });
  }

  async createTransfer(tenantId: string, dto: CreateTransferDto) {
    if (dto.fromAccountId === dto.toAccountId) throw new BadRequestException('Les comptes du virement doivent être différents.');
    const accounts = await this.prisma.paymentAccount.findMany({ where: { tenantId, id: { in: [dto.fromAccountId, dto.toAccountId] }, archivedAt: null } });
    if (accounts.length !== 2) throw new NotFoundException('Les deux comptes bancaires doivent appartenir à l’entreprise et être actifs.');
    const from = accounts.find((account) => account.id === dto.fromAccountId)!;
    const to = accounts.find((account) => account.id === dto.toAccountId)!;
    const currency = (dto.currency || from.currency).trim().toUpperCase();
    if (currency !== from.currency || currency !== to.currency) throw new BadRequestException('Un virement interne doit utiliser la devise des deux comptes.');

    return this.prisma.$transaction(async (tx) => {
      const transfer = await tx.treasuryTransfer.create({ data: { tenantId, fromAccountId: from.id, toAccountId: to.id, amount: new Prisma.Decimal(dto.amount.toFixed(2)), currency, transferDate: dto.transferDate, label: dto.label?.trim() || undefined } });
      await tx.bankTransaction.create({ data: { tenantId, paymentAccountId: from.id, amount: new Prisma.Decimal(dto.amount.toFixed(2)), direction: BankTransactionDirection.DEBIT, currency, transactionDate: dto.transferDate, label: dto.label?.trim() || 'Virement interne', transactionType: BankTransactionType.TRANSFER, transferId: transfer.id } });
      await tx.bankTransaction.create({ data: { tenantId, paymentAccountId: to.id, amount: new Prisma.Decimal(dto.amount.toFixed(2)), direction: BankTransactionDirection.CREDIT, currency, transactionDate: dto.transferDate, label: dto.label?.trim() || 'Virement interne', transactionType: BankTransactionType.TRANSFER, transferId: transfer.id } });
      return tx.treasuryTransfer.findUnique({ where: { id: transfer.id }, include: { fromAccount: true, toAccount: true, transactions: true } });
    });
  }

  async listAlerts(tenantId: string) {
    const accounts = await this.prisma.paymentAccount.findMany({ where: { tenantId, archivedAt: null } });
    const expenses = await this.prisma.companyExpense.findMany({ where: { tenantId, paidAt: null, dueDate: { lt: new Date() } } });
    const alerts: Array<{
      code: string;
      severity: TreasuryAlertSeverity;
      title: string;
      message: string;
      paymentAccountId?: string;
    }> = [];
    for (const account of accounts) {
      const transactions = await this.prisma.bankTransaction.findMany({ where: { tenantId, paymentAccountId: account.id } });
      const balance = Number(account.openingBalance) + transactions.reduce((total, transaction) => total + (transaction.direction === BankTransactionDirection.DEBIT ? -1 : 1) * Number(transaction.amount), 0);
      if (balance < 0) alerts.push({ code: `NEGATIVE_BALANCE_${account.id}`, severity: TreasuryAlertSeverity.CRITICAL, title: 'Solde négatif', message: `Le compte ${account.name} présente un solde négatif.`, paymentAccountId: account.id });
      else if (balance < 1000) alerts.push({ code: `LOW_BALANCE_${account.id}`, severity: TreasuryAlertSeverity.WARNING, title: 'Solde faible', message: `Le compte ${account.name} est inférieur à 1 000 ${account.currency}.`, paymentAccountId: account.id });
    }
    if (expenses.length) alerts.push({ code: 'OVERDUE_EXPENSES', severity: TreasuryAlertSeverity.WARNING, title: 'Dépenses en retard', message: `${expenses.length} dépense(s) ont dépassé leur échéance.` });
    return alerts;
  }

  async forecast(tenantId: string, query: ForecastQueryDto) {
    const start = this.startOfDay(new Date());
    const horizonDays = Number(query.horizonDays ?? 90);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + horizonDays);
    const accounts = await this.prisma.paymentAccount.findMany({ where: { tenantId, archivedAt: null, ...(query.paymentAccountId ? { id: query.paymentAccountId } : {}) } });
    if (accounts.length === 0) {
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        horizonDays,
        assumptions: { paymentTiming: query.paymentTiming, paymentDelayDays: query.paymentDelayDays },
        points: [],
        sources: [],
        diagnostics: { code: query.paymentAccountId ? 'ACCOUNT_NOT_FOUND' : 'NO_ACTIVE_ACCOUNT', message: query.paymentAccountId ? 'Le compte sélectionné est introuvable ou archivé.' : 'Aucun compte bancaire actif ne peut servir de solde de départ.' },
      };
    }
    const accountIds = accounts.map((account) => account.id);
    const [transactions, expenses, invoices, recurringInvoices, tenant] = await Promise.all([
      this.prisma.bankTransaction.findMany({ where: { tenantId, paymentAccountId: { in: accountIds }, transactionDate: { lte: start } } }),
      this.prisma.companyExpense.findMany({ where: { tenantId, OR: [{ paymentAccountId: { in: accountIds } }, { paymentAccountId: null }], paidAt: null } }),
      this.prisma.invoice.findMany({ where: { tenantId, status: { in: ['ISSUED'] }, dueDate: { gte: start, lte: end } }, include: { payments: true } }),
      this.prisma.recurringInvoice.findMany({ where: { tenantId, status: 'ACTIVE', nextOccurrenceDate: { not: null, lte: end } }, include: { invoices: { orderBy: { issueDate: 'desc' }, take: 1 }, items: true } }),
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { VatLiabilityRegime: true, vatReturnFrequency: true } }),
    ]);
    const sources = new Map<string, ForecastLine>();
    const addSource = (line: ForecastLine) => {
      if (!sources.has(line.sourceKey)) sources.set(line.sourceKey, line);
    };

    for (const invoice of invoices) {
      const amountDue = Number(invoice.amountDue ?? invoice.taxInclusiveAmount);
      const paidAmount = invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
      const remaining = amountDue - paidAmount;
      if (remaining <= 0) continue;
      const paymentDate = this.paymentDate(invoice.issueDate ?? start, invoice.dueDate, query);
      addSource({ sourceKey: `invoice:${invoice.id}:${invoice.dueDate?.toISOString()}`, date: paymentDate, amount: remaining, direction: 'INFLOW', currency: invoice.currency, label: `Facture ${invoice.number ?? invoice.id}`, sourceType: 'INVOICE', sourceId: invoice.id });
      this.addVatSource(addSource, invoice.id, `TVA - Facture ${invoice.number ?? invoice.id}`, Number(invoice.vatAmount), invoice.currency, paymentDate, tenant, end);
    }
    const materializedRecurringDates = new Set(invoices.filter((invoice) => invoice.recurringInvoiceId && invoice.recurrenceDate).map((invoice) => `${invoice.recurringInvoiceId}:${this.isoDate(invoice.recurrenceDate!)}`));
    for (const recurring of recurringInvoices) {
      const sample = recurring.invoices[0];
      const sampleAmountDue = sample?.amountDue ?? sample?.taxInclusiveAmount;
      const estimatedAmountDue = recurring.items.reduce((total, item) => {
        const net = Number(item.quantity) * Number(item.unitPrice) / Math.max(Number(item.baseQuantity ?? 1), 1);
        const vat = item.vatCategory === 'STANDARD' ? net * (Number(item.vatRate ?? 0) / 100) : 0;
        return total + net + vat;
      }, 0);
      const recurringAmountDue = Number(sampleAmountDue ?? estimatedAmountDue);
      if (recurringAmountDue <= 0 || !recurring.nextOccurrenceDate) continue;
      for (let date = new Date(recurring.nextOccurrenceDate); date <= end; date = this.addInterval(date, recurring.recurrenceUnit, recurring.interval)) {
        if (date < start) continue;
        if (materializedRecurringDates.has(`${recurring.id}:${this.isoDate(date)}`)) continue;
        const paymentDate = this.paymentDate(date, null, query);
        addSource({ sourceKey: `recurring-invoice:${recurring.id}:${this.isoDate(date)}`, date: paymentDate, amount: recurringAmountDue, direction: 'INFLOW', currency: recurring.currency, label: `Facturation récurrente ${recurring.name}`, sourceType: 'RECURRING_INVOICE', sourceId: recurring.id });
        const recurringVatAmount = sample?.vatAmount !== undefined
          ? Number(sample.vatAmount)
          : recurring.items.reduce((total, item) => {
              const net = Number(item.quantity) * Number(item.unitPrice) / Math.max(Number(item.baseQuantity ?? 1), 1);
              return total + (item.vatCategory === 'STANDARD' ? net * (Number(item.vatRate ?? 0) / 100) : 0);
            }, 0);
        this.addVatSource(addSource, recurring.id, `TVA - Facturation récurrente ${recurring.name}`, recurringVatAmount, recurring.currency, paymentDate, tenant, end, `recurring-invoice:${recurring.id}:${this.isoDate(date)}`);
      }
    }
    for (const expense of expenses) {
      if (expense.recurrenceTemplateId) continue;
      const isRecurring = Boolean(expense.recurrenceUnit && expense.nextDueDate);
      if (!isRecurring && expense.dueDate >= start && expense.dueDate <= end) addSource({ sourceKey: `expense:${expense.id}:${this.isoDate(expense.dueDate)}`, date: expense.dueDate, amount: Number(expense.taxInclusiveAmount), direction: 'OUTFLOW', currency: expense.currency, label: expense.label, sourceType: 'EXPENSE', sourceId: expense.id, paymentAccountId: expense.paymentAccountId ?? undefined });
      if (isRecurring && expense.nextDueDate) {
        for (let date = new Date(expense.nextDueDate); date <= end; date = this.addExpenseInterval(date, expense.recurrenceUnit, expense.recurrenceInterval ?? 1)) {
          if (date < start || (expense.recurrenceEndDate && date > expense.recurrenceEndDate)) continue;
          addSource({ sourceKey: `recurring-expense:${expense.id}:${this.isoDate(date)}`, date, amount: Number(expense.taxInclusiveAmount), direction: 'OUTFLOW', currency: expense.currency, label: expense.label, sourceType: 'RECURRING_EXPENSE', sourceId: expense.id, paymentAccountId: expense.paymentAccountId ?? undefined });
        }
      }
    }

    const currentBalances = accounts.map((account) => ({ accountId: account.id, currency: account.currency, balance: Number(account.openingBalance) + transactions.filter((transaction) => transaction.paymentAccountId === account.id && (!account.openingBalanceDate || transaction.transactionDate >= account.openingBalanceDate)).reduce((total, transaction) => total + (transaction.direction === BankTransactionDirection.DEBIT ? -1 : 1) * Number(transaction.amount), 0) }));
    const points = new Map<string, ForecastPoint>();
    for (const balance of currentBalances) points.set(this.isoDate(start) + ':' + balance.currency, { date: start.toISOString(), currency: balance.currency, openingBalance: balance.balance, inflows: 0, outflows: 0, closingBalance: balance.balance, lines: [] });
    for (const line of sources.values()) {
      const account = currentBalances.find((item) => item.accountId === line.paymentAccountId) ?? currentBalances.find((item) => item.currency === line.currency);
      if (!account) continue;
      const key = `${this.isoDate(line.date)}:${account.currency}`;
      const point = points.get(key) ?? { date: line.date.toISOString(), currency: account.currency, openingBalance: 0, inflows: 0, outflows: 0, closingBalance: 0, lines: [] };
      if (line.direction === 'INFLOW') point.inflows += line.amount; else point.outflows += line.amount;
      point.lines.push(line);
      points.set(key, point);
    }
    for (const balance of currentBalances) {
      const key = this.isoDate(end) + ':' + balance.currency;
      if (!points.has(key)) points.set(key, { date: end.toISOString(), currency: balance.currency, openingBalance: 0, inflows: 0, outflows: 0, closingBalance: 0, lines: [] });
    }
    const sortedPoints = [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
    for (const currency of new Set(sortedPoints.map((point) => point.currency))) {
      let running = sortedPoints.find((point) => point.currency === currency)?.openingBalance ?? 0;
      for (const point of sortedPoints.filter((item) => item.currency === currency)) { point.openingBalance = running; point.closingBalance = running + point.inflows - point.outflows; running = point.closingBalance; }
    }
    const diagnostics = sources.size === 0
      ? { code: 'NO_FORECAST_SOURCE', message: 'Aucun encaissement ou décaissement futur exploitable sur cet horizon. Ajoutez une facture échue, une dépense impayée ou une récurrence paramétrée.' }
      : sortedPoints.length === 0
        ? { code: 'NO_PROJECTABLE_POINT', message: 'Les sources disponibles ne correspondent à aucun compte ou aucune devise active.' }
        : undefined;
    return { startDate: start.toISOString(), endDate: end.toISOString(), horizonDays, assumptions: { paymentTiming: query.paymentTiming, paymentDelayDays: query.paymentDelayDays }, points: sortedPoints, sources: [...sources.values()], diagnostics };
  }

  private addVatSource(
    addSource: (line: ForecastLine) => void,
    sourceId: string,
    label: string,
    vatAmount: number,
    currency: string,
    paymentDate: Date,
    tenant: { VatLiabilityRegime: string; vatReturnFrequency: string } | null,
    forecastEnd: Date,
    sourceKeyPrefix = `invoice:${sourceId}`,
  ) {
    if (tenant?.VatLiabilityRegime !== 'LIABLE' || vatAmount <= 0) return;
    const settlementDate = this.vatSettlementDate(paymentDate, tenant.vatReturnFrequency);
    if (settlementDate > forecastEnd) return;
    addSource({
      sourceKey: `vat:${sourceKeyPrefix}:${this.isoDate(paymentDate)}`,
      date: settlementDate,
      amount: vatAmount,
      direction: 'OUTFLOW',
      currency,
      label,
      sourceType: 'VAT',
      sourceId,
    });
  }

  private vatSettlementDate(paymentDate: Date, frequency: string) {
    const result = new Date(Date.UTC(paymentDate.getUTCFullYear(), paymentDate.getUTCMonth(), 20));
    if (frequency === 'MONTHLY') {
      result.setUTCMonth(result.getUTCMonth() + 1);
      return result;
    }

    const quarterlyMonths = [0, 3, 6, 9];
    const nextMonth = quarterlyMonths.find((month) => month > paymentDate.getUTCMonth());
    result.setUTCMonth(nextMonth ?? quarterlyMonths[0]);
    if (nextMonth === undefined) result.setUTCFullYear(result.getUTCFullYear() + 1);
    return result;
  }

  private startOfDay(date: Date) { return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); }
  private isoDate(date: Date) { return date.toISOString().slice(0, 10); }
  private paymentDate(generationDate: Date, dueDate: Date | null, query: ForecastQueryDto) { const date = query.paymentTiming === ForecastPaymentTiming.GENERATION ? generationDate : query.paymentTiming === ForecastPaymentTiming.ARBITRARY_DAYS ? generationDate : dueDate ?? generationDate; const result = new Date(date); if (query.paymentTiming === ForecastPaymentTiming.ARBITRARY_DAYS) result.setUTCDate(result.getUTCDate() + Number(query.paymentDelayDays ?? 0)); return result; }
  private addInterval(date: Date, unit: string, interval: number) { const result = new Date(date); if (unit === 'DAY') result.setUTCDate(result.getUTCDate() + interval); if (unit === 'WEEK') result.setUTCDate(result.getUTCDate() + interval * 7); if (unit === 'MONTH') result.setUTCMonth(result.getUTCMonth() + interval); if (unit === 'YEAR') result.setUTCFullYear(result.getUTCFullYear() + interval); return result; }
  private addExpenseInterval(date: Date, unit: string | null, interval: number) { const result = new Date(date); if (unit === 'DAILY') result.setUTCDate(result.getUTCDate() + interval); if (unit === 'WEEKLY') result.setUTCDate(result.getUTCDate() + interval * 7); if (unit === 'MONTHLY') result.setUTCMonth(result.getUTCMonth() + interval); if (unit === 'YEARLY') result.setUTCFullYear(result.getUTCFullYear() + interval); return result; }
}

interface ForecastLine { sourceKey: string; date: Date; amount: number; direction: 'INFLOW' | 'OUTFLOW'; currency: string; label: string; sourceType: string; sourceId: string; paymentAccountId?: string; }
interface ForecastPoint { date: string; currency: string; openingBalance: number; inflows: number; outflows: number; closingBalance: number; lines: ForecastLine[]; }
