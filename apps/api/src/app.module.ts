import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CustomerModule } from './customer/customer.module';
import { ProjectModule } from './project/project.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
    CustomerModule,
    ProjectModule,
    InvoiceModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('customers', 'projects', 'invoices');
  }
}
