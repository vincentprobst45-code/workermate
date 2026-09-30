jest.mock('@nestjs/schedule', () => ({
  Cron: () => (_target: object, _propertyKey: string, descriptor: PropertyDescriptor) => descriptor,
  CronExpression: { EVERY_HOUR: '0 * * * *' },
}));

import { InvoicePaymentStatus, InvoiceStatus } from '@prisma/client';
import { EmailReminderScheduler } from './email-reminder.scheduler';

describe('EmailReminderScheduler', () => {
  it('isolates a failed reminder and continues processing other invoices', async () => {
    const first = invoice('invoice-1', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
    const second = invoice('invoice-2', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000));
    const prisma = { invoice: { findMany: jest.fn().mockResolvedValue([first, second]) } };
    const emailService = {
      sendInvoiceReminder: jest.fn()
        .mockRejectedValueOnce(new Error('provider unavailable'))
        .mockResolvedValueOnce({ success: true, historyId: 'delivery-2' }),
    };
    const scheduler = new EmailReminderScheduler(prisma as never, emailService as never);

    await expect(scheduler.processOverdueInvoices()).resolves.toBeUndefined();

    expect(emailService.sendInvoiceReminder).toHaveBeenCalledTimes(2);
    expect(emailService.sendInvoiceReminder).toHaveBeenNthCalledWith(
      2,
      'tenant-1',
      'invoice-2@example.com',
      expect.objectContaining({ id: 'invoice-2' }),
      expect.stringContaining('invoice-2'),
      1,
    );
  });

  it('does not send before the configured delay and stops after max attempts', async () => {
    const beforeDelay = invoice('invoice-early', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000));
    const exhausted = invoice('invoice-exhausted', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    exhausted.tenant.emailReminderMaxAttempts = 2;
    exhausted.tenant.emailReminderRepeatDays = 7;
    const prisma = { invoice: { findMany: jest.fn().mockResolvedValue([beforeDelay, exhausted]) } };
    const emailService = { sendInvoiceReminder: jest.fn() };
    const scheduler = new EmailReminderScheduler(prisma as never, emailService as never);

    await scheduler.processOverdueInvoices();

    expect(emailService.sendInvoiceReminder).not.toHaveBeenCalled();
  });
});

function invoice(id: string, dueDate: Date) {
  return {
    id,
    tenantId: 'tenant-1',
    pdfFileId: null,
    number: id,
    amountDue: 100,
    taxInclusiveAmount: 100,
    currency: 'EUR',
    issueDate: dueDate,
    dueDate,
    status: InvoiceStatus.ISSUED,
    paymentStatus: InvoicePaymentStatus.UNPAID,
    tenant: {
      name: 'Entreprise',
      emailRemindersEnabled: true,
      emailReminderDelayDays: 3,
      emailReminderRepeatDays: 7,
      emailReminderMaxAttempts: 3,
    },
    customer: { email: `${id}@example.com`, company: null, firstName: 'Client', lastName: id },
    items: [],
  };
}
