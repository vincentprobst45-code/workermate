import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MonitoringController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  async metricsEndpoint(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', this.metrics.registry.contentType);
    response.send(await this.metrics.registry.metrics());
  }

  @Get('health/live')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
