import { IsDate, IsDecimal, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceFromProjectDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsDate({ message: 'issueDate must be a date' })
  issueDate?: Date;

  @IsOptional()
  @IsDate({ message: 'dueDate must be a date' })
  dueDate?: Date;

  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDecimal()
  discountAmount?: number;

  @IsOptional()
  @IsDecimal()
  depositAmount?: number;
}