import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SupplierInvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateSupplierInvoiceDto } from './create-supplier-invoice.dto';

@Injectable()
export class SupplierInvoiceService {
  constructor(private readonly prisma: PrismaService) {}

  private parseDate(value: Date | string | undefined, fieldName: string): Date | undefined {
    if (!value) return undefined;
    const rawValue = value instanceof Date ? value.toISOString() : value;
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(rawValue) ? `${rawValue}T00:00:00.000Z` : rawValue);
    if (Number.isNaN(date.getTime())) throw new BadRequestException(`${fieldName} doit être une date valide.`);
    return date;
  }

  findAll(tenantId: string) {
    return this.prisma.supplierInvoice.findMany({ where: { tenantId }, include: { supplier: true, items: true, vatBreakdowns: true }, orderBy: { issueDate: 'desc' } });
  }

  async create(tenantId: string, dto: CreateSupplierInvoiceDto) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: dto.supplierId, tenantId, archivedAt: null } });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    const supplierInvoiceNumber = dto.supplierInvoiceNumber.trim();
    if (!supplierInvoiceNumber) throw new BadRequestException('Le numéro de facture fournisseur est obligatoire.');
    const existingInvoice = await this.prisma.supplierInvoice.findFirst({
      where: { tenantId, supplierId: supplier.id, supplierInvoiceNumber },
      select: { id: true },
    });
    if (existingInvoice) {
      throw new ConflictException('Une facture fournisseur avec ce numéro existe déjà pour ce fournisseur.');
    }
    const items = dto.items ?? [];
    const vatBreakdowns = dto.vatBreakdowns ?? [];
    const lineNetTotal = dto.lineNetTotal ?? items.reduce((sum, item) => sum + Number(item.taxExclusiveAmount), 0);
    const vatAmount = vatBreakdowns.length ? vatBreakdowns.reduce((sum, breakdown) => sum + Number(breakdown.vatAmount), 0) : (dto.vatAmount ?? items.reduce((sum, item) => sum + Number(item.vatAmount ?? 0), 0));
    const taxExclusiveAmount = dto.taxExclusiveAmount ?? lineNetTotal;
    const taxInclusiveAmount = dto.taxInclusiveAmount ?? lineNetTotal + vatAmount;
    const deductibleVatAmount = vatBreakdowns.length ? vatBreakdowns.reduce((sum, breakdown) => sum + Number(breakdown.deductibleVatAmount ?? 0), 0) : (dto.deductibleVatAmount ?? items.reduce((sum, item) => sum + Number(item.deductibleVatAmount ?? 0), 0));
    const issueDate = this.parseDate(dto.issueDate, 'issueDate');
    if (!issueDate) throw new BadRequestException('issueDate est obligatoire.');
    const data: Prisma.SupplierInvoiceUncheckedCreateInput = {
      tenantId, supplierId: supplier.id, kind: dto.kind ?? 'INVOICE', status: dto.status ?? SupplierInvoiceStatus.CONFIRMED,
      supplierInvoiceNumber, issueDate, receivedDate: this.parseDate(dto.receivedDate, 'receivedDate'), dueDate: this.parseDate(dto.dueDate, 'dueDate'),
      currency: dto.currency?.trim().toUpperCase() || 'EUR', lineNetTotal, allowanceTotal: dto.allowanceTotal ?? 0, chargeTotal: dto.chargeTotal ?? 0,
      taxExclusiveAmount, vatAmount, taxInclusiveAmount, deductibleVatAmount, settledAmount: 0,
      openAmount: taxInclusiveAmount, settlementStatus: 'UNSETTLED',
      supplierName: supplier.name, supplierLegalName: supplier.legalName, supplierSirenNumber: supplier.sirenNumber, supplierSiretNumber: supplier.siretNumber,
      supplierVatNumber: supplier.vatNumber, supplierEmail: supplier.email, supplierStreet1: supplier.street1, supplierStreet2: supplier.street2,
      supplierPostalCode: supplier.postalCode, supplierCity: supplier.city, supplierCountryCode: supplier.countryCode,
      notes: dto.notes?.trim(), internalNotes: dto.internalNotes?.trim(),
      items: items.length ? { create: items.map((item, position) => ({ position, title: item.title.trim(), type: item.type, lineIdentifier: item.lineIdentifier?.trim(), description: item.description?.trim(), quantity: item.quantity ?? 1, unitCode: item.unitCode?.trim(), unitLabel: item.unitLabel?.trim(), unitPrice: item.unitPrice, taxExclusiveAmount: item.taxExclusiveAmount, vatCategory: 'STANDARD', vatRate: item.vatRate, vatAmount: item.vatAmount ?? 0, deductibleVatAmount: item.deductibleVatAmount ?? 0, taxInclusiveAmount: item.taxInclusiveAmount })) } : undefined,
      vatBreakdowns: vatBreakdowns.length ? { create: vatBreakdowns.map((breakdown) => ({ vatCategory: breakdown.vatCategory ?? 'STANDARD', vatRate: breakdown.vatRate, taxableAmount: breakdown.taxableAmount, vatAmount: breakdown.vatAmount, deductibleVatAmount: breakdown.deductibleVatAmount ?? 0 })) } : undefined,
    };
    try {
      return await this.prisma.supplierInvoice.create({ data, include: { supplier: true, items: true, vatBreakdowns: true } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une facture fournisseur avec ce numéro existe déjà pour ce fournisseur.');
      }
      throw error;
    }
  }

  async update(tenantId: string, id: string, dto: CreateSupplierInvoiceDto) {
    const currentInvoice = await this.prisma.supplierInvoice.findFirst({ where: { id, tenantId } });
    if (!currentInvoice) throw new NotFoundException('Facture fournisseur introuvable.');
    const supplier = await this.prisma.supplier.findFirst({ where: { id: dto.supplierId, tenantId, archivedAt: null } });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    const supplierInvoiceNumber = dto.supplierInvoiceNumber.trim();
    if (!supplierInvoiceNumber) throw new BadRequestException('Le numéro de facture fournisseur est obligatoire.');
    const existingInvoice = await this.prisma.supplierInvoice.findFirst({
      where: { tenantId, supplierId: supplier.id, supplierInvoiceNumber, NOT: { id } },
      select: { id: true },
    });
    if (existingInvoice) throw new ConflictException('Une facture fournisseur avec ce numéro existe déjà pour ce fournisseur.');

    const items = dto.items ?? [];
    const vatBreakdowns = dto.vatBreakdowns ?? [];
    const lineNetTotal = dto.lineNetTotal ?? items.reduce((sum, item) => sum + Number(item.taxExclusiveAmount), 0);
    const vatAmount = vatBreakdowns.length ? vatBreakdowns.reduce((sum, breakdown) => sum + Number(breakdown.vatAmount), 0) : (dto.vatAmount ?? items.reduce((sum, item) => sum + Number(item.vatAmount ?? 0), 0));
    const taxExclusiveAmount = dto.taxExclusiveAmount ?? lineNetTotal;
    const taxInclusiveAmount = dto.taxInclusiveAmount ?? lineNetTotal + vatAmount;
    const deductibleVatAmount = vatBreakdowns.length ? vatBreakdowns.reduce((sum, breakdown) => sum + Number(breakdown.deductibleVatAmount ?? 0), 0) : (dto.deductibleVatAmount ?? items.reduce((sum, item) => sum + Number(item.deductibleVatAmount ?? 0), 0));
    const issueDate = this.parseDate(dto.issueDate, 'issueDate');
    if (!issueDate) throw new BadRequestException('issueDate est obligatoire.');
    const data: Prisma.SupplierInvoiceUncheckedUpdateInput = {
      supplierId: supplier.id, kind: dto.kind ?? 'INVOICE', status: dto.status ?? SupplierInvoiceStatus.CONFIRMED,
      supplierInvoiceNumber, issueDate, receivedDate: this.parseDate(dto.receivedDate, 'receivedDate'), dueDate: this.parseDate(dto.dueDate, 'dueDate'),
      currency: dto.currency?.trim().toUpperCase() || 'EUR', lineNetTotal, allowanceTotal: dto.allowanceTotal ?? 0, chargeTotal: dto.chargeTotal ?? 0,
      taxExclusiveAmount, vatAmount, taxInclusiveAmount, deductibleVatAmount,
      openAmount: taxInclusiveAmount - Number(currentInvoice.settledAmount), settledAmount: currentInvoice.settledAmount,
      supplierName: supplier.name, supplierLegalName: supplier.legalName, supplierSirenNumber: supplier.sirenNumber, supplierSiretNumber: supplier.siretNumber,
      supplierVatNumber: supplier.vatNumber, supplierEmail: supplier.email, supplierStreet1: supplier.street1, supplierStreet2: supplier.street2,
      supplierPostalCode: supplier.postalCode, supplierCity: supplier.city, supplierCountryCode: supplier.countryCode,
      notes: dto.notes?.trim(), internalNotes: dto.internalNotes?.trim(),
    };
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.supplierInvoiceItem.deleteMany({ where: { supplierInvoiceId: id } });
        await tx.supplierInvoiceVatBreakdown.deleteMany({ where: { supplierInvoiceId: id } });
        await tx.supplierInvoice.update({ where: { id }, data: { ...data, items: items.length ? { create: items.map((item, position) => ({ position, title: item.title.trim(), type: item.type, lineIdentifier: item.lineIdentifier?.trim(), description: item.description?.trim(), quantity: item.quantity ?? 1, unitCode: item.unitCode?.trim(), unitLabel: item.unitLabel?.trim(), unitPrice: item.unitPrice, taxExclusiveAmount: item.taxExclusiveAmount, vatCategory: 'STANDARD', vatRate: item.vatRate, vatAmount: item.vatAmount ?? 0, deductibleVatAmount: item.deductibleVatAmount ?? 0, taxInclusiveAmount: item.taxInclusiveAmount })) } : undefined, vatBreakdowns: vatBreakdowns.length ? { create: vatBreakdowns.map((breakdown) => ({ vatCategory: breakdown.vatCategory ?? 'STANDARD', vatRate: breakdown.vatRate, taxableAmount: breakdown.taxableAmount, vatAmount: breakdown.vatAmount, deductibleVatAmount: breakdown.deductibleVatAmount ?? 0 })) } : undefined } });
        return tx.supplierInvoice.findUnique({ where: { id }, include: { supplier: true, items: true, vatBreakdowns: true } });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Une facture fournisseur avec ce numéro existe déjà pour ce fournisseur.');
      }
      throw error;
    }
  }
}
