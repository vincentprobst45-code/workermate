import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
    return this.prisma.supplierInvoice.findMany({ where: { tenantId }, include: { supplier: true, items: true }, orderBy: { issueDate: 'desc' } });
  }

  async create(tenantId: string, dto: CreateSupplierInvoiceDto) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: dto.supplierId, tenantId, archivedAt: null } });
    if (!supplier) throw new NotFoundException('Fournisseur introuvable.');
    const items = dto.items ?? [];
    const lineNetTotal = dto.lineNetTotal ?? items.reduce((sum, item) => sum + Number(item.taxExclusiveAmount), 0);
    const vatAmount = dto.vatAmount ?? items.reduce((sum, item) => sum + Number(item.vatAmount ?? 0), 0);
    const taxExclusiveAmount = dto.taxExclusiveAmount ?? lineNetTotal;
    const taxInclusiveAmount = dto.taxInclusiveAmount ?? lineNetTotal + vatAmount;
    const deductibleVatAmount = dto.deductibleVatAmount ?? items.reduce((sum, item) => sum + Number(item.deductibleVatAmount ?? 0), 0);
    const issueDate = this.parseDate(dto.issueDate, 'issueDate');
    if (!issueDate) throw new BadRequestException('issueDate est obligatoire.');
    const data: Prisma.SupplierInvoiceUncheckedCreateInput = {
      tenantId, supplierId: supplier.id, kind: dto.kind ?? 'INVOICE', status: dto.status ?? SupplierInvoiceStatus.CONFIRMED,
      supplierInvoiceNumber: dto.supplierInvoiceNumber.trim(), issueDate, receivedDate: this.parseDate(dto.receivedDate, 'receivedDate'), dueDate: this.parseDate(dto.dueDate, 'dueDate'),
      currency: dto.currency?.trim().toUpperCase() || 'EUR', lineNetTotal, allowanceTotal: dto.allowanceTotal ?? 0, chargeTotal: dto.chargeTotal ?? 0,
      taxExclusiveAmount, vatAmount, taxInclusiveAmount, deductibleVatAmount, settledAmount: 0,
      openAmount: taxInclusiveAmount, settlementStatus: 'UNSETTLED',
      supplierName: supplier.name, supplierLegalName: supplier.legalName, supplierSirenNumber: supplier.sirenNumber, supplierSiretNumber: supplier.siretNumber,
      supplierVatNumber: supplier.vatNumber, supplierEmail: supplier.email, supplierStreet1: supplier.street1, supplierStreet2: supplier.street2,
      supplierPostalCode: supplier.postalCode, supplierCity: supplier.city, supplierCountryCode: supplier.countryCode,
      notes: dto.notes?.trim(), internalNotes: dto.internalNotes?.trim(),
      items: items.length ? { create: items.map((item, position) => ({ position, title: item.title.trim(), type: item.type, lineIdentifier: item.lineIdentifier?.trim(), description: item.description?.trim(), quantity: item.quantity ?? 1, unitCode: item.unitCode?.trim(), unitLabel: item.unitLabel?.trim(), unitPrice: item.unitPrice, taxExclusiveAmount: item.taxExclusiveAmount, vatCategory: 'STANDARD', vatRate: item.vatRate, vatAmount: item.vatAmount ?? 0, deductibleVatAmount: item.deductibleVatAmount ?? 0, taxInclusiveAmount: item.taxInclusiveAmount })) } : undefined,
    };
    return this.prisma.supplierInvoice.create({ data, include: { supplier: true, items: true } });
  }
}
