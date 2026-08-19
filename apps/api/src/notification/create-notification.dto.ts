import { NotificationActionType, NotificationType } from '@prisma/client';
import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

class CreateNotificationActionDto {
  @IsString()
  label!: string;

  @IsEnum(NotificationActionType)
  type!: NotificationActionType;

  @IsOptional()
  @IsString()
  targetId?: string;
}

export class CreateNotificationDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  recipientIds!: string[];

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNotificationActionDto)
  actions?: CreateNotificationActionDto[];
}
