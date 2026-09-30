import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

@Injectable()
export class MetricsService {
  readonly registry = new Registry();
  readonly httpRequestsTotal: Counter<'method' | 'route' | 'status_code'>;
  readonly httpRequestDurationSeconds: Histogram<'method' | 'route' | 'status_code'>;
  readonly httpRequestsInFlight: Gauge<'method' | 'route'>;

  constructor() {
    collectDefaultMetrics({ register: this.registry, prefix: 'workermate_' });
    this.httpRequestsTotal = new Counter({
      name: 'workermate_http_requests_total',
      help: 'Total number of HTTP requests handled by the API.',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    this.httpRequestDurationSeconds = new Histogram({
      name: 'workermate_http_request_duration_seconds',
      help: 'HTTP request duration in seconds.',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [this.registry],
    });
    this.httpRequestsInFlight = new Gauge({
      name: 'workermate_http_requests_in_flight',
      help: 'Current number of HTTP requests being handled.',
      labelNames: ['method', 'route'],
      registers: [this.registry],
    });
  }
}
