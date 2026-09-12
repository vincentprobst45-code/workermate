import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateAddressDto } from '../address/create-address.dto';

enum VatLiabilityRegimeDto {
  FRANCHISE_BASE = 'FRANCHISE_BASE',
  LIABLE = 'LIABLE',
}

enum VatReturnFrequencyDto {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  siretNumber?: string;

  @IsOptional()
  @IsString()
  vatNumber?: string;

  @IsOptional()
  @IsString()
  defaultPaymentAccountId?: string;

  @IsOptional()
  @IsString()
  invoiceNumberPrefix?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  nextInvoiceNumber?: number;

  @IsOptional()
  @IsString()
  logoFileId?: string;

  @IsOptional()
  @IsString()
  defaultCurrency?: string;

  @IsOptional()
  @IsString()
  defaultPaymentTerms?: string;

  @IsOptional()
  @IsString()
  defaultLegalMentions?: string;

  @IsOptional()
  @IsString()
  defaultInvoiceNotes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultVatRate?: number;

  @IsOptional()
  @IsEnum(VatLiabilityRegimeDto)
  VatLiabilityRegime?: VatLiabilityRegimeDto;

  @IsOptional()
  @IsEnum(VatReturnFrequencyDto)
  vatReturnFrequency?: VatReturnFrequencyDto;
}
