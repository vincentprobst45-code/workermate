import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoicePaymentStatus, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { EmailService } from './email.service';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class EmailReminderScheduler {
  private readonly logger = new Logger(EmailReminderScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async processOverdueInvoices() {
    const now = new Date();
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.ISSUED,
        paymentStatus: { not: InvoicePaymentStatus.PAID },
        dueDate: { not: null, lte: now },
        customer: { email: { not: null } },
        tenant: { emailRemindersEnabled: true },
      },
      include: {
        tenant: true,
        customer: true,
        items: { orderBy: { position: 'asc' } },
      },
    });

    let sent = 0;
    for (const invoice of invoices) {
      if (!invoice.dueDate || !invoice.customer.email) continue;
      const overdueDays = Math.floor((now.getTime() - invoice.dueDate.getTime()) / DAY_MS);
      if (overdueDays < invoice.tenant.emailReminderDelayDays) continue;

      const repeatDays = Math.max(invoice.tenant.emailReminderRepeatDays, 1);
      const stage = 1 + Math.floor((overdueDays - invoice.tenant.emailReminderDelayDays) / repeatDays);
      if (stage > invoice.tenant.emailReminderMaxAttempts) continue;

      const dueDateKey = invoice.dueDate.toISOString().slice(0, 10);
      const dedupeKey = `invoice-reminder:${invoice.id}:${dueDateKey}:${stage}`;
      try {
        const result = await this.emailService.sendInvoiceReminder(
          invoice.tenantId,
          invoice.customer.email,
          {
            id: invoice.id,
            pdfFileId: invoice.pdfFileId,
            number: invoice.number,
            customerName: this.customerName(invoice.customer),
            amountDue: invoice.amountDue,
            taxInclusiveAmount: invoice.taxInclusiveAmount,
            currency: invoice.currency,
            tenantName: invoice.tenant.name,
            dueDate: invoice.dueDate,
            issueDate: invoice.issueDate,
            items: invoice.items,
          },
          dedupeKey,
          stage,
        );
        if (result.success) sent += 1;
      } catch (error) {
        this.logger.error(`Reminder failed for invoice ${invoice.id}`, error instanceof Error ? error.stack : undefined);
      }
    }

    if (sent) this.logger.log(`Sent ${sent} overdue invoice reminder(s)`);
  }

  private customerName(customer: { company: string | null; firstName: string | null; lastName: string | null }) {
    return customer.company?.trim() || [customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Client';
  }
}
