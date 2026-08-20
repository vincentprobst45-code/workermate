import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { EmailService } from '../email/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [MembershipController],
  providers: [MembershipService, EmailService],
})
export class MembershipModule {}
