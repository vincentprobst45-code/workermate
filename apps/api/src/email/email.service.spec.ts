/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { EmailDeliveryStatus, EmailDocumentType, Prisma } from '@prisma/client';
import { EmailService } from './email.service';

describe('EmailService reminder locking', () => {
  const now = new Date('2026-09-30T10:00:00.000Z');
  let prisma: {
    emailDelivery: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
    };
    storedFile: { findFirst: jest.Mock };
    quote: { updateMany: jest.Mock };
    invoice: { updateMany: jest.Mock };
  };
  let service: EmailService;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
    process.env.RESEND_FROM_EMAIL = 'billing@example.com';
    prisma = {
      emailDelivery: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      storedFile: { findFirst: jest.fn() },
      quote: { updateMany: jest.fn() },
      invoice: { updateMany: jest.fn() },
    };
    prisma.storedFile.findFirst.mockResolvedValue({ storageKey: 'tenant/documents/invoice/invoice.pdf' });
    prisma.emailDelivery.update.mockResolvedValue({});
    prisma.emailDelivery.updateMany.mockResolvedValue({ count: 1 });
    sendMock = jest.fn().mockResolvedValue({ data: { id: 'resend-1' }, error: null });
    service = new EmailService(prisma as never, { createDocumentPdf: jest.fn() } as never, { getObject: jest.fn().mockResolvedValue(Buffer.from('%PDF-test')) } as never);
    Object.defineProperty(service, 'resend', { value: { emails: { send: sendMock } }, writable: true });
  });

  afterEach(() => {
    jest.useRealTimers();
    delete process.env.RESEND_FROM_EMAIL;
  });

  function invoice() {
    return {
      id: 'invoice-1',
      pdfFileId: 'file-1',
      number: 'FAC-1',
      customerName: 'Client',
      amountDue: 100,
      currency: 'EUR',
      tenantName: 'Entreprise',
      dueDate: new Date('2026-09-25T00:00:00.000Z'),
    };
  }

  it('ignores an active claim without sending another email', async () => {
    prisma.emailDelivery.findUnique.mockResolvedValue({
      id: 'delivery-1',
      status: EmailDeliveryStatus.PENDING,
      processingUntil: new Date('2026-09-30T10:10:00.000Z'),
    });

    const result = await service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 1);

    expect(result).toEqual({ success: false, duplicate: true });
    expect(prisma.emailDelivery.updateMany).not.toHaveBeenCalled();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('reclaims an expired claim atomically', async () => {
    prisma.emailDelivery.findUnique.mockResolvedValue({
      id: 'delivery-1',
      status: EmailDeliveryStatus.PENDING,
      processingUntil: new Date('2026-09-30T09:00:00.000Z'),
    });

    const result = await service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 1);

    expect(result.success).toBe(true);
    expect(prisma.emailDelivery.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'delivery-1' }),
      data: expect.objectContaining({ status: EmailDeliveryStatus.PENDING, processingUntil: new Date('2026-09-30T10:15:00.000Z') }),
    }));
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(prisma.emailDelivery.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'delivery-1', claimToken: expect.any(String) }),
      data: expect.objectContaining({ status: EmailDeliveryStatus.SENT, processingUntil: null }),
    }));
  });

  it('treats a concurrent unique-key race as a duplicate', async () => {
    const duplicate = new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '6.19.3' });
    prisma.emailDelivery.findUnique.mockResolvedValue(null);
    prisma.emailDelivery.create
      .mockResolvedValueOnce({ id: 'delivery-1', status: EmailDeliveryStatus.PENDING, processingUntil: new Date('2026-09-30T10:15:00.000Z') })
      .mockRejectedValueOnce(duplicate);

    const results = await Promise.all([
      service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 1),
      service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 1),
    ]);

    expect(results).toContainEqual({ success: false, duplicate: true });
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(results.filter((result) => result.success)).toHaveLength(1);
  });

  it('uses the reminder document type and stage in persisted delivery data', async () => {
    prisma.emailDelivery.findUnique.mockResolvedValue(null);
    prisma.emailDelivery.create.mockResolvedValue({ id: 'delivery-1', status: EmailDeliveryStatus.PENDING, processingUntil: new Date('2026-09-30T10:15:00.000Z') });

    await service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 2);

    expect(prisma.emailDelivery.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ documentType: EmailDocumentType.INVOICE, reminderStage: 2, dedupeKey: 'dedupe-1' }),
    }));
  });

  it('releases a failed claim so a later attempt can retry', async () => {
    prisma.emailDelivery.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 'delivery-1',
      status: EmailDeliveryStatus.FAILED,
      processingUntil: null,
      claimToken: null,
    });
    prisma.emailDelivery.create.mockResolvedValue({ id: 'delivery-1', status: EmailDeliveryStatus.PENDING, processingUntil: new Date('2026-09-30T10:15:00.000Z') });
    sendMock.mockRejectedValueOnce(new Error('provider unavailable')).mockResolvedValueOnce({ data: { id: 'resend-2' }, error: null });

    await expect(service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 1)).rejects.toThrow('provider unavailable');
    expect(prisma.emailDelivery.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: EmailDeliveryStatus.FAILED, processingUntil: null }),
    }));

    const retry = await service.sendInvoiceReminder('tenant-1', 'client@example.com', invoice(), 'dedupe-1', 1);

    expect(retry.success).toBe(true);
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
