import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateTenantDto } from './update-tenant.dto';
import { CreateAddressDto } from '../address/create-address.dto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  private hasAddress(address?: CreateAddressDto): boolean {
    if (!address) {
      return false;
    }

    return Object.values(address).some(
      (value) => typeof value === 'string' && value.trim() !== '',
    );
  }

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

  async findCurrentQuoteDefaults(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        // name : true,
        // email: true,
        // phoneNumber: true,

        // siretNumber: true,
        // vatNumber: true,

        // iban: true,
        // bic: true,

        // defaultCurrency: true,
        // defaultPaymentTerms: true,
        // defaultLegalMentions: true,

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
    const { addressId, address, ...tenantData } = dto;

    if (addressId && this.hasAddress(address)) {
      throw new BadRequestException(
        'Vous devez fournir soit addressId, soit une nouvelle adresse.',
      );
    }

    const data: Prisma.TenantUpdateInput = {
      name: tenantData.name,
      email:
        tenantData.email !== undefined
          ? this.normalizeOptionalString(tenantData.email)
          : undefined,
      phoneNumber:
        tenantData.phoneNumber !== undefined
          ? this.normalizeOptionalString(tenantData.phoneNumber)
          : undefined,
      siretNumber:
        tenantData.siretNumber !== undefined
          ? this.normalizeOptionalString(tenantData.siretNumber)
          : undefined,
      vatNumber:
        tenantData.vatNumber !== undefined
          ? this.normalizeOptionalString(tenantData.vatNumber)
          : undefined,
      iban:
        tenantData.iban !== undefined
          ? this.normalizeOptionalString(tenantData.iban)
          : undefined,
      bic:
        tenantData.bic !== undefined
          ? this.normalizeOptionalString(tenantData.bic)
          : undefined,
      invoiceNumberPrefix:
        tenantData.invoiceNumberPrefix !== undefined
          ? tenantData.invoiceNumberPrefix.trim() || undefined
          : undefined,
      nextInvoiceNumber:
        tenantData.nextInvoiceNumber !== undefined
          ? tenantData.nextInvoiceNumber
          : undefined,
      logoFileId:
        tenantData.logoFileId !== undefined
          ? this.normalizeOptionalString(tenantData.logoFileId)
          : undefined,
      defaultCurrency: tenantData.defaultCurrency?.trim(),
      defaultPaymentTerms:
        tenantData.defaultPaymentTerms !== undefined
          ? this.normalizeOptionalString(tenantData.defaultPaymentTerms)
          : undefined,
      defaultLegalMentions:
        tenantData.defaultLegalMentions !== undefined
          ? this.normalizeOptionalString(tenantData.defaultLegalMentions)
          : undefined,
      defaultInvoiceNotes:
        tenantData.defaultInvoiceNotes !== undefined
          ? this.normalizeOptionalString(tenantData.defaultInvoiceNotes)
          : undefined,
      defaultVatRate:
        tenantData.defaultVatRate !== undefined
          ? tenantData.defaultVatRate
          : undefined,
    };

    if (addressId !== undefined) {
      data.address = addressId
        ? {
            connect: {
              id: addressId,
            },
          }
        : {
            disconnect: true,
          };
    } else if (this.hasAddress(address)) {
      if (!address?.street1?.trim() || !address?.postalCode?.trim() || !address?.city?.trim()) {
        throw new BadRequestException('Rue, code postal et ville obligatoires.');
      }

      data.address = {
        create: {
          street1: address.street1.trim(),
          street2: address.street2?.trim() || undefined,
          postalCode: address.postalCode.trim(),
          city: address.city.trim(),
          region: address.region?.trim() || undefined,
          countryCode: address.countryCode?.trim() || 'FR',
          latitude: address.latitude?.trim() || undefined,
          longitude: address.longitude?.trim() || undefined,
          accessCode: address.accessCode?.trim() || undefined,
          floor: address.floor?.trim() || undefined,
          apartment: address.apartment?.trim() || undefined,
          note: address.note?.trim() || undefined,
          tenant: {
            connect: {
              id: tenantId,
            },
          },
        },
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
