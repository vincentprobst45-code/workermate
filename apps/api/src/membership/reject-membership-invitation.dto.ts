import { IsString } from 'class-validator';

export class RejectMembershipInvitationDto {
  @IsString()
  invitationId!: string;
}
