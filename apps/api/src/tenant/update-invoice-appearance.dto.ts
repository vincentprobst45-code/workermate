import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

enum InvoiceTemplateDto {
  STANDARD = 'STANDARD',
  MODERN = 'MODERN',
  COMPACT = 'COMPACT',
}

enum InvoiceFontDto {
  HELVETICA = 'Helvetica',
  TIMES_ROMAN = 'Times-Roman',
  COURIER = 'Courier',
}

export class UpdateInvoiceAppearanceDto {
  @IsOptional()
  @IsString()
  logoFileId?: string | null;

  @IsOptional()
  @IsEnum(InvoiceTemplateDto)
  invoiceTemplate?: InvoiceTemplateDto;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  invoicePrimaryColor?: string;

  @IsOptional()
  @IsEnum(InvoiceFontDto)
  invoiceFont?: InvoiceFontDto;
}