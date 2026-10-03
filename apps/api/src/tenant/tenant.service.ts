import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { UpdateTenantDto } from './update-tenant.dto';
import { UpdateInvoiceAppearanceDto } from './update-invoice-appearance.dto';
import { CreateAddressDto } from '../address/create-address.dto';
import { CreateTenantDto } from './create-tenant.dto';
import { StorageService } from '../storage/storage.service';
import { createHash, randomUUID } from 'node:crypto';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  async uploadLogo(tenantId: string, file: { buffer: Buffer; originalname: string; mimetype: string; size: number }) {
    if (!file.mimetype.startsWith('image/')) throw new BadRequestException('Le logo doit être une image.');
    if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Le logo ne doit pas dépasser 5 Mo.');

    const fileId = randomUUID();
    const fileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120) || 'logo';
    const storageKey = `tenants/${tenantId}/logos/${fileId}-${fileName}`;
    await this.storage.putObject(storageKey, file.buffer, file.mimetype);
    await this.prisma.storedFile.create({
      data: {
        id: fileId,
        tenantId,
        storageKey,
        fileName,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        sha256: createHash('sha256').update(file.buffer).digest('hex'),
      },
    });
    await this.prisma.tenant.update({ where: { id: tenantId }, data: { logoFileId: fileId } });
    return { fileId };
  }

  async create(creatorId: string, dto: CreateTenantDto) {
    const currentYear = new Date().getFullYear();
    const tenant = await this.prisma.$transaction(async (tx) => {
      const createdTenant = await tx.tenant.create({
        data: {
          name: dto.name.trim(),
          email: this.normalizeOptionalString(dto.email),
          phoneNumber: this.normalizeOptionalString(dto.phoneNumber),
          siretNumber: this.normalizeOptionalString(dto.siretNumber),
          vatNumber: this.normalizeOptionalString(dto.vatNumber),
          logoFileId: this.normalizeOptionalString(dto.logoFileId),
          defaultCurrency: dto.defaultCurrency?.trim() || 'EUR',
          defaultPaymentTerms: this.normalizeOptionalString(dto.defaultPaymentTerms),
          defaultLegalMentions: this.normalizeOptionalString(dto.defaultLegalMentions),
          defaultInvoiceNotes: this.normalizeOptionalString(dto.defaultInvoiceNotes),
          invoiceNumberYear: currentYear,
          quoteNumberYear: currentYear,
        },
      });

      if (dto.address) {
        const address = await tx.address.create({
          data: {
            street1: dto.address.street1.trim(),
            street2: dto.address.street2?.trim() || undefined,
            postalCode: dto.address.postalCode.trim(),
            city: dto.address.city.trim(),
            countryCode: dto.address.countryCode?.trim() || 'FR',
            tenant: { connect: { id: createdTenant.id } },
          },
        });

        await tx.tenant.update({
          where: { id: createdTenant.id },
          data: { addressId: address.id },
        });
      }

      await tx.membership.create({
        data: { userId: creatorId, tenantId: createdTenant.id, role: 'OWNER' },
      });

      return createdTenant;
    });

    return this.findCurrent(tenant.id);
  }

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
        paymentAccounts: {
          where: { archivedAt: null },
          orderBy: { name: 'asc' },
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

  async findCurrentInvoiceAppearance(tenantId: string) {
    return this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        logoFileId: true,
        invoiceTemplate: true,
        invoicePrimaryColor: true,
        invoiceFont: true,
      },
    });
  }

  async updateCurrentInvoiceAppearance(tenantId: string, dto: UpdateInvoiceAppearanceDto) {
    if (dto.logoFileId) {
      const logo = await this.prisma.storedFile.findFirst({
        where: { id: dto.logoFileId, tenantId },
        select: { id: true },
      });
      if (!logo) {
        throw new BadRequestException('Le logo sélectionné est invalide.');
      }
    }

    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        logoFileId: dto.logoFileId === undefined ? undefined : dto.logoFileId || null,
        invoiceTemplate: dto.invoiceTemplate,
        invoicePrimaryColor: dto.invoicePrimaryColor?.trim().toLowerCase(),
        invoiceFont: dto.invoiceFont,
      },
      select: {
        logoFileId: true,
        invoiceTemplate: true,
        invoicePrimaryColor: true,
        invoiceFont: true,
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

    if (tenantData.defaultPaymentAccountId) {
      const account = await this.prisma.paymentAccount.findFirst({
        where: { id: tenantData.defaultPaymentAccountId, tenantId, archivedAt: null },
      });
      if (!account) {
        throw new BadRequestException('Le compte bancaire principal est invalide.');
      }
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
      defaultPaymentAccount:
        tenantData.defaultPaymentAccountId !== undefined
          ? tenantData.defaultPaymentAccountId
            ? { connect: { id: tenantData.defaultPaymentAccountId } }
            : { disconnect: true }
          : undefined,
      invoiceNumberPrefix:
        tenantData.invoiceNumberPrefix !== undefined
          ? tenantData.invoiceNumberPrefix.trim() || undefined
          : undefined,
      nextInvoiceNumber:
        tenantData.nextInvoiceNumber !== undefined
          ? tenantData.nextInvoiceNumber
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
      emailRemindersEnabled: tenantData.emailRemindersEnabled,
      emailReminderDelayDays: tenantData.emailReminderDelayDays,
      emailReminderRepeatDays: tenantData.emailReminderRepeatDays,
      emailReminderMaxAttempts: tenantData.emailReminderMaxAttempts,
      defaultVatRate:
        tenantData.defaultVatRate !== undefined
          ? tenantData.defaultVatRate
          : undefined,
      VatLiabilityRegime: tenantData.VatLiabilityRegime,
      vatReturnFrequency: tenantData.vatReturnFrequency,
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
        paymentAccounts: {
          where: { archivedAt: null },
          orderBy: { name: 'asc' },
        },
      },
    });
  }
}
