import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateTenantDto } from './update-tenant.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  private normalizeOptionalString(value?: string | null): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
  }

  async findCurrent(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
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

  async updateCurrent(tenantId: string, dto: UpdateTenantDto) {
    const data: Prisma.TenantUpdateInput = {
      name: dto.name?.trim(),
      email: dto.email !== undefined ? this.normalizeOptionalString(dto.email) : undefined,
      phoneNumber:
        dto.phoneNumber !== undefined
          ? this.normalizeOptionalString(dto.phoneNumber)
          : undefined,
      siretNumber:
        dto.siretNumber !== undefined
          ? this.normalizeOptionalString(dto.siretNumber)
          : undefined,
      vatNumber:
        dto.vatNumber !== undefined
          ? this.normalizeOptionalString(dto.vatNumber)
          : undefined,
      iban: dto.iban !== undefined ? this.normalizeOptionalString(dto.iban) : undefined,
      bic: dto.bic !== undefined ? this.normalizeOptionalString(dto.bic) : undefined,
      invoiceNumberPrefix:
        dto.invoiceNumberPrefix !== undefined
          ? this.normalizeOptionalString(dto.invoiceNumberPrefix)
          : undefined,
      nextInvoiceNumber:
        dto.nextInvoiceNumber !== undefined ? dto.nextInvoiceNumber : undefined,
      logoFileId:
        dto.logoFileId !== undefined
          ? this.normalizeOptionalString(dto.logoFileId)
          : undefined,
      defaultCurrency: dto.defaultCurrency?.trim(),
      defaultPaymentTerms:
        dto.defaultPaymentTerms !== undefined
          ? this.normalizeOptionalString(dto.defaultPaymentTerms)
          : undefined,
      defaultLegalMentions:
        dto.defaultLegalMentions !== undefined
          ? this.normalizeOptionalString(dto.defaultLegalMentions)
          : undefined,
      defaultInvoiceNotes:
        dto.defaultInvoiceNotes !== undefined
          ? this.normalizeOptionalString(dto.defaultInvoiceNotes)
          : undefined,
      defaultVatRate: dto.defaultVatRate !== undefined ? dto.defaultVatRate : undefined,
    };

    if (dto.addressId !== undefined) {
      data.address = dto.addressId
        ? {
            connect: {
              id: dto.addressId,
            },
          }
        : {
            disconnect: true,
          };
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data,
      include: {
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
}
