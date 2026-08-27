import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceOperationCategory, LineItemType, Prisma, VatCategory } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './create-invoice.dto'
import { CreateInvoiceFromWorkOrderDto } from './create-invoice-from-workorder.dto';

// export class CreateInvoiceDto {
//   number!: string;
//   amount!: number;
//   customerId?: string;
//   description?: string;
// }

@Injectable()
export class InvoiceService {
  private static readonly INVOICE_NUMBER_RETRY_LIMIT = 3;

  constructor(private prisma: PrismaService) {}

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) {
      return 0;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private roundMoney(value: number): number {
    return Number(value.toFixed(2));
  }

  private parseRequiredDate(value: unknown, fieldName: string): Date {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${fieldName} must be a valid date.`);
    }
    return date;
  }

  private parseOptionalDate(value: unknown): Date | undefined {
    if (value === null || value === undefined || value === '') {
      return undefined;
    }

    let date: Date;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    } else {
      throw new BadRequestException('Invalid optional date value.');
    }

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid optional date value.');
    }

    return date;
  }

  private isTransactionRetryable(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
  }

  private isInvoiceNumberConflict(error: unknown): boolean {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      return false;
    }

    const target = error.meta?.target;
    if (Array.isArray(target)) {
      return target.includes('number');
    }

    return typeof target === 'string' && target.includes('number');
  }

  private async generateInvoiceNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        invoiceNumberPrefix: true,
        nextInvoiceNumber: true,
        invoiceNumberYear: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const nextInvoiceNumber =
      tenant.invoiceNumberYear === year ? (tenant.nextInvoiceNumber ?? 1) : 1;

    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        invoiceNumberYear: year,
        nextInvoiceNumber: nextInvoiceNumber + 1,
      },
    });

    return `${tenant.invoiceNumberPrefix}-${year}-${String(nextInvoiceNumber).padStart(4, '0')}`;
  }

  async create(tenantId: string, dto: CreateInvoiceDto) {
    if (!dto.invoiceItems?.length) {
      throw new BadRequestException('La facture doit contenir au moins une ligne.');
    }

    let subtotal = 0;
    let vatAmount = 0;

    const items = dto.invoiceItems.map((item, index) => {
      if (!item.title?.trim()) {
        throw new BadRequestException('Chaque ligne de la facture doit avoir un titre.');
      }

      const quantity = this.toNumber(item.quantity);
      const unitPrice = this.toNumber(item.unitPrice);
      const vatRate = this.toNumber(item.vatRate);
      const lineSubtotal = this.roundMoney(quantity * unitPrice);
      const lineVat = this.roundMoney(lineSubtotal * (vatRate / 100));
      const total = this.roundMoney(lineSubtotal + lineVat);

      subtotal += lineSubtotal;
      vatAmount += lineVat;

      return {
        type: item.type ?? LineItemType.OTHER,
        position: index,
        lineIdentifier: item.lineIdentifier?.trim() || String(index + 1),
        notes: [],
        title: item.title.trim(),
        description: item.description?.trim() ?? '',
        quantity,
        unitCode: item.unitCode?.trim() || 'C62',
        unitLabel: item.unit?.trim() || undefined,
        unitPrice,
        vatRate,
        subtotal: lineSubtotal,
        vatCategory: (item.vatCategory as VatCategory | undefined) ?? VatCategory.STANDARD,
      };
    });

    subtotal = this.roundMoney(subtotal);
    vatAmount = this.roundMoney(vatAmount);
    const discountAmount = this.roundMoney(this.toNumber(dto.discountAmount));
    const depositAmount = this.roundMoney(this.toNumber(dto.depositAmount));
    const grossTotal = this.roundMoney(subtotal + vatAmount);
    const total = this.roundMoney(Math.max(grossTotal - discountAmount - depositAmount, 0));

    const {
      invoiceItems: _ignoredInvoiceItems,
      number: _ignoredFrontendNumber,
      customerFirstName: _customerFirstName,
      customerLastName: _customerLastName,
      tenantIban: _tenantIban,
      tenantBic: _tenantBic,
      legalMentions: _legalMentions,
      notes: _notes,
      depositAmount: _depositAmount,
      discountAmount: _discountAmount,
      paidAt: _paidAt,
      ...invoiceData
    } = dto;
    void _ignoredInvoiceItems;
    void _ignoredFrontendNumber;
    const issueDate = this.parseRequiredDate(dto.issueDate, 'issueDate');
    const dueDate = this.parseOptionalDate(dto.dueDate);
    const workOrderStartDate = this.parseOptionalDate(dto.workOrderStartDate);
    const workOrderEndDate = this.parseOptionalDate(dto.workOrderEndDate);
    void _customerFirstName;
    void _customerLastName;
    void _legalMentions;
    void _notes;
    void _depositAmount;
    void _discountAmount;
    void _paidAt;

    void _tenantIban;
    void _tenantBic;

    for (let attempt = 0; attempt < InvoiceService.INVOICE_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const invoiceNumber = await this.generateInvoiceNumber(tx, tenantId);

            return tx.invoice.create({
              data: {
                ...invoiceData,
                number: invoiceNumber,
                issueDate,
                dueDate,
                workOrderStartDate,
                workOrderEndDate,
                tenantId,
                operationCategory: invoiceData.operationCategory ?? InvoiceOperationCategory.SERVICES,
                customerName: dto.customerName,
                customerStreet1: dto.customerStreet1 || '',
                customerCity: dto.customerCity || '',
                customerPostalCode: dto.customerPostalCode || '',
                tenantSirenNumber: invoiceData.tenantSirenNumber || '',
                tenantCountryCode: invoiceData.tenantCountryCode || 'FR',
                customerCountryCode: invoiceData.customerCountryCode || 'FR',
                lineNetTotal: subtotal,
                allowanceTotal: discountAmount,
                taxExclusiveAmount: this.roundMoney(subtotal - discountAmount),
                taxInclusiveAmount: grossTotal,
                prepaidAmount: depositAmount,
                amountDue: total,
                vatAmount,
                internalNotes: dto.notes,
                paymentIban: dto.tenantIban,
                paymentBic: dto.tenantBic,
                notes: dto.legalMentions ? { create: [{ position: 0, text: dto.legalMentions }] } : undefined,
                items: {
                  create: items,
                },
              },
              include: {
                items: {
                  orderBy: {
                    position: 'asc',
                  },
                },
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        const canRetry =
          this.isTransactionRetryable(error) || this.isInvoiceNumberConflict(error);

        if (!canRetry || attempt === InvoiceService.INVOICE_NUMBER_RETRY_LIMIT - 1) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to generate invoice number.');
  }

  async createFromWorkOrder(
    tenantId: string,
    dto: CreateInvoiceFromWorkOrderDto,
  ): Promise<unknown> {
    const workOrder = await this.prisma.workOrder.findFirst({
      where: {
        id: dto.workOrderId,
        tenantId,
      },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
        customer: {
          include: {
            address: true,
          },
        },
        address: true,
        tenant: {
          include: {
            address: true,
          },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException('WorkOrder not found for this tenant.');
    }

    if (!workOrder.customer) {
      throw new BadRequestException('WorkOrder must be linked to a customer.');
    }

    if (!workOrder.customer.address) {
      throw new BadRequestException('Customer must have an address to generate an invoice.');
    }

    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    const discountAmount = this.roundMoney(this.toNumber(dto.discountAmount));
    const depositAmount = this.roundMoney(this.toNumber(dto.depositAmount));

    let subtotal = 0;
    let vatAmount = 0;

    const items = workOrder.items.map((item) => {
      const quantity = this.toNumber(item.quantity);
      const unitPrice = this.toNumber(item.unitPrice);
      const vatRate = this.toNumber(item.vatRate);
      const lineSubtotal = this.roundMoney(quantity * unitPrice);
      const lineVat = this.roundMoney(lineSubtotal * (vatRate / 100));
      const lineTotal = this.roundMoney(lineSubtotal + lineVat);

      subtotal += lineSubtotal;
      vatAmount += lineVat;

      return {
        type: item.type,
        position: item.position,
        title: item.title,
        description: item.description ?? '',
        quantity,
        unitCode: item.unitCode,
        unitLabel: item.unitLabel,
        unitPrice,
        vatRate,
        subtotal: lineSubtotal,
        lineIdentifier: String(item.position + 1),
        notes: [],
        vatCategory: VatCategory.STANDARD,
      };
    });

    subtotal = this.roundMoney(subtotal);
    vatAmount = this.roundMoney(vatAmount);
    const grossTotal = this.roundMoney(subtotal + vatAmount);
    const total = this.roundMoney(Math.max(grossTotal - discountAmount - depositAmount, 0));

    const invoiceData: Prisma.InvoiceUncheckedCreateInput = {
      tenantId,
      customerId: workOrder.customer.id,
      workOrderId: workOrder.id,
      issueDate,
      dueDate,
      workOrderReference: workOrder.reference,
      workOrderTitle: workOrder.title,
      tenantName: workOrder.tenant.name,
      tenantStreet1: workOrder.tenant.address?.street1 ?? '',
      tenantStreet2: workOrder.tenant.address?.street2 ?? undefined,
      tenantPostalCode: workOrder.tenant.address?.postalCode ?? '',
      tenantCity: workOrder.tenant.address?.city ?? '',
      tenantSiretNumber: workOrder.tenant.siretNumber ?? '',
      tenantVatNumber: workOrder.tenant.vatNumber ?? '',
      tenantEmail: workOrder.tenant.email ?? '',
      tenantPhoneNumber: workOrder.tenant.phoneNumber ?? '',
      customerName: [workOrder.customer.firstName, workOrder.customer.lastName].filter(Boolean).join(' ') || workOrder.customer.company || '',
      customerStreet1: workOrder.customer.address.street1,
      customerStreet2: workOrder.customer.address.street2 ?? undefined,
      customerPostalCode: workOrder.customer.address.postalCode,
      customerCity: workOrder.customer.address.city,
      customerEmail: workOrder.customer.email ?? undefined,
      customerPhoneNumber: workOrder.customer.phone ?? workOrder.customer.mobile ?? undefined,
      customerVatNumber: workOrder.customer.vatNumber ?? undefined,
      workOrderStartDate: undefined,
      workOrderEndDate: undefined,
      workOrderAddress: workOrder.address?.street1 ?? undefined,
      workOrderPostalCode: workOrder.address?.postalCode ?? undefined,
      workOrderCity: workOrder.address?.city ?? undefined,
      currency: 'EUR',
      tenantSirenNumber: workOrder.tenant.siretNumber ?? '',
      tenantCountryCode: workOrder.tenant.address?.countryCode ?? 'FR',
      customerCountryCode: workOrder.customer.address.countryCode,
      operationCategory: InvoiceOperationCategory.SERVICES,
      lineNetTotal: subtotal,
      taxExclusiveAmount: subtotal,
      vatAmount,
      taxInclusiveAmount: grossTotal,
      prepaidAmount: depositAmount,
      amountDue: total,
      paymentTerms: dto.paymentTerms,
      internalNotes: dto.notes ?? undefined,
      paymentIban: workOrder.tenant.iban ?? undefined,
      paymentBic: workOrder.tenant.bic ?? undefined,
    };

    for (let attempt = 0; attempt < InvoiceService.INVOICE_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const invoiceNumber = await this.generateInvoiceNumber(tx, tenantId);

            return tx.invoice.create({
              data: {
                ...invoiceData,
                number: invoiceNumber,
                tenantId,
                items: items.length
                  ? {
                      create: items,
                    }
                  : undefined,
              },
              include: {
                items: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );
      } catch (error) {
        if (!this.isTransactionRetryable(error) || attempt === InvoiceService.INVOICE_NUMBER_RETRY_LIMIT - 1) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to generate invoice number.');
  }

  async findAll(tenantId: string) {
    const results = await this.prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
    return results;
  }

  async findOne(tenantId: string, id: string) {
    const results = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });
    return results;

  }

  async update(tenantId: string, id: string, dto: Partial<CreateInvoiceDto>) {
    const {
      invoiceItems,
      number: _number,
      customerFirstName: _customerFirstName,
      customerLastName: _customerLastName,
      tenantIban: _tenantIban,
      tenantBic: _tenantBic,
      legalMentions: _legalMentions,
      depositAmount: _depositAmount,
      discountAmount: _discountAmount,
      paidAt: _paidAt,
      ...invoiceData
    } = dto;
    void _number;
    void _customerFirstName;
    void _customerLastName;
    void _tenantIban;
    void _tenantBic;
    void _legalMentions;
    void _depositAmount;
    void _discountAmount;
    void _paidAt;

    const recalculatedTotals = invoiceItems
      ? invoiceItems.reduce(
          (totals, item) => {
            const lineSubtotal = this.roundMoney(Number(item.subtotal ?? Number(item.quantity) * Number(item.unitPrice)));
            const lineVat = this.roundMoney(lineSubtotal * (Number(item.vatRate) / 100));
            return {
              subtotal: this.roundMoney(totals.subtotal + lineSubtotal),
              vatAmount: this.roundMoney(totals.vatAmount + lineVat),
            };
          },
          { subtotal: 0, vatAmount: 0 },
        )
      : null;

    const existing = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      select: { id: true, allowanceTotal: true, prepaidAmount: true },
    });

    if (!existing) {
      throw new NotFoundException('Facture introuvable pour ce tenant.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: existing.id },
        data: {
          ...invoiceData,
          ...(recalculatedTotals
            ? {
                lineNetTotal: recalculatedTotals.subtotal,
                taxExclusiveAmount: this.roundMoney(recalculatedTotals.subtotal - Number(existing.allowanceTotal)),
                vatAmount: recalculatedTotals.vatAmount,
                taxInclusiveAmount: this.roundMoney(recalculatedTotals.subtotal + recalculatedTotals.vatAmount),
                amountDue: this.roundMoney(
                  recalculatedTotals.subtotal +
                    recalculatedTotals.vatAmount -
                    Number(existing.allowanceTotal) -
                    Number(existing.prepaidAmount),
                ),
              }
            : {}),
          issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
          workOrderStartDate: dto.workOrderStartDate ? new Date(dto.workOrderStartDate) : undefined,
          workOrderEndDate: dto.workOrderEndDate ? new Date(dto.workOrderEndDate) : undefined,
          internalNotes: dto.internalNotes ?? dto.notes,
        } as Prisma.InvoiceUncheckedUpdateInput,
      });

      if (invoiceItems) {
        await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        await tx.invoiceItem.createMany({
          data: invoiceItems.map((item, position) => ({
            invoiceId: existing.id,
            type: item.type ?? LineItemType.OTHER,
            position,
            lineIdentifier: item.lineIdentifier?.trim() || String(position + 1),
            notes: [],
            title: item.title.trim(),
            description: item.description?.trim() ?? '',
            quantity: Number(item.quantity),
            unitCode: item.unitCode?.trim() || 'C62',
            unitLabel: item.unit?.trim() || undefined,
            unitPrice: Number(item.unitPrice),
            vatRate: Number(item.vatRate),
            subtotal: Number(item.subtotal ?? Number(item.quantity) * Number(item.unitPrice)),
            vatCategory: (item.vatCategory as VatCategory | undefined) ?? VatCategory.STANDARD,
          })),
        });
      }
    });

    return this.findOne(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.invoice.deleteMany({
      where: { id, tenantId },
    });
  }
}