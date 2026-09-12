import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { SupplierInvoiceController } from './supplier-invoice.controller';
import { SupplierInvoiceService } from './supplier-invoice.service';

@Module({ imports: [PrismaModule], controllers: [SupplierInvoiceController], providers: [SupplierInvoiceService] })
export class SupplierInvoiceModule {}
