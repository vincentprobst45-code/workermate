import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class HttpMetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    if (request.path === '/metrics' || request.path.startsWith('/health')) {
      next();
      return;
    }

    const method = request.method;
    const route = () => request.route?.path?.toString() || request.path || 'unknown';
    const startedAt = process.hrtime.bigint();
    this.metrics.httpRequestsInFlight.inc({ method, route: route() });

    response.on('finish', () => {
      const routeLabel = route();
      const statusCode = String(response.statusCode);
      const durationSeconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000_000;
      this.metrics.httpRequestsInFlight.dec({ method, route: routeLabel });
      this.metrics.httpRequestsTotal.inc({ method, route: routeLabel, status_code: statusCode });
      this.metrics.httpRequestDurationSeconds.observe({ method, route: routeLabel, status_code: statusCode }, durationSeconds);
    });

    next();
  }
}
