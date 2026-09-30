import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('ready')
  async readiness(): Promise<{ status: 'ok'; checks: { postgres: 'ok' } }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', checks: { postgres: 'ok' } };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        checks: { postgres: 'unavailable' },
      });
    }
  }
}
