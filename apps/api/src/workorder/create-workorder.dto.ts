import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

import { WorkOrderStatus } from '@prisma/client';
import { CreateAddressDto } from '../address/create-address.dto';
import { CreateWorkOrderItemDto } from 'src/workorderitem/create-workorder-item.dto';

export class CreateWorkOrderDto {
  @IsString()
  customerId?: string;

  // Adresse existante
  @IsOptional()
  @IsString()
  addressId?: string;

  // Nouvelle adresse
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateAddressDto)
  address?: CreateAddressDto;

  // Chantier
  @IsString()
  reference!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;

  @IsOptional()
  @IsDateString({}, { message: 'startDate must be a date' })
  startDate?: string;

  @IsOptional()
  // @IsDateString()
  @IsDateString({}, { message: 'endDate must be a date' })
  endDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateWorkOrderItemDto)
  items?: CreateWorkOrderItemDto[];

  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedDuration?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}