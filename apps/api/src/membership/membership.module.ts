import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [MembershipController],
  providers: [MembershipService],
})
export class MembershipModule {}
