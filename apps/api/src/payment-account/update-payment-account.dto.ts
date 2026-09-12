import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class UpdatePaymentAccountDto {
	@IsOptional()
	@IsString()
	@Length(1, 120)
	name?: string;

	@IsOptional()
	@IsString()
	bankName?: string;

	@IsOptional()
	@IsString()
	@Length(1, 160)
	accountHolderName?: string;

	@IsOptional()
	@IsString()
	@Length(1, 64)
	iban?: string;

	@IsOptional()
	@IsString()
	@Length(1, 32)
	bic?: string;

	@IsOptional()
	@IsString()
	@Length(3, 3)
	currency?: string;

	@IsOptional()
	@IsBoolean()
	isDefault?: boolean;

	@IsOptional()
	@IsNumber()
	openingBalance?: number;

	@IsOptional()
	@Type(() => Date)
	@IsDate()
	openingBalanceDate?: Date;
}