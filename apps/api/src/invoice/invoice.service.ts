import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceAdjustmentType, InvoiceKind, InvoiceOperationCategory, LineItemType, Prisma, VatCategory } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './create-invoice.dto'
import { CreateInvoiceItemDto } from './create-invoice-item.dto';
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

  private normalizeAdjustments(adjustments: CreateInvoiceDto['adjustments'] | undefined) {
    return (adjustments ?? []).map((adjustment, index) => {
      const amount = this.roundMoney(this.toNumber(adjustment.amount));
      if (amount < 0) {
        throw new BadRequestException('Le montant d’un ajustement doit être positif.');
      }

      return {
        position: index,
        type: adjustment.type,
        amount,
        baseAmount: adjustment.baseAmount === undefined ? undefined : this.roundMoney(this.toNumber(adjustment.baseAmount)),
        percentage: adjustment.percentage === undefined ? undefined : this.toNumber(adjustment.percentage),
        vatCategory: adjustment.vatCategory,
        vatRate: adjustment.vatRate === undefined ? undefined : this.toNumber(adjustment.vatRate),
        reason: adjustment.reason?.trim() || undefined,
        reasonCode: adjustment.reasonCode?.trim() || undefined,
      };
    });
  }

  private calculateAdjustmentTotals(adjustments: ReturnType<InvoiceService['normalizeAdjustments']>) {
    return adjustments.reduce(
      (totals, adjustment) => {
        const signedAmount = adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? -adjustment.amount : adjustment.amount;
        const vatAmount = adjustment.vatCategory === VatCategory.STANDARD
          ? this.roundMoney(adjustment.amount * (this.toNumber(adjustment.vatRate) / 100)) * (adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? -1 : 1)
          : 0;
        return {
          allowanceTotal: this.roundMoney(totals.allowanceTotal + (adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? adjustment.amount : 0)),
          chargeTotal: this.roundMoney(totals.chargeTotal + (adjustment.type === InvoiceAdjustmentType.CHARGE ? adjustment.amount : 0)),
          taxExclusiveAmount: this.roundMoney(totals.taxExclusiveAmount + signedAmount),
          vatAmount: this.roundMoney(totals.vatAmount + vatAmount),
        };
      },
      { allowanceTotal: 0, chargeTotal: 0, taxExclusiveAmount: 0, vatAmount: 0 },
    );
  }

  private normalizeItemAdjustments(item: CreateInvoiceItemDto, quantity: number, unitPrice: number) {
    const baseAmount = this.roundMoney(quantity * unitPrice);
    return (item.adjustments ?? []).map((adjustment, index) => {
      const percentage = adjustment.percentage === undefined ? undefined : this.toNumber(adjustment.percentage);
      const amount = percentage === undefined
        ? this.roundMoney(this.toNumber(adjustment.amount))
        : this.roundMoney(baseAmount * percentage / 100);
      if (amount < 0 || (percentage !== undefined && percentage < 0)) {
        throw new BadRequestException('Le montant d’un ajustement de ligne doit être positif.');
      }

      return {
        position: index,
        type: adjustment.type,
        amount,
        baseAmount,
        percentage,
        reason: adjustment.reason?.trim() || undefined,
        reasonCode: adjustment.reasonCode?.trim() || undefined,
      };
    });
  }

  private calculateItemSubtotal(quantity: number, unitPrice: number, adjustments: ReturnType<InvoiceService['normalizeItemAdjustments']>) {
    return this.roundMoney(adjustments.reduce(
      (subtotal, adjustment) => subtotal + (adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? -adjustment.amount : adjustment.amount),
      quantity * unitPrice,
    ));
  }

  private getEffectiveVatRate(vatCategory: VatCategory, vatRate: number): number | null {
    if (vatCategory === VatCategory.ZERO) {
      return null;
    }

    return vatCategory === VatCategory.STANDARD ? vatRate : 0;
  }

  private calculateVatBreakdowns(
    items: Array<{ subtotal: number; vatCategory: VatCategory; vatRate: number }>,
    adjustments: ReturnType<InvoiceService['normalizeAdjustments']>,
  ) {
    const groups = new Map<string, {
      vatCategory: VatCategory;
      vatRate: number | null;
      taxableAmount: number;
    }>();

    for (const item of items) {
      const vatRate = this.getEffectiveVatRate(item.vatCategory, item.vatRate);
      const key = `${item.vatCategory}:${vatRate ?? ''}`;
      const current = groups.get(key);
      if (current) {
        current.taxableAmount = this.roundMoney(current.taxableAmount + item.subtotal);
      } else {
        groups.set(key, {
          vatCategory: item.vatCategory,
          vatRate,
          taxableAmount: this.roundMoney(item.subtotal),
        });
      }
    }

    for (const adjustment of adjustments) {
      const eligibleGroups = Array.from(groups.values()).filter(
        (group) => group.vatCategory === adjustment.vatCategory,
      );
      const eligibleTotal = eligibleGroups.reduce((total, group) => total + group.taxableAmount, 0);
      if (eligibleTotal === 0 || adjustment.amount === 0) {
        continue;
      }

      const signedAmount = adjustment.type === InvoiceAdjustmentType.ALLOWANCE
        ? -adjustment.amount
        : adjustment.amount;
      for (const group of eligibleGroups) {
        group.taxableAmount = this.roundMoney(
          group.taxableAmount + signedAmount * group.taxableAmount / eligibleTotal,
        );
      }
    }

    return Array.from(groups.values()).map((group) => ({
      taxableAmount: group.taxableAmount,
      vatAmount: group.vatCategory === VatCategory.STANDARD
        ? this.roundMoney(group.taxableAmount * (this.toNumber(group.vatRate) / 100))
        : 0,
      vatCategory: group.vatCategory,
      vatRate: group.vatRate ?? undefined,
    }));
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
      const itemAdjustments = this.normalizeItemAdjustments(item, quantity, unitPrice);
      const lineSubtotal = this.calculateItemSubtotal(quantity, unitPrice, itemAdjustments);
      const lineVat = item.vatCategory === VatCategory.STANDARD
        ? this.roundMoney(lineSubtotal * (vatRate / 100))
        : 0;
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
        adjustments: itemAdjustments.length ? { create: itemAdjustments } : undefined,
      };
    });

    subtotal = this.roundMoney(subtotal);
    vatAmount = this.roundMoney(vatAmount);
    const adjustments = this.normalizeAdjustments(dto.adjustments);
    const adjustmentTotals = this.calculateAdjustmentTotals(adjustments);
    const depositAmount = this.roundMoney(this.toNumber(dto.depositAmount));
    const taxExclusiveAmount = this.roundMoney(subtotal + adjustmentTotals.taxExclusiveAmount);
    const vatBreakdowns = this.calculateVatBreakdowns(
      items.map((item) => ({
        subtotal: item.subtotal,
        vatCategory: item.vatCategory,
        vatRate: this.toNumber(item.vatRate),
      })),
      adjustments,
    );
    const adjustedVatAmount = this.roundMoney(vatBreakdowns.reduce((total, breakdown) => total + breakdown.vatAmount, 0));
    const grossTotal = this.roundMoney(taxExclusiveAmount + adjustedVatAmount);
    const total = this.roundMoney(Math.max(grossTotal - depositAmount, 0));

    const invoiceInput = dto as CreateInvoiceDto & {
      subtotal?: unknown;
      total?: unknown;
      paymentMethod?: unknown;
    };
    const sourceInvoiceId = dto.kind === InvoiceKind.CORRECTIVE
      ? dto.correctedInvoiceId
      : dto.kind === InvoiceKind.CREDIT_NOTE
        ? dto.referencedInvoiceId
        : undefined;

    if ((dto.kind === InvoiceKind.CORRECTIVE || dto.kind === InvoiceKind.CREDIT_NOTE) && !sourceInvoiceId) {
      throw new BadRequestException('Une facture source est obligatoire pour ce type de facture.');
    }

    const sourceInvoice = sourceInvoiceId
      ? await this.prisma.invoice.findFirst({
          where: { id: sourceInvoiceId, tenantId },
          select: {
            id: true,
            number: true,
            issueDate: true,
            kind: true,
            taxInclusiveAmount: true,
          },
        })
      : null;

    if (sourceInvoiceId && !sourceInvoice) {
      throw new NotFoundException('La facture source est introuvable pour ce tenant.');
    }

    const {
      invoiceItems: _ignoredInvoiceItems,
      payments: invoicePayments,
      number: _ignoredFrontendNumber,
      customerFirstName: _customerFirstName,
      customerLastName: _customerLastName,
      tenantIban: _tenantIban,
      tenantBic: _tenantBic,
      subtotal: _ignoredFrontendSubtotal,
      total: _ignoredFrontendTotal,
      paymentMethod: _paymentMethod,
      correctedInvoiceId: _correctedInvoiceId,
      referencedInvoiceId: _referencedInvoiceId,
      legalMentions: _legalMentions,
      notes: _notes,
      depositAmount: _depositAmount,
      discountAmount: _discountAmount,
      adjustments: _adjustments,
      paidAt: _paidAt,
      ...invoiceData
    } = invoiceInput;
    void _ignoredInvoiceItems;
    void _ignoredFrontendNumber;
    void _ignoredFrontendSubtotal;
    void _ignoredFrontendTotal;
    void _paymentMethod;
    void _correctedInvoiceId;
    void _referencedInvoiceId;
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
    void _adjustments;
    void _paidAt;
    void _referencedInvoiceId;

    void _tenantIban;
    void _tenantBic;

    const normalizedPayments = invoicePayments?.map((payment) => {
      const amount = this.toNumber(payment.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new BadRequestException('Le montant du paiement doit être supérieur à 0.');
      }

      return {
        amount: this.roundMoney(amount),
        paidAt: this.parseRequiredDate(payment.paidAt, 'paidAt'),
        method: payment.method,
        reference: payment.reference?.trim() || undefined,
        notes: payment.notes?.trim() || undefined,
      };
    });

    for (let attempt = 0; attempt < InvoiceService.INVOICE_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const invoiceNumber = await this.generateInvoiceNumber(tx, tenantId);

            const createdInvoice = await tx.invoice.create({
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
                allowanceTotal: adjustmentTotals.allowanceTotal,
                chargeTotal: adjustmentTotals.chargeTotal,
                taxExclusiveAmount,
                taxInclusiveAmount: grossTotal,
                prepaidAmount: depositAmount,
                amountDue: total,
                vatAmount: adjustedVatAmount,
                internalNotes: dto.notes,
                paymentIban: dto.tenantIban,
                paymentBic: dto.tenantBic,
                correctedInvoiceId: dto.kind === InvoiceKind.CORRECTIVE ? sourceInvoice?.id : undefined,
                correctedInvoiceNumber: dto.kind === InvoiceKind.CORRECTIVE ? sourceInvoice?.number : undefined,
                correctedInvoiceIssueDate: dto.kind === InvoiceKind.CORRECTIVE ? sourceInvoice?.issueDate : undefined,
                notes: dto.legalMentions ? { create: [{ position: 0, text: dto.legalMentions }] } : undefined,
                references: dto.kind === InvoiceKind.CREDIT_NOTE && sourceInvoice
                  ? {
                      create: [{
                        referencedInvoiceId: sourceInvoice.id,
                        referencedInvoiceNumber: sourceInvoice.number ?? '',
                        referencedInvoiceIssueDate: sourceInvoice.issueDate ?? issueDate,
                        referencedInvoiceKind: sourceInvoice.kind,
                        referencedInvoiceTaxInclusiveAmount: sourceInvoice.taxInclusiveAmount,
                        position: 0,
                      }],
                    }
                  : undefined,
                items: {
                  create: items,
                },
                adjustments: adjustments.length ? { create: adjustments } : undefined,
                vatBreakdowns: vatBreakdowns.length ? { create: vatBreakdowns } : undefined,
              },
              include: {
                items: {
                  orderBy: {
                    position: 'asc',
                  },
                  include: { adjustments: { orderBy: { position: 'asc' } } },
                },
                vatBreakdowns: { orderBy: [{ vatCategory: 'asc' }, { vatRate: 'asc' }] },
              },
            });

            if (normalizedPayments?.length) {
              await tx.payment.createMany({
                data: normalizedPayments.map((payment) => ({
                  invoiceId: createdInvoice.id,
                  tenantId,
                  amount: payment.amount,
                  paidAt: payment.paidAt,
                  method: payment.method,
                  reference: payment.reference?.trim() || undefined,
                  notes: payment.notes?.trim() || undefined,
                })),
              });

              const paymentTotal = await tx.payment.aggregate({
                where: { invoiceId: createdInvoice.id },
                _sum: { amount: true },
              });
              const paidAmount = this.roundMoney(this.toNumber(paymentTotal._sum.amount));
              const paymentStatus = paidAmount <= 0
                ? 'UNPAID'
                : paidAmount >= total
                  ? 'PAID'
                  : 'PARTIALLY_PAID';

              await tx.invoice.update({
                where: { id: createdInvoice.id },
                data: { paidAmount, paymentStatus },
              });
            }

            return tx.invoice.findUnique({
              where: { id: createdInvoice.id },
              include: {
                items: { orderBy: { position: 'asc' }, include: { adjustments: { orderBy: { position: 'asc' } } } },
                payments: { orderBy: { paidAt: 'desc' } },
                references: { orderBy: { position: 'asc' } },
                vatBreakdowns: { orderBy: [{ vatCategory: 'asc' }, { vatRate: 'asc' }] },
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
      const vatCategory = item.vatCategory;
      const lineSubtotal = this.roundMoney(quantity * unitPrice);
      const lineVat = vatCategory === VatCategory.STANDARD
        ? this.roundMoney(lineSubtotal * (vatRate / 100))
        : 0;
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
        vatCategory,
      };
    });

    subtotal = this.roundMoney(subtotal);
    vatAmount = this.roundMoney(vatAmount);
    const grossTotal = this.roundMoney(subtotal + vatAmount);
    const total = this.roundMoney(Math.max(grossTotal - discountAmount - depositAmount, 0));
    const vatBreakdowns = this.calculateVatBreakdowns(
      items.map((item) => ({
        subtotal: item.subtotal,
        vatCategory: item.vatCategory,
        vatRate: this.toNumber(item.vatRate),
      })),
      [],
    );

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
                vatBreakdowns: vatBreakdowns.length ? { create: vatBreakdowns } : undefined,
              },
              include: {
                items: true,
                vatBreakdowns: true,
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
          include: { adjustments: { orderBy: { position: 'asc' } } },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        references: {
          orderBy: { position: 'asc' },
        },
        adjustments: {
          orderBy: { position: 'asc' },
        },
        vatBreakdowns: { orderBy: [{ vatCategory: 'asc' }, { vatRate: 'asc' }] },
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
          include: { adjustments: { orderBy: { position: 'asc' } } },
        },
        payments: {
          orderBy: { paidAt: 'desc' },
        },
        references: {
          orderBy: { position: 'asc' },
        },
        adjustments: {
          orderBy: { position: 'asc' },
        },
        vatBreakdowns: { orderBy: [{ vatCategory: 'asc' }, { vatRate: 'asc' }] },
      },
    });
    return results;

  }

  async update(
    tenantId: string,
    id: string,
    dto: Partial<CreateInvoiceDto> & {
      subtotal?: unknown;
      total?: unknown;
      paymentMethod?: unknown;
      vatBreakdowns?: unknown;
    },
  ) {
    const {
      invoiceItems,
      number: _number,
      customerFirstName: _customerFirstName,
      customerLastName: _customerLastName,
      tenantIban: _tenantIban,
      tenantBic: _tenantBic,
      legalMentions: _legalMentions,
      subtotal: _subtotal,
      total: _total,
      paymentMethod: _paymentMethod,
      depositAmount: _depositAmount,
      discountAmount: _discountAmount,
      adjustments,
      vatBreakdowns: _vatBreakdowns,
      paidAt: _paidAt,
      referencedInvoiceId: _referencedInvoiceId,
      ...invoiceData
    } = dto;
    void _number;
    void _customerFirstName;
    void _customerLastName;
    void _tenantIban;
    void _tenantBic;
    void _legalMentions;
    void _subtotal;
    void _total;
    void _paymentMethod;
    void _depositAmount;
    void _discountAmount;
    void _paidAt;
    void _vatBreakdowns;
    void _referencedInvoiceId;

    const normalizedAdjustments = adjustments === undefined ? null : this.normalizeAdjustments(adjustments);
    const recalculatedTotals = invoiceItems
      ? invoiceItems.reduce(
          (totals, item) => {
            const quantity = this.toNumber(item.quantity);
            const unitPrice = this.toNumber(item.unitPrice);
            const itemAdjustments = this.normalizeItemAdjustments(item, quantity, unitPrice);
            const lineSubtotal = this.calculateItemSubtotal(quantity, unitPrice, itemAdjustments);
            const vatCategory = (item.vatCategory as VatCategory | undefined) ?? VatCategory.STANDARD;
            const lineVat = vatCategory === VatCategory.STANDARD
              ? this.roundMoney(lineSubtotal * (Number(item.vatRate) / 100))
              : 0;
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
      include: {
        items: { include: { adjustments: true } },
        adjustments: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Facture introuvable pour ce tenant.');
    }

    await this.prisma.$transaction(async (tx) => {
      const currentAdjustments = normalizedAdjustments ?? this.normalizeAdjustments(existing.adjustments.map((adjustment) => ({
        type: adjustment.type,
        amount: this.toNumber(adjustment.amount),
        baseAmount: adjustment.baseAmount === null ? undefined : this.toNumber(adjustment.baseAmount),
        percentage: adjustment.percentage === null ? undefined : this.toNumber(adjustment.percentage),
        vatCategory: adjustment.vatCategory,
        vatRate: adjustment.vatRate === null ? undefined : this.toNumber(adjustment.vatRate),
        reason: adjustment.reason ?? undefined,
        reasonCode: adjustment.reasonCode ?? undefined,
      })));
      const adjustmentTotals = this.calculateAdjustmentTotals(currentAdjustments);
      const currentLineTotals = recalculatedTotals ?? {
        subtotal: Number(existing.lineNetTotal),
        vatAmount: Number(existing.vatAmount),
      };
      const currentLineItems = invoiceItems
        ? invoiceItems.map((item) => {
            const quantity = this.toNumber(item.quantity);
            const unitPrice = this.toNumber(item.unitPrice);
            const itemAdjustments = this.normalizeItemAdjustments(item, quantity, unitPrice);
            const vatCategory = (item.vatCategory as VatCategory | undefined) ?? VatCategory.STANDARD;
            return {
              subtotal: this.calculateItemSubtotal(quantity, unitPrice, itemAdjustments),
              vatCategory,
              vatRate: this.toNumber(item.vatRate),
            };
          })
        : existing.items.map((item) => ({
            subtotal: Number(item.subtotal),
            vatCategory: item.vatCategory,
            vatRate: this.toNumber(item.vatRate),
          }));
      const vatBreakdowns = this.calculateVatBreakdowns(currentLineItems, currentAdjustments);
          const adjustedVatAmount = this.roundMoney(vatBreakdowns.reduce((total, breakdown) => total + breakdown.vatAmount, 0));
      await tx.invoice.update({
        where: { id: existing.id },
        data: {
          ...invoiceData,
          ...(adjustments !== undefined
            ? {
                allowanceTotal: adjustmentTotals.allowanceTotal,
                chargeTotal: adjustmentTotals.chargeTotal,
              }
            : {}),
          ...(recalculatedTotals || adjustments !== undefined
            ? {
                lineNetTotal: currentLineTotals.subtotal,
                taxExclusiveAmount: this.roundMoney(currentLineTotals.subtotal + adjustmentTotals.taxExclusiveAmount),
                vatAmount: adjustedVatAmount,
                taxInclusiveAmount: this.roundMoney(
                  currentLineTotals.subtotal + adjustmentTotals.taxExclusiveAmount + adjustedVatAmount,
                ),
                amountDue: this.roundMoney(
                  currentLineTotals.subtotal + adjustmentTotals.taxExclusiveAmount + adjustedVatAmount -
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
        for (const [position, item] of invoiceItems.entries()) {
          const quantity = this.toNumber(item.quantity);
          const unitPrice = this.toNumber(item.unitPrice);
          const itemAdjustments = this.normalizeItemAdjustments(item, quantity, unitPrice);
          await tx.invoiceItem.create({
            data: {
            invoiceId: existing.id,
            type: item.type ?? LineItemType.OTHER,
            position,
            lineIdentifier: item.lineIdentifier?.trim() || String(position + 1),
            notes: [],
            title: item.title.trim(),
            description: item.description?.trim() ?? '',
            quantity,
            unitCode: item.unitCode?.trim() || 'C62',
            unitLabel: item.unit?.trim() || undefined,
            unitPrice,
            vatRate: Number(item.vatRate),
            subtotal: this.calculateItemSubtotal(quantity, unitPrice, itemAdjustments),
            vatCategory: (item.vatCategory as VatCategory | undefined) ?? VatCategory.STANDARD,
            adjustments: itemAdjustments.length ? { create: itemAdjustments } : undefined,
            },
          });
        }
      }

      if (adjustments !== undefined) {
        await tx.invoiceAdjustment.deleteMany({ where: { invoiceId: existing.id } });
        if (normalizedAdjustments?.length) {
          await tx.invoiceAdjustment.createMany({
            data: normalizedAdjustments.map((adjustment) => ({
              invoiceId: existing.id,
              ...adjustment,
            })),
          });
        }
      }

      if (invoiceItems !== undefined || adjustments !== undefined) {
        await tx.invoiceVatBreakdown.deleteMany({ where: { invoiceId: existing.id } });
        if (vatBreakdowns.length) {
          await tx.invoiceVatBreakdown.createMany({
            data: vatBreakdowns.map((breakdown) => ({
              invoiceId: existing.id,
              ...breakdown,
            })),
          });
        }
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