import { createHash } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateBankTransactionDto } from './create-bank-transaction.dto';
import { ImportBankTransactionsDto } from './import-bank-transactions.dto';

@Injectable()
export class BankTransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.bankTransaction.findMany({
      where: { tenantId },
      include: { paymentAccount: true, payments: { include: { invoice: { select: { id: true, number: true } } } } },
      orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(tenantId: string, dto: CreateBankTransactionDto) {
    const account = await this.prisma.paymentAccount.findFirst({
      where: { id: dto.paymentAccountId, tenantId, archivedAt: null },
    });
    if (!account) throw new NotFoundException('Compte bancaire introuvable.');

    try {
      return await this.prisma.bankTransaction.create({
        data: {
          tenant: { connect: { id: tenantId } },
          paymentAccount: { connect: { id: account.id } },
          amount: new Prisma.Decimal(Number(dto.amount).toFixed(2)),
          direction: dto.direction,
          currency: dto.currency?.trim().toUpperCase() || account.currency,
          transactionDate: dto.transactionDate,
          label: dto.label?.trim() || undefined,
          reference: dto.reference?.trim() || undefined,
          externalId: dto.externalId?.trim() || undefined,
        },
        include: { paymentAccount: true, payments: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Cette transaction bancaire existe déjà.');
      }
      throw error;
    }
  }

  async importTransactions(tenantId: string, dto: ImportBankTransactionsDto) {
    const account = await this.prisma.paymentAccount.findFirst({ where: { id: dto.paymentAccountId, tenantId, archivedAt: null } });
    if (!account) throw new NotFoundException('Compte bancaire introuvable.');
    if (!dto.fileName?.trim() || !Array.isArray(dto.transactions) || dto.transactions.length === 0) {
      throw new ConflictException('Le fichier ne contient aucune transaction exploitable.');
    }

    const normalized = dto.transactions.map((transaction, sourceIndex) => {
      const date = new Date(transaction.transactionDate);
      const amount = Number(transaction.amount);
      if (!Number.isFinite(amount) || amount <= 0 || Number.isNaN(date.getTime())) throw new ConflictException('Une transaction importée contient une date ou un montant invalide.');
      if (transaction.direction !== 'CREDIT' && transaction.direction !== 'DEBIT') throw new ConflictException('Une transaction importée contient une direction invalide.');
      const currency = transaction.currency?.trim().toUpperCase() || account.currency;
      const label = transaction.label?.trim() || undefined;
      const reference = transaction.reference?.trim() || undefined;
      const providedExternalId = transaction.externalId?.trim();
      const fingerprint = createHash('sha256').update([account.id, date.toISOString(), amount.toFixed(2), transaction.direction, currency, label || '', reference || ''].join('|')).digest('hex');
      return {
        sourceIndex,
        amount: new Prisma.Decimal(amount.toFixed(2)),
        direction: transaction.direction,
        currency,
        transactionDate: date,
        label,
        reference,
        externalId: providedExternalId || `csv:${fingerprint}`,
      };
    });
    const latestReconciliation = await this.prisma.treasuryReconciliation.findFirst({ where: { tenantId, paymentAccountId: account.id }, orderBy: { reconciledAt: 'desc' } });
    const historicalRows = latestReconciliation
      ? normalized.filter((transaction) => transaction.transactionDate <= latestReconciliation.reconciledAt).map((transaction) => ({
        index: transaction.sourceIndex,
        amount: Number(transaction.amount),
        direction: transaction.direction,
        currency: transaction.currency,
        transactionDate: transaction.transactionDate,
        label: transaction.label,
        reference: transaction.reference,
      }))
      : [];
    if (historicalRows.length > 0 && latestReconciliation && !dto.allowHistorical) {
      throw new ConflictException({
        code: 'HISTORICAL_TRANSACTIONS_REQUIRE_REVIEW',
        message: `${historicalRows.length} transaction(s) concernent la réconciliation du ${latestReconciliation.reconciledAt.toISOString().slice(0, 10)}.`,
        reconciliation: { id: latestReconciliation.id, reconciledAt: latestReconciliation.reconciledAt, status: latestReconciliation.status },
        rows: historicalRows,
      });
    }
    const uniqueTransactions = [...new Map(normalized.map((transaction) => [transaction.externalId, transaction])).values()];
    const existing = await this.prisma.bankTransaction.findMany({ where: { tenantId, externalId: { in: uniqueTransactions.map((transaction) => transaction.externalId) } }, select: { externalId: true } });
    const existingIds = new Set(existing.map((transaction) => transaction.externalId));
    const toCreate = uniqueTransactions.filter((transaction) => !existingIds.has(transaction.externalId));
    const duplicateCount = dto.transactions.length - toCreate.length;

    const sourceFormat = ['CSV', 'CAMT.053', 'OFX'].includes(dto.sourceFormat?.trim().toUpperCase() || '')
      ? dto.sourceFormat!.trim().toUpperCase()
      : 'CSV';

    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.bankImportBatch.create({ data: { tenantId, paymentAccountId: account.id, fileName: dto.fileName.trim().slice(0, 255), sourceFormat, rowCount: dto.transactions.length, importedCount: toCreate.length, duplicateCount } });
      if (toCreate.length > 0) {
        await tx.bankTransaction.createMany({ data: toCreate.map((transaction) => ({
          tenantId,
          paymentAccountId: account.id,
          importBatchId: batch.id,
          amount: transaction.amount,
          direction: transaction.direction,
          currency: transaction.currency,
          transactionDate: transaction.transactionDate,
          label: transaction.label,
          reference: transaction.reference,
          externalId: transaction.externalId,
        })) });
      }
      const transactions = await tx.bankTransaction.findMany({ where: { importBatchId: batch.id }, include: { paymentAccount: true, payments: true }, orderBy: { transactionDate: 'desc' } });
      return { batchId: batch.id, importedCount: toCreate.length, duplicateCount, transactions };
    });
  }

  async listImportBatches(tenantId: string, paymentAccountId?: string) {
    return this.prisma.bankImportBatch.findMany({
      where: { tenantId, ...(paymentAccountId ? { paymentAccountId } : {}) },
      include: { paymentAccount: true, _count: { select: { transactions: true } } },
      orderBy: { importedAt: 'desc' },
    });
  }

  async getImportBatch(tenantId: string, id: string) {
    const batch = await this.prisma.bankImportBatch.findFirst({
      where: { id, tenantId },
      include: {
        paymentAccount: true,
        transactions: {
          include: {
            payments: true,
            companyExpenses: true,
            purchases: true,
            reconciliation: true,
            transfer: true,
          },
          orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });
    if (!batch) throw new NotFoundException('Import bancaire introuvable.');
    return batch;
  }

  async rollbackImportBatch(tenantId: string, id: string) {
    const batch = await this.getImportBatch(tenantId, id);
    if (batch.status === 'ROLLED_BACK') {
      throw new ConflictException('Cet import bancaire est déjà annulé.');
    }

    const blockedTransactions = batch.transactions.filter((transaction) => (
      transaction.reconciliationId
      || transaction.payments.length > 0
      || transaction.companyExpenses.length > 0
      || transaction.purchases.length > 0
      || transaction.transferId
    ));
    if (blockedTransactions.length > 0) {
      throw new ConflictException({
        code: 'BANK_IMPORT_ROLLBACK_BLOCKED',
        message: `${blockedTransactions.length} transaction(s) de cet import sont déjà utilisées ou rapprochées.`,
        transactionIds: blockedTransactions.map((transaction) => transaction.id),
      });
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.bankTransaction.deleteMany({ where: { tenantId, importBatchId: id } });
      return tx.bankImportBatch.update({
        where: { id },
        data: { status: 'ROLLED_BACK', cancelledAt: new Date() },
        include: { paymentAccount: true, _count: { select: { transactions: true } } },
      });
    });
  }

  async delete(tenantId: string, id: string) {
    const result = await this.prisma.bankTransaction.deleteMany({ where: { id, tenantId } });
    if (!result.count) throw new NotFoundException('Transaction bancaire introuvable.');
    return { id };
  }
}
