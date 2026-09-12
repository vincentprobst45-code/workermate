import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateSupplierDto {
  @IsString() name!: string;
  @IsOptional() @IsString() reference?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() sirenNumber?: string;
  @IsOptional() @IsString() siretNumber?: string;
  @IsOptional() @IsString() vatNumber?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() street1?: string;
  @IsOptional() @IsString() street2?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() countryCode?: string;
  @IsOptional() @IsString() notes?: string;
}
