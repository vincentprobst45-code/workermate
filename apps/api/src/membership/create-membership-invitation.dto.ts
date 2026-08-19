import { IsEmail } from 'class-validator';

export class CreateMembershipInvitationDto {
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;
}
