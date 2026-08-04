import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { CreateAddressDto } from '../address/create-address.dto';

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
  iban?: string;

  @IsOptional()
  @IsString()
  bic?: string;

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
}
