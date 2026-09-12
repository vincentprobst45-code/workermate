import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  InvoiceOperationCategory,
  InvoiceStatus,
  Prisma,
  RecurrenceUnit,
  RecurringInvoiceGenerationMode,
  VatCategory,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { InvoiceService } from '../invoice/invoice.service';
import { CreateInvoiceDto } from '../invoice/create-invoice.dto';

type RecurringInvoiceWithGenerationRelations = Prisma.RecurringInvoiceGetPayload<{
  include: {
    customer: { include: { address: true } };
    project: true;
    paymentAccount: true;
    tenant: { include: { address: true; defaultPaymentAccount: true } };
    items: true;
  };
}>;
import { CreateRecurringInvoiceDto } from './create-recurring-invoice.dto';

@Injectable()
export class RecurringInvoiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoiceService: InvoiceService,
  ) {}

  async findAll(tenantId: string) {
    return this.prisma.recurringInvoice.findMany({
      where: { tenantId },
      include: { customer: true, project: true, paymentAccount: true, items: { orderBy: { position: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(tenantId: string, createdById: string | undefined, dto: CreateRecurringInvoiceDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId } });
    if (!customer) throw new BadRequestException('Le client est invalide pour ce tenant.');

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({ where: { id: dto.projectId, tenantId } });
      if (!project) throw new BadRequestException('Le projet est invalide pour ce tenant.');
    }
    if (dto.paymentAccountId) {
      const account = await this.prisma.paymentAccount.findFirst({ where: { id: dto.paymentAccountId, tenantId, archivedAt: null } });
      if (!account) throw new BadRequestException('Le compte bancaire est invalide pour ce tenant.');
    }

    const startDate = new Date(dto.startDate);
    const data: Prisma.RecurringInvoiceCreateInput = {
      tenant: { connect: { id: tenantId } },
      createdBy: createdById ? { connect: { id: createdById } } : undefined,
      customer: { connect: { id: dto.customerId } },
      project: dto.projectId ? { connect: { id: dto.projectId } } : undefined,
      workOrder: dto.workOrderId ? { connect: { id: dto.workOrderId } } : undefined,
      name: dto.name.trim(),
      recurrenceUnit: dto.recurrenceUnit as RecurrenceUnit,
      interval: dto.interval,
      startDate,
      nextOccurrenceDate: dto.nextOccurrenceDate ? new Date(dto.nextOccurrenceDate) : startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      operationCategory: dto.operationCategory as InvoiceOperationCategory,
      generationMode: (dto.generationMode || 'DRAFT') as RecurringInvoiceGenerationMode,
      currency: dto.currency?.trim().toUpperCase() || 'EUR',
      paymentAccount: dto.paymentAccountId ? { connect: { id: dto.paymentAccountId } } : undefined,
      paymentTerms: dto.paymentTerms?.trim() || undefined,
      internalNotes: dto.internalNotes?.trim() || undefined,
      items: {
        create: dto.items.map((item, index) => ({
          position: item.position ?? index,
          type: item.type,
          quantity: item.quantity,
          unitCode: item.unitCode.trim(),
          unitLabel: item.unitLabel?.trim() || undefined,
          unitPrice: item.unitPrice,
          vatCategory: item.vatCategory as VatCategory,
          vatRate: item.vatRate,
          title: item.title.trim(),
          description: item.description?.trim() || undefined,
        })),
      },
    };

    const recurringInvoice = await this.prisma.recurringInvoice.create({
      data,
      include: {
        customer: { include: { address: true } },
        project: true,
        paymentAccount: true,
        tenant: { include: { address: true, defaultPaymentAccount: true } },
        items: { orderBy: { position: 'asc' } },
      },
    });

    const occurrenceDate = recurringInvoice.nextOccurrenceDate;
    if (occurrenceDate && this.isDue(occurrenceDate)) {
      await this.generateOccurrence(recurringInvoice);
    }

    return this.prisma.recurringInvoice.findUnique({
      where: { id: recurringInvoice.id },
      include: { customer: true, project: true, paymentAccount: true, items: { orderBy: { position: 'asc' } } },
    });
  }

  private isDue(date: Date) {
    const today = new Date();
    return date.getTime() <= Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  }

  private addInterval(date: Date, unit: RecurrenceUnit, interval: number) {
    const nextDate = new Date(date);
    if (unit === RecurrenceUnit.DAY) nextDate.setUTCDate(nextDate.getUTCDate() + interval);
    if (unit === RecurrenceUnit.WEEK) nextDate.setUTCDate(nextDate.getUTCDate() + interval * 7);
    if (unit === RecurrenceUnit.MONTH) nextDate.setUTCMonth(nextDate.getUTCMonth() + interval);
    if (unit === RecurrenceUnit.YEAR) nextDate.setUTCFullYear(nextDate.getUTCFullYear() + interval);
    return nextDate;
  }

  private async generateOccurrence(recurringInvoice: RecurringInvoiceWithGenerationRelations) {
    const customerAddress = recurringInvoice.customer.address;
    if (!customerAddress) {
      throw new BadRequestException('Le client doit avoir une adresse pour générer la facture.');
    }

    const tenantAddress = recurringInvoice.tenant.address;
    const paymentAccount = recurringInvoice.paymentAccount ?? recurringInvoice.tenant.defaultPaymentAccount;
    const customerName = [recurringInvoice.customer.firstName, recurringInvoice.customer.lastName].filter(Boolean).join(' ')
      || recurringInvoice.customer.company
      || '';
    const invoiceDto = {
      customerId: recurringInvoice.customerId,
      projectId: recurringInvoice.projectId ?? undefined,
      workOrderId: recurringInvoice.workOrderId ?? undefined,
      issueDate: recurringInvoice.nextOccurrenceDate ?? new Date(),
      dueDate: undefined,
      workOrderReference: recurringInvoice.project?.reference ?? recurringInvoice.name,
      workOrderTitle: recurringInvoice.name,
      tenantName: recurringInvoice.tenant.name,
      tenantStreet1: tenantAddress?.street1 ?? '',
      tenantStreet2: tenantAddress?.street2 ?? undefined,
      tenantPostalCode: tenantAddress?.postalCode ?? '',
      tenantCity: tenantAddress?.city ?? '',
      tenantSiretNumber: recurringInvoice.tenant.siretNumber ?? '',
      tenantVatNumber: recurringInvoice.tenant.vatNumber ?? '',
      tenantSirenNumber: recurringInvoice.tenant.siretNumber ?? '',
      tenantCountryCode: tenantAddress?.countryCode ?? 'FR',
      tenantEmail: recurringInvoice.tenant.email ?? undefined,
      tenantPhoneNumber: recurringInvoice.tenant.phoneNumber ?? undefined,
      tenantIban: paymentAccount?.iban,
      tenantBic: paymentAccount?.bic,
      customerFirstName: recurringInvoice.customer.firstName ?? undefined,
      customerLastName: recurringInvoice.customer.lastName ?? undefined,
      customerName,
      customerStreet1: customerAddress.street1,
      customerStreet2: customerAddress.street2 ?? undefined,
      customerPostalCode: customerAddress.postalCode,
      customerCity: customerAddress.city,
      customerCountryCode: customerAddress.countryCode,
      customerEmail: recurringInvoice.customer.email ?? undefined,
      customerPhoneNumber: recurringInvoice.customer.phone ?? recurringInvoice.customer.mobile ?? undefined,
      customerVatNumber: recurringInvoice.customer.vatNumber ?? undefined,
      status: recurringInvoice.generationMode === RecurringInvoiceGenerationMode.AUTO_ISSUE ? InvoiceStatus.ISSUED : InvoiceStatus.DRAFT,
      currency: recurringInvoice.currency,
      operationCategory: recurringInvoice.operationCategory,
      paymentTerms: recurringInvoice.paymentTerms ?? undefined,
      notes: recurringInvoice.internalNotes ?? undefined,
      invoiceItems: recurringInvoice.items.map((item, index) => ({
        position: index,
        type: item.type,
        title: item.title,
        description: item.description ?? undefined,
        quantity: Number(item.quantity),
        unitCode: item.unitCode,
        unit: item.unitLabel ?? undefined,
        unitPrice: Number(item.unitPrice),
        vatCategory: item.vatCategory,
        vatRate: item.vatRate ? Number(item.vatRate) : 0,
      })),
    } as CreateInvoiceDto;

    const occurrenceDate = recurringInvoice.nextOccurrenceDate ?? new Date();
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { recurringInvoiceId: recurringInvoice.id, recurrenceDate: occurrenceDate },
      select: { id: true },
    });

    if (!existingInvoice) {
      await this.invoiceService.create(recurringInvoice.tenantId, {
        ...invoiceDto,
        recurringInvoiceId: recurringInvoice.id,
        recurrenceDate: occurrenceDate,
      });
    }

    const nextOccurrenceDate = this.addInterval(recurringInvoice.nextOccurrenceDate ?? new Date(), recurringInvoice.recurrenceUnit, recurringInvoice.interval);
    const shouldEnd = Boolean(
      (recurringInvoice.endDate && nextOccurrenceDate > recurringInvoice.endDate)
      || (recurringInvoice.maxOccurrences !== null && recurringInvoice.generatedCount + 1 >= recurringInvoice.maxOccurrences),
    );
    await this.prisma.recurringInvoice.update({
      where: { id: recurringInvoice.id },
      data: {
        lastOccurrenceDate: recurringInvoice.nextOccurrenceDate,
        nextOccurrenceDate: shouldEnd ? null : nextOccurrenceDate,
        generatedCount: { increment: 1 },
        status: shouldEnd ? 'ENDED' : undefined,
      },
    });
  }

  async processDue(tenantId: string) {
    const dueInvoices = await this.prisma.recurringInvoice.findMany({
      where: { tenantId, status: 'ACTIVE', nextOccurrenceDate: { lte: new Date() } },
      include: {
        customer: { include: { address: true } },
        project: true,
        paymentAccount: true,
        tenant: { include: { address: true, defaultPaymentAccount: true } },
        items: { orderBy: { position: 'asc' } },
      },
      orderBy: { nextOccurrenceDate: 'asc' },
    });

    let generatedCount = 0;
    for (const recurringInvoice of dueInvoices) {
      let current = recurringInvoice;
      while (current.nextOccurrenceDate && this.isDue(current.nextOccurrenceDate)) {
        if (current.maxOccurrences !== null && current.generatedCount >= current.maxOccurrences) {
          await this.prisma.recurringInvoice.update({ where: { id: current.id }, data: { status: 'ENDED', nextOccurrenceDate: null } });
          break;
        }

        await this.generateOccurrence(current);
        generatedCount += 1;
        const refreshed = await this.prisma.recurringInvoice.findUnique({
          where: { id: current.id },
          include: {
            customer: { include: { address: true } },
            project: true,
            paymentAccount: true,
            tenant: { include: { address: true, defaultPaymentAccount: true } },
            items: { orderBy: { position: 'asc' } },
          },
        });
        if (!refreshed || refreshed.status !== 'ACTIVE') break;
        current = refreshed;
      }
    }

    return { generatedCount };
  }

  async updateStatus(tenantId: string, id: string, status: 'ACTIVE' | 'PAUSED' | 'ENDED') {
    const result = await this.prisma.recurringInvoice.updateMany({ where: { id, tenantId }, data: { status } });
    if (!result.count) throw new NotFoundException('Facture récurrente introuvable.');
    return this.prisma.recurringInvoice.findFirst({ where: { id, tenantId } });
  }
}