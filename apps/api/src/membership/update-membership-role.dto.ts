import { IsEnum } from 'class-validator';
import { TenantRole } from '@prisma/client';

export class UpdateMembershipRoleDto {
  @IsEnum(TenantRole)
  role!: TenantRole;
}
