import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

@Module({
  imports: [PrismaModule],
  providers: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectModule {}
