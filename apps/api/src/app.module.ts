import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
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
import { AuthenticationMiddleware } from './common/middleware/authentication.middleware';
import { CalendarEventModule } from './calendarevent/calendarEvent.module';
import { AddressModule } from './address/address.module';
import { QuoteModule } from './quote/quote.module';
import { TenantModule } from './tenant/tenant.module';
import { CatalogItemModule } from './catalogitem/catalogitem.module';
import { ProjectModule } from './project/project.module';
import { WorkLogModule } from './worklog/worklog.module';
import { MembershipModule } from './membership/membership.module';
import { NotificationModule } from './notification/notification.module';

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
    WorkLogModule,
    MembershipModule,
    NotificationModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { path: 'auth/switch-tenant', method: RequestMethod.POST },
        { path: 'memberships/me', method: RequestMethod.GET },
        { path: 'memberships/invitations', method: RequestMethod.POST },
        { path: 'tenants', method: RequestMethod.POST },
        { path: 'tenants/current', method: RequestMethod.ALL },
        { path: 'tenants/current/quote-defaults', method: RequestMethod.ALL },
        { path: 'notifications', method: RequestMethod.GET },
        { path: 'notifications/recipients', method: RequestMethod.GET },
        { path: 'notifications', method: RequestMethod.POST },
        { path: 'memberships/invitations', method: RequestMethod.POST },
        { path: 'notifications/:id/read', method: RequestMethod.PUT },
        'customers',
        'workorders',
        'invoices',
        'quotes',
        'calendarevents',
        'addresses',
        'catalogitems',
        'projects',
        'worklogs',
      )
      .apply(TenantMiddleware)
      .forRoutes(
        { path: 'tenants/current', method: RequestMethod.ALL },
        { path: 'tenants/current/quote-defaults', method: RequestMethod.ALL },
        { path: 'notifications/recipients', method: RequestMethod.GET },
        { path: 'notifications', method: RequestMethod.POST },
        { path: 'memberships/invitations', method: RequestMethod.POST },
        'customers',
        'workorders',
        'invoices',
        'quotes',
        'calendarevents',
        'addresses',
        'catalogitems',
        'projects',
        'worklogs',
      );
  }
}