import { IsString } from 'class-validator';

export class AcceptMembershipInvitationDto {
  @IsString()
  invitationId!: string;
}
