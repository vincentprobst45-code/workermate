import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePaymentAccountDto } from './create-payment-account.dto';
import { UpdatePaymentAccountDto } from './update-payment-account.dto';

@Injectable()
export class PaymentAccountService {
  constructor(private readonly prisma: PrismaService) {}

  private normalize(value?: string | null) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private normalizeDate(value?: Date | string | null) {
    if (!value) return undefined;
    const date = value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00.000Z`)
        : new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('La date du solde initial est invalide.');
    }
    return date;
  }

  async findAll(tenantId: string) {
    return this.prisma.paymentAccount.findMany({
      where: { tenantId },
      orderBy: [{ archivedAt: 'asc' }, { name: 'asc' }],
    });
  }

  async create(tenantId: string, dto: CreatePaymentAccountDto) {
    const data: Prisma.PaymentAccountCreateInput = {
      tenant: { connect: { id: tenantId } },
      name: dto.name.trim(),
      bankName: this.normalize(dto.bankName),
      accountHolderName: dto.accountHolderName.trim(),
      iban: dto.iban.replace(/\s/g, '').toUpperCase(),
      bic: this.normalize(dto.bic)?.toUpperCase(),
      currency: dto.currency?.trim().toUpperCase() || 'EUR',
      openingBalance: dto.openingBalance ?? 0,
      openingBalanceDate: this.normalizeDate(dto.openingBalanceDate),
    };

    try {
      const account = await this.prisma.paymentAccount.create({ data });
      return dto.isDefault ? this.setDefault(tenantId, account.id) : account;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Un compte bancaire avec cet IBAN existe deja.');
      }
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: UpdatePaymentAccountDto) {
    await this.requireAccount(tenantId, id);
    const data: Prisma.PaymentAccountUpdateInput = {
      name: dto.name?.trim(),
      bankName: dto.bankName !== undefined ? this.normalize(dto.bankName) : undefined,
      accountHolderName: dto.accountHolderName?.trim(),
      iban: dto.iban !== undefined ? dto.iban.replace(/\s/g, '').toUpperCase() : undefined,
      bic: dto.bic !== undefined ? this.normalize(dto.bic)?.toUpperCase() : undefined,
      currency: dto.currency?.trim().toUpperCase(),
      openingBalance: dto.openingBalance,
      openingBalanceDate: dto.openingBalanceDate === undefined ? undefined : this.normalizeDate(dto.openingBalanceDate),
    };

    try {
      const account = await this.prisma.paymentAccount.update({ where: { id }, data });
      return dto.isDefault ? this.setDefault(tenantId, account.id) : account;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Un compte bancaire avec cet IBAN existe deja.');
      }
      throw error;
    }
  }

  async archive(tenantId: string, id: string) {
    await this.requireAccount(tenantId, id);
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.paymentAccount.update({ where: { id }, data: { archivedAt: new Date() } });
      await tx.tenant.updateMany({
        where: { id: tenantId, defaultPaymentAccountId: id },
        data: { defaultPaymentAccountId: null },
      });
      return account;
    });
  }

  async setDefault(tenantId: string, id: string) {
    const account = await this.requireAccount(tenantId, id);
    if (account.archivedAt) {
      throw new ConflictException('Un compte archive ne peut pas etre principal.');
    }

    await this.prisma.tenant.update({ where: { id: tenantId }, data: { defaultPaymentAccountId: id } });
    return this.prisma.paymentAccount.findUnique({ where: { id } });
  }

  private async requireAccount(tenantId: string, id: string) {
    const account = await this.prisma.paymentAccount.findFirst({ where: { id, tenantId } });
    if (!account) {
      throw new NotFoundException('Compte bancaire introuvable pour ce tenant.');
    }
    return account;
  }
}