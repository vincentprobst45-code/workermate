import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'street1 is required' })
  street1!: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  @IsNotEmpty({ message: 'postalCode is required' })
  postalCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'city is required' })
  city!: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  latitude?: string;

  @IsOptional()
  @IsString()
  longitude?: string;

  @IsOptional()
  @IsString()
  accessCode?: string;

  @IsOptional()
  @IsString()
  floor?: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsOptional()
  @IsString()
  note?: string;
}