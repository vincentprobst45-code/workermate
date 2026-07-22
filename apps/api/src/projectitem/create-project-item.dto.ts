import { ProjectItemType } from '@prisma/client';
import {
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';


export class CreateProjectItemDto {
  @IsEnum(ProjectItemType)
  type!: ProjectItemType;

  @IsInt()
  @Min(0)
  position!: number;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDecimal()
  quantity?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsDecimal()
  unitPrice!: number;

  @IsDecimal()
  vatRate!: number;
}