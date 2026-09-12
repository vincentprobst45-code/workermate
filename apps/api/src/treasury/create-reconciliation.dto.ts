import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReconciliationDto {
  @IsString()
  paymentAccountId!: string;

  @IsNumber()
  actualBalance!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
