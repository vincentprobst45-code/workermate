import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoicePaymentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreatePaymentDto } from './create-payment.dto';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  private parseDate(value: unknown): Date {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('paidAt must be a valid date.');
    }
    return date;
  }

  private amount(value: unknown): number {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Le montant du paiement doit être supérieur à 0.');
    }
    return Number(amount.toFixed(2));
  }

  private async refreshInvoicePaymentState(tx: Prisma.TransactionClient, invoiceId: string) {
    const [invoice, aggregate] = await Promise.all([
      tx.invoice.findUnique({ where: { id: invoiceId }, select: { amountDue: true } }),
      tx.payment.aggregate({ where: { invoiceId }, _sum: { amount: true } }),
    ]);

    if (!invoice) {
      throw new NotFoundException('Facture introuvable.');
    }

    const paidAmount = Number(aggregate._sum.amount ?? 0);
    const amountDue = Number(invoice.amountDue);
    const paymentStatus = paidAmount <= 0
      ? InvoicePaymentStatus.UNPAID
      : paidAmount >= amountDue
        ? InvoicePaymentStatus.PAID
        : InvoicePaymentStatus.PARTIALLY_PAID;

    await tx.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount: Number(paidAmount.toFixed(2)), paymentStatus },
    });
  }

  async create(tenantId: string, invoiceId: string, dto: CreatePaymentDto) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      select: { id: true },
    });

    if (!invoice) {
      throw new NotFoundException('Facture introuvable pour ce tenant.');
    }

    const amount = this.amount(dto.amount);
    const paidAt = this.parseDate(dto.paidAt);

    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          tenantId,
          amount,
          paidAt,
          method: dto.method,
          reference: dto.reference?.trim() || undefined,
          notes: dto.notes?.trim() || undefined,
        },
      });

      await this.refreshInvoicePaymentState(tx, invoiceId);
      return payment;
    });
  }

  async findAll(tenantId: string, invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { tenantId, invoiceId },
      orderBy: { paidAt: 'desc' },
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { id, tenantId },
        select: { id: true, invoiceId: true },
      });

      if (!payment) {
        throw new NotFoundException('Paiement introuvable pour ce tenant.');
      }

      await tx.payment.delete({ where: { id: payment.id } });
      await this.refreshInvoicePaymentState(tx, payment.invoiceId);
      return { id: payment.id };
    });
  }
}
