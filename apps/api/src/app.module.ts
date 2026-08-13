import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { CustomerModule } from './customer/customer.module';
import { WorkOrderModule } from './workorder/workorder.module';
import { InvoiceModule } from './invoice/invoice.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { CalendarEventModule } from './calendarevent/calendarEvent.module';
import { AddressModule } from './address/address.module';
import { QuoteModule } from './quote/quote.module';
import { TenantModule } from './tenant/tenant.module';
import { CatalogItemModule } from './catalogitem/catalogitem.module';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
    CustomerModule,
    WorkOrderModule,
    CalendarEventModule,
    AddressModule,
    InvoiceModule,
    QuoteModule,
    TenantModule,
    CatalogItemModule,
    ProjectModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes('customers', 'workorders', 'invoices', 'quotes', 'calendarevents', 'addresses', 'tenants', 'catalogitems', 'projects');
  }
}
