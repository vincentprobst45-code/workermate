import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateInvoiceDto } from './create-invoice.dto'
import { CreateInvoiceFromProjectDto } from './create-invoice-from-project.dto';

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

  private isTransactionRetryable(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
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
    return this.prisma.invoice.create({
      data: { ...dto, tenantId },
    });
  }

  async createFromProject(
    tenantId: string,
    dto: CreateInvoiceFromProjectDto,
  ): Promise<unknown> {
    const project = await this.prisma.project.findFirst({
      where: {
        id: dto.projectId,
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

    if (!project) {
      throw new NotFoundException('Project not found for this tenant.');
    }

    if (!project.customer) {
      throw new BadRequestException('Project must be linked to a customer.');
    }

    if (!project.customer.address) {
      throw new BadRequestException('Customer must have an address to generate an invoice.');
    }

    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    const discountAmount = this.roundMoney(this.toNumber(dto.discountAmount));
    const depositAmount = this.roundMoney(this.toNumber(dto.depositAmount));

    let subtotal = 0;
    let vatAmount = 0;

    const items = project.items.map((item) => {
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
        unit: item.unit,
        unitPrice,
        vatRate,
        total: lineTotal,
      };
    });

    subtotal = this.roundMoney(subtotal);
    vatAmount = this.roundMoney(vatAmount);
    const grossTotal = this.roundMoney(subtotal + vatAmount);
    const total = this.roundMoney(Math.max(grossTotal - discountAmount - depositAmount, 0));

    const invoiceData: Omit<CreateInvoiceDto, 'number'> = {
      customerId: project.customer.id,
      projectId: project.id,
      issueDate,
      dueDate,
      projectReference: project.reference,
      projectTitle: project.title,
      tenantName: project.tenant.name,
      tenantStreet1: project.tenant.address?.street1 ?? '',
      tenantStreet2: project.tenant.address?.street2 ?? undefined,
      tenantPostalCode: project.tenant.address?.postalCode ?? '',
      tenantCity: project.tenant.address?.city ?? '',
      tenantSiretNumber: project.tenant.siretNumber ?? '',
      tenantVatNumber: project.tenant.vatNumber ?? '',
      tenantEmail: project.tenant.email ?? '',
      tenantPhoneNumber: project.tenant.phoneNumber ?? '',
      tenantIban: undefined,
      tenantBic: undefined,
      customerFirstName: project.customer.firstName ?? project.customer.company ?? '',
      customerLastName: project.customer.lastName ?? '',
      customerStreet1: project.customer.address.street1,
      customerStreet2: project.customer.address.street2 ?? undefined,
      customerPostalCode: project.customer.address.postalCode,
      customerCity: project.customer.address.city,
      customerEmail: project.customer.email ?? undefined,
      customerPhoneNumber: project.customer.phone ?? project.customer.mobile ?? undefined,
      customerVatNumber: project.customer.vatNumber ?? undefined,
      projectStartDate: project.startDate ?? undefined,
      projectEndDate: project.endDate ?? undefined,
      projectAddress: project.address?.street1 ?? undefined,
      projectPostalCode: project.address?.postalCode ?? undefined,
      projectCity: project.address?.city ?? undefined,
      currency: 'EUR',
      subtotal,
      vatAmount,
      total,
      paymentTerms: dto.paymentTerms,
      notes: dto.notes ?? project.notes ?? undefined,
      depositAmount: depositAmount > 0 ? depositAmount : undefined,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
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
    });
    return results;
  }

  async findOne(tenantId: string, id: string) {
    const results = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });
    return results;

  }

  async update(tenantId: string, id: string, dto: Partial<CreateInvoiceDto>) {
    return this.prisma.invoice.updateMany({
      where: { id, tenantId },
      data: dto,
    });
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.invoice.deleteMany({
      where: { id, tenantId },
    });
  }
}