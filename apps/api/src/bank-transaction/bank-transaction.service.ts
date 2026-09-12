import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateBankTransactionDto } from './create-bank-transaction.dto';

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

  async delete(tenantId: string, id: string) {
    const result = await this.prisma.bankTransaction.deleteMany({ where: { id, tenantId } });
    if (!result.count) throw new NotFoundException('Transaction bancaire introuvable.');
    return { id };
  }
}
