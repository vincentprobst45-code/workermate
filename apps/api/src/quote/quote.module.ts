import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

@Module({
  imports: [PrismaModule],
  providers: [QuoteService],
  controllers: [QuoteController],
})
export class QuoteModule {}