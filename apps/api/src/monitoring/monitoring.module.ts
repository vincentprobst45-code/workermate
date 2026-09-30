import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HttpMetricsMiddleware } from './http-metrics.middleware';
import { MetricsService } from './metrics.service';
import { MonitoringController } from './monitoring.controller';

@Module({
  controllers: [HealthController, MonitoringController],
  providers: [MetricsService, HttpMetricsMiddleware],
})
export class MonitoringModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpMetricsMiddleware).forRoutes('*');
  }
}
