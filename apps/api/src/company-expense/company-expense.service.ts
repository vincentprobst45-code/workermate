import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateCompanyExpenseDto } from './create-company-expense.dto';

@Injectable()
export class CompanyExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.companyExpense.findMany({
      where: { tenantId },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(tenantId: string, dto: CreateCompanyExpenseDto) {
    const taxExclusiveAmount = Number(dto.taxExclusiveAmount);
    const vatAmount = Number(dto.vatAmount ?? 0);
    const taxInclusiveAmount = Number(dto.taxInclusiveAmount ?? taxExclusiveAmount + vatAmount);
    if (![taxExclusiveAmount, vatAmount, taxInclusiveAmount].every((value) => Number.isFinite(value) && value >= 0)) {
      throw new BadRequestException('Les montants HT, TVA et TTC doivent être positifs.');
    }

    const isRecurring = Boolean(dto.recurrenceUnit || dto.recurrenceInterval || dto.recurrenceStartDate || dto.recurrenceEndDate || dto.nextDueDate);
    if (isRecurring && (!dto.recurrenceUnit || !dto.recurrenceInterval || !dto.recurrenceStartDate)) {
      throw new BadRequestException('Une dépense récurrente doit préciser son unité, son intervalle et sa date de début.');
    }
    if (dto.recurrenceEndDate && dto.recurrenceStartDate && dto.recurrenceEndDate < dto.recurrenceStartDate) {
      throw new BadRequestException('La fin de récurrence doit être postérieure ou égale à son début.');
    }

    if (dto.paymentAccountId) {
      const account = await this.prisma.paymentAccount.findFirst({ where: { id: dto.paymentAccountId, tenantId, archivedAt: null } });
      if (!account) throw new NotFoundException('Compte bancaire introuvable.');
    }
    if (dto.bankTransactionId) {
      const transaction = await this.prisma.bankTransaction.findFirst({ where: { id: dto.bankTransactionId, tenantId } });
      if (!transaction) throw new NotFoundException('Transaction bancaire introuvable.');
    }

    return this.prisma.companyExpense.create({
      data: {
        tenant: { connect: { id: tenantId } },
        paymentAccount: dto.paymentAccountId ? { connect: { id: dto.paymentAccountId } } : undefined,
        bankTransaction: dto.bankTransactionId ? { connect: { id: dto.bankTransactionId } } : undefined,
        label: dto.label.trim(),
        category: dto.category,
        taxExclusiveAmount: new Prisma.Decimal(taxExclusiveAmount.toFixed(2)),
        vatAmount: new Prisma.Decimal(vatAmount.toFixed(2)),
        taxInclusiveAmount: new Prisma.Decimal(taxInclusiveAmount.toFixed(2)),
        currency: dto.currency?.trim().toUpperCase() || 'EUR',
        dueDate: dto.dueDate,
        paidAt: dto.paidAt,
        recurrenceUnit: isRecurring ? dto.recurrenceUnit : null,
        recurrenceInterval: isRecurring ? dto.recurrenceInterval : null,
        recurrenceStartDate: isRecurring ? dto.recurrenceStartDate : null,
        recurrenceEndDate: isRecurring ? dto.recurrenceEndDate : null,
        nextDueDate: isRecurring ? (dto.nextDueDate ?? dto.dueDate) : null,
      },
    });
  }

  async markPaid(tenantId: string, id: string, paidAt?: Date) {
    const expense = await this.prisma.companyExpense.updateMany({
      where: { id, tenantId },
      data: { paidAt: paidAt ?? new Date() },
    });
    if (!expense.count) throw new NotFoundException('Dépense introuvable.');
    return this.prisma.companyExpense.findFirst({ where: { id, tenantId } });
  }
}
