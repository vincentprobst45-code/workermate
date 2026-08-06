import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, type WorkOrderItemType } from '@prisma/client';
import { CreateAddressDto } from '../address/create-address.dto';
import { CreateCustomerDto } from '../customer/create-customer.dto';
import { PrismaService } from '../prisma.service';
import { CreateQuoteDto } from './create-quote.dto';

type AddressRecord = {
  id: string;
  street1: string;
  street2: string | null;
  postalCode: string;
  city: string;
  countryCode: string;
};

type CustomerRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  vatNumber: string | null;
  address: AddressRecord | null;
};

type QuoteWithRelations = Prisma.QuoteGetPayload<{
  include: {
    items: true;
    workOrderAddress: true;
  };
}>;

@Injectable()
export class QuoteService {
  private static readonly QUOTE_NUMBER_RETRY_LIMIT = 3;

  constructor(private prisma: PrismaService) {}

  private normalizeOptionalString(value?: string | null): string | undefined {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }

  private parseOptionalDate(value?: string): Date | undefined {
    const trimmed = value?.trim();
    if (!trimmed) {
      return undefined;
    }

    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Date invalide: ${trimmed}`);
    }

    return date;
  }

  private parseRequiredDate(value: string, fieldName: string): Date {
    const date = this.parseOptionalDate(value);
    if (!date) {
      throw new BadRequestException(`${fieldName} est obligatoire.`);
    }

    return date;
  }

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

  private async generateQuoteNumber(
    tx: Prisma.TransactionClient,
    tenantId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const tenant = await tx.tenant.findUnique({
      where: { id: tenantId },
      select: {
        quoteNumberPrefix: true,
        nextQuoteNumber: true,
        quoteNumberYear: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found.');
    }

    const nextQuoteNumber = tenant.quoteNumberYear === year ? (tenant.nextQuoteNumber ?? 1) : 1;

    await tx.tenant.update({
      where: { id: tenantId },
      data: {
        quoteNumberYear: year,
        nextQuoteNumber: nextQuoteNumber + 1,
      },
    });

    return `${tenant.quoteNumberPrefix}-${year}-${String(nextQuoteNumber).padStart(4, '0')}`;
  }

  private sanitizeAddress(address: CreateAddressDto): Prisma.AddressUncheckedCreateInput {
    return {
      tenantId: '',
      street1: address.street1.trim(),
      street2: this.normalizeOptionalString(address.street2),
      postalCode: address.postalCode.trim(),
      city: address.city.trim(),
      region: this.normalizeOptionalString(address.region),
      countryCode: this.normalizeOptionalString(address.countryCode) ?? 'FR',
      latitude: this.normalizeOptionalString(address.latitude),
      longitude: this.normalizeOptionalString(address.longitude),
      accessCode: this.normalizeOptionalString(address.accessCode),
      floor: this.normalizeOptionalString(address.floor),
      apartment: this.normalizeOptionalString(address.apartment),
      note: this.normalizeOptionalString(address.note),
    };
  }

  private ensureAddressFields(address: CreateAddressDto, label: string) {
    if (!address.street1?.trim() || !address.postalCode?.trim() || !address.city?.trim()) {
      throw new BadRequestException(`${label}: rue, code postal et ville obligatoires.`);
    }
  }

  private async createTenantAddress(
    tenantId: string,
    address: CreateAddressDto,
  ): Promise<AddressRecord> {
    this.ensureAddressFields(address, 'Adresse');
    const data = this.sanitizeAddress(address);

    return this.prisma.address.create({
      data: {
        ...data,
        tenantId,
      },
      select: {
        id: true,
        street1: true,
        street2: true,
        postalCode: true,
        city: true,
        countryCode: true,
      },
    });
  }

  private async findTenantAddress(
    tenantId: string,
    addressId: string,
  ): Promise<AddressRecord> {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        tenantId,
      },
      select: {
        id: true,
        street1: true,
        street2: true,
        postalCode: true,
        city: true,
        countryCode: true,
      },
    });

    if (!address) {
      throw new BadRequestException('Adresse introuvable pour ce tenant.');
    }

    return address;
  }

  private async resolveCustomer(
    tenantId: string,
    dto: CreateQuoteDto,
  ): Promise<CustomerRecord> {
    if (dto.customerId && dto.customer) {
      throw new BadRequestException(
        'Vous devez fournir soit customerId, soit un nouveau client.',
      );
    }

    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: dto.customerId,
          tenantId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          company: true,
          email: true,
          phone: true,
          mobile: true,
          vatNumber: true,
          address: {
            select: {
              id: true,
              street1: true,
              street2: true,
              postalCode: true,
              city: true,
              countryCode: true,
            },
          },
        },
      });

      if (!customer) {
        throw new BadRequestException('Client introuvable pour ce tenant.');
      }

      if (!customer.address) {
        throw new BadRequestException('Le client selectionne doit avoir une adresse.');
      }

      return customer;
    }

    if (!dto.customer) {
      throw new BadRequestException('Un client est obligatoire pour creer un devis.');
    }

    const customerInput: CreateCustomerDto = dto.customer;

    if (customerInput.addressId && customerInput.address) {
      throw new BadRequestException(
        'Vous devez fournir soit addressId, soit une nouvelle adresse pour le client.',
      );
    }

    let address: AddressRecord | null = null;
    if (customerInput.addressId) {
      address = await this.findTenantAddress(tenantId, customerInput.addressId);
    } else if (customerInput.address) {
      address = await this.createTenantAddress(tenantId, customerInput.address);
    }

    if (!address) {
      throw new BadRequestException('Le nouveau client doit avoir une adresse.');
    }

    return this.prisma.customer.create({
      data: {
        tenant: {
          connect: {
            id: tenantId,
          },
        },
        firstName: this.normalizeOptionalString(customerInput.firstName),
        lastName: this.normalizeOptionalString(customerInput.lastName),
        company: this.normalizeOptionalString(customerInput.company),
        email: this.normalizeOptionalString(customerInput.email),
        phone: this.normalizeOptionalString(customerInput.phone),
        mobile: this.normalizeOptionalString(customerInput.mobile),
        siret: this.normalizeOptionalString(customerInput.siret),
        vatNumber: this.normalizeOptionalString(customerInput.vatNumber),
        notes: this.normalizeOptionalString(customerInput.notes),
        address: {
          connect: {
            id: address.id,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        email: true,
        phone: true,
        mobile: true,
        vatNumber: true,
        address: {
          select: {
            id: true,
            street1: true,
            street2: true,
            postalCode: true,
            city: true,
            countryCode: true,
          },
        },
      },
    });
  }

  private async resolveWorkOrderAddress(
    tenantId: string,
    dto: CreateQuoteDto,
  ): Promise<AddressRecord | null> {
    if (dto.workOrderAddressId && dto.workOrderAddress) {
      throw new BadRequestException(
        'Vous devez fournir soit workOrderAddressId, soit une nouvelle adresse chantier.',
      );
    }

    if (dto.workOrderAddressId) {
      return this.findTenantAddress(tenantId, dto.workOrderAddressId);
    }

    if (dto.workOrderAddress) {
      return this.createTenantAddress(tenantId, dto.workOrderAddress);
    }

    return null;
  }

  private serializeQuote(quote: QuoteWithRelations) {
    const { workOrderAddress, ...rest } = quote;

    return {
      ...rest,
      workOrderAddress: workOrderAddress?.street1 ?? undefined,
      workOrderPostalCode: workOrderAddress?.postalCode ?? undefined,
      workOrderCity: workOrderAddress?.city ?? undefined,
    };
  }

  async create(tenantId: string, dto: CreateQuoteDto) {
    if (!dto.quoteItems?.length) {
      throw new BadRequestException('Le devis doit contenir au moins une ligne.');
    }

    const customer = await this.resolveCustomer(tenantId, dto);
    const workOrderAddress = await this.resolveWorkOrderAddress(tenantId, dto);
    const issueDate = this.parseRequiredDate(dto.issueDate, 'issueDate');
    const validUntil = this.parseOptionalDate(dto.validUntil);
    const workOrderStartDate = this.parseOptionalDate(dto.workOrderStartDate);
    const workOrderEndDate = this.parseOptionalDate(dto.workOrderEndDate);

    let subtotal = 0;
    let vatAmount = 0;

    const items = dto.quoteItems.map((item, index) => {
      if (!item.title?.trim()) {
        throw new BadRequestException('Chaque ligne du devis doit avoir un titre.');
      }

      const quantity = this.toNumber(item.quantity);
      const unitPrice = this.toNumber(item.unitPrice);
      const vatRate = this.toNumber(item.vatRate);
      const lineSubtotal = this.roundMoney(quantity * unitPrice);
      const lineVat = this.roundMoney(lineSubtotal * (vatRate / 100));
      const total = this.roundMoney(lineSubtotal + lineVat);

      subtotal += lineSubtotal;
      vatAmount += lineVat;

      const itemType: WorkOrderItemType = item.type ?? 'OTHER';

      return {
        type: itemType,
        position: index,
        title: item.title.trim(),
        description: item.description?.trim() ?? '',
        quantity,
        unit: this.normalizeOptionalString(item.unit),
        unitPrice,
        vatRate,
        total,
      };
    });

    subtotal = this.roundMoney(subtotal);
    vatAmount = this.roundMoney(vatAmount);
    const total = this.roundMoney(subtotal + vatAmount);

    for (let attempt = 0; attempt < QuoteService.QUOTE_NUMBER_RETRY_LIMIT; attempt += 1) {
      try {
        const created = await this.prisma.$transaction(
          async (tx) => {
            const quoteNumber = await this.generateQuoteNumber(tx, tenantId);

            return tx.quote.create({
              data: {
                tenant: {
                  connect: {
                    id: tenantId,
                  },
                },
                customer: {
                  connect: {
                    id: customer.id,
                  },
                },
                title: dto.title.trim(),
                number: quoteNumber,
                issueDate,
                validUntil,
                workOrderReference: this.normalizeOptionalString(dto.workOrderReference),
                workOrderTitle: this.normalizeOptionalString(dto.workOrderTitle),
                tenantName: dto.tenantName.trim(),
                tenantStreet1: dto.tenantStreet1.trim(),
                tenantStreet2: this.normalizeOptionalString(dto.tenantStreet2),
                tenantPostalCode: dto.tenantPostalCode.trim(),
                tenantCity: dto.tenantCity.trim(),
                tenantSiretNumber: dto.tenantSiretNumber.trim(),
                tenantVatNumber: dto.tenantVatNumber.trim(),
                tenantEmail: dto.tenantEmail.trim(),
                tenantPhoneNumber: dto.tenantPhoneNumber.trim(),
                tenantIban: this.normalizeOptionalString(dto.tenantIban),
                tenantBic: this.normalizeOptionalString(dto.tenantBic),
                customerFirstName:
                  this.normalizeOptionalString(dto.customerFirstName) ??
                  customer.firstName ??
                  customer.company ??
                  '',
                customerLastName:
                  this.normalizeOptionalString(dto.customerLastName) ?? customer.lastName ?? '',
                customerStreet1: customer.address?.street1 ?? dto.customerStreet1.trim(),
                customerStreet2:
                  customer.address?.street2 ?? this.normalizeOptionalString(dto.customerStreet2),
                customerPostalCode:
                  customer.address?.postalCode ?? dto.customerPostalCode.trim(),
                customerCity: customer.address?.city ?? dto.customerCity.trim(),
                customerEmail:
                  customer.email ?? this.normalizeOptionalString(dto.customerEmail),
                customerPhoneNumber:
                  customer.phone ?? customer.mobile ?? this.normalizeOptionalString(dto.customerPhoneNumber),
                customerVatNumber:
                  customer.vatNumber ?? this.normalizeOptionalString(dto.customerVatNumber),
                workOrderStartDate,
                workOrderEndDate,
                workOrderAddress: workOrderAddress
                  ? {
                      connect: {
                        id: workOrderAddress.id,
                      },
                    }
                  : undefined,
                status: dto.status ?? 'DRAFT',
                currency: this.normalizeOptionalString(dto.currency) ?? 'EUR',
                subtotal,
                vatAmount,
                total,
                paymentTerms: this.normalizeOptionalString(dto.paymentTerms),
                legalMentions: this.normalizeOptionalString(dto.legalMentions),
                notes: this.normalizeOptionalString(dto.notes),
                depositAmount:
                  dto.depositAmount !== undefined ? this.toNumber(dto.depositAmount) : undefined,
                pdfFileId: this.normalizeOptionalString(dto.pdfFileId),
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
                workOrderAddress: true,
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          },
        );

        return this.serializeQuote(created);
      } catch (error) {
        if (!this.isTransactionRetryable(error) || attempt === QuoteService.QUOTE_NUMBER_RETRY_LIMIT - 1) {
          throw error;
        }
      }
    }

    throw new BadRequestException('Unable to generate quote number.');
  }

  async findAll(tenantId: string) {
    const quotes = await this.prisma.quote.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
        workOrderAddress: true,
      },
    });

    return quotes.map((quote) => this.serializeQuote(quote));
  }

  async findOne(tenantId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          orderBy: {
            position: 'asc',
          },
        },
        workOrderAddress: true,
      },
    });

    if (!quote) {
      throw new NotFoundException('Devis introuvable pour ce tenant.');
    }

    return this.serializeQuote(quote);
  }

  async delete(tenantId: string, id: string) {
    return this.prisma.quote.deleteMany({
      where: { id, tenantId },
    });
  }
}