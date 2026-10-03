import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { EmailDeliveryKind, EmailDeliveryStatus, EmailDocumentType, Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { Resend } from 'resend';
import { PrismaService } from '../prisma.service';
import { StorageService } from '../storage/storage.service';
import { InvoicePdfAppearance, PdfService } from './pdf.service';

export type DocumentData = {
  id: string;
  pdfFileId?: string | null;
  number?: string | null;
  title?: string | null;
  customerName: string;
  customerVatNumber?: string | null;
  customerEmail?: string | null;
  customerPhoneNumber?: string | null;
  customerStreet1?: string | null;
  customerStreet2?: string | null;
  customerPostalCode?: string | null;
  customerCity?: string | null;
  total?: unknown;
  amountDue?: unknown;
  taxInclusiveAmount?: unknown;
  taxExclusiveAmount?: unknown;
  vatAmount?: unknown;
  prepaidAmount?: unknown;
  depositAmount?: unknown;
  allowanceTotal?: unknown;
  chargeTotal?: unknown;
  currency?: string;
  tenantName: string;
  tenantStreet1?: string | null;
  tenantStreet2?: string | null;
  tenantPostalCode?: string | null;
  tenantCity?: string | null;
  tenantSiretNumber?: string | null;
  tenantVatNumber?: string | null;
  tenantEmail?: string | null;
  tenantPhoneNumber?: string | null;
  tenantIban?: string | null;
  tenantBic?: string | null;
  kind?: string | null;
  status?: string | null;
  paymentTerms?: string | null;
  legalMentions?: string | null;
  internalNotes?: string | null;
  notes?: string | Array<{ text?: string | null }> | null;
  workOrderReference?: string | null;
  workOrderTitle?: string | null;
  workOrderStartDate?: Date | string | null;
  workOrderEndDate?: Date | string | null;
  workOrderAddress?: string | null;
  workOrderPostalCode?: string | null;
  workOrderCity?: string | null;
  adjustments?: Array<{ type?: string; amount?: unknown; percentage?: unknown; reason?: string | null }>;
  vatBreakdowns?: Array<{ vatAmount?: unknown; vatCategory?: string | null; vatRate?: unknown }>;
  validUntil?: Date | string | null;
  dueDate?: Date | string | null;
  issueDate?: Date | string | null;
  items?: Array<{ position?: number; title?: string | null; description?: string | null; quantity?: unknown; unit?: string | null; unitCode?: string | null; unitLabel?: string | null; unitPrice?: unknown; vatRate?: unknown; vatCategory?: string | null; vatExemptionReason?: string | null; total?: unknown; subtotal?: unknown; adjustments?: Array<{ type?: string; amount?: unknown; percentage?: unknown; reason?: string | null }> }>;
};

const REMINDER_LOCK_MS = 15 * 60 * 1000;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null;
  private readonly fromEmail = process.env.RESEND_FROM_EMAIL;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly storage: StorageService,
  ) {
    this.resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  }

  async sendQuote(tenantId: string, to: string, quote: DocumentData) {
    return this.sendDocument(tenantId, EmailDocumentType.QUOTE, to, quote);
  }

  async sendInvoice(tenantId: string, to: string, invoice: DocumentData) {
    return this.sendDocument(tenantId, EmailDocumentType.INVOICE, to, invoice);
  }

  async sendInvoiceReminder(tenantId: string, to: string, invoice: DocumentData, dedupeKey: string, reminderStage: number) {
    return this.sendDocument(tenantId, EmailDocumentType.INVOICE, to, invoice, {
      kind: EmailDeliveryKind.REMINDER,
      dedupeKey,
      reminderStage,
      reminder: true,
    });
  }

  async getInvoicePdf(tenantId: string, invoice: DocumentData) {
    return this.getOrCreatePdf(tenantId, EmailDocumentType.INVOICE, invoice);
  }

  async previewInvoicePdf(tenantId: string, invoice: DocumentData) {
    return this.pdfService.createDocumentPdf({
      ...invoice,
      type: 'INVOICE',
      total: invoice.amountDue ?? invoice.taxInclusiveAmount,
    }, await this.getInvoiceAppearance(tenantId));
  }

  async previewInvoiceAppearancePdf(
    tenantId: string,
    appearance: Pick<InvoicePdfAppearance, 'template' | 'primaryColor' | 'font'> & { logoFileId?: string | null },
  ) {
    return this.pdfService.createDocumentPdf({
      type: 'INVOICE',
      number: 'FAC-2026-001',
      tenantName: 'Votre entreprise',
      customerName: 'Client exemple',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      currency: 'EUR',
      items: [{ title: 'Prestation de service', description: 'Exemple de ligne de facture', quantity: 1, unitPrice: 850, vatRate: 20 }],
      total: 1020,
      taxExclusiveAmount: 850,
      vatAmount: 170,
      taxInclusiveAmount: 1020,
    }, await this.getInvoiceAppearance(tenantId, appearance));
  }

  private async getInvoiceAppearance(
    tenantId: string,
    overrides?: Partial<Pick<InvoicePdfAppearance, 'template' | 'primaryColor' | 'font' | 'logoFileId'>>,
  ): Promise<InvoicePdfAppearance> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { invoiceTemplate: true, invoicePrimaryColor: true, invoiceFont: true, logoFileId: true },
    });

    let logo: Buffer | undefined;
    const logoFileId = overrides?.logoFileId !== undefined ? overrides.logoFileId : tenant?.logoFileId;
    if (logoFileId) {
      const logoFile = await this.prisma.storedFile.findFirst({
        where: { id: logoFileId, tenantId },
        select: { storageKey: true },
      });
      if (logoFile) {
        try {
          logo = await this.storage.getObject(logoFile.storageKey);
        } catch (error) {
          this.logger.warn(`Logo de facture introuvable: ${logoFileId}`);
        }
      }
    }

    return {
      template: overrides?.template ?? (tenant?.invoiceTemplate as InvoicePdfAppearance['template'] | undefined) ?? 'STANDARD',
      primaryColor: overrides?.primaryColor ?? tenant?.invoicePrimaryColor ?? '#274c77',
      font: overrides?.font ?? (tenant?.invoiceFont as InvoicePdfAppearance['font'] | undefined) ?? 'Helvetica',
      logoFileId,
      logo,
    };
  }

  async listHistory(tenantId: string, type: EmailDocumentType, documentId: string) {
    return this.prisma.emailDelivery.findMany({
      where: { tenantId, documentType: type, ...(type === EmailDocumentType.QUOTE ? { quoteId: documentId } : { invoiceId: documentId }) },
      orderBy: { createdAt: 'desc' },
      select: { id: true, recipient: true, subject: true, status: true, providerMessageId: true, errorMessage: true, sentAt: true, createdAt: true },
    });
  }

  async sendMembershipInvitation(to: string, tenantName: string, invitationUrl: string) {
    await this.send({
      to,
      subject: `Invitation à rejoindre ${tenantName}`,
      html: `<p>Vous êtes invité à rejoindre <strong>${this.escapeHtml(tenantName)}</strong> sur Workermate.</p><p><a href="${this.escapeHtml(invitationUrl)}">Créer votre compte et accepter l’invitation</a></p>`,
    }, 'Impossible d’envoyer l’invitation par email.');
  }

  private async sendDocument(
    tenantId: string,
    type: EmailDocumentType,
    to: string,
    document: DocumentData,
    options: { kind?: EmailDeliveryKind; dedupeKey?: string; reminderStage?: number; reminder?: boolean } = {},
  ) {
    const number = document.number || (type === EmailDocumentType.QUOTE ? 'devis' : 'facture');
    const subject = `${options.reminder ? 'Relance facture' : type === EmailDocumentType.QUOTE ? 'Devis' : 'Facture'} ${number} - ${document.tenantName}`;
    let history: { id: string; status: EmailDeliveryStatus; processingUntil: Date | null; claimToken: string | null } | null | undefined;
    let claimToken: string | undefined;
    if (options.dedupeKey) {
      const now = new Date();
      const processingUntil = new Date(now.getTime() + REMINDER_LOCK_MS);
      claimToken = randomUUID();
      history = await this.prisma.emailDelivery.findUnique({ where: { dedupeKey: options.dedupeKey } });
      if (history?.status === EmailDeliveryStatus.SENT) {
        return { success: false, duplicate: true };
      }
      if (history?.status === EmailDeliveryStatus.PENDING && history.processingUntil && history.processingUntil > now) {
        return { success: false, duplicate: true };
      }
      if (history) {
        const claimed = await this.prisma.emailDelivery.updateMany({
          where: {
            id: history.id,
            OR: [
              { status: EmailDeliveryStatus.FAILED },
              { status: EmailDeliveryStatus.PENDING, processingUntil: { lte: now } },
              { status: EmailDeliveryStatus.PENDING, processingUntil: null },
            ],
          },
          data: { status: EmailDeliveryStatus.PENDING, errorMessage: null, sentAt: null, claimToken, processingUntil },
        });
        if (claimed.count === 0) return { success: false, duplicate: true };
        history = { ...history, status: EmailDeliveryStatus.PENDING, claimToken, processingUntil };
      }
    }
    if (!history) {
      try {
        history = await this.prisma.emailDelivery.create({
          data: {
            tenantId,
            documentType: type,
            kind: options.kind,
            dedupeKey: options.dedupeKey,
            reminderStage: options.reminderStage,
            recipient: to,
            subject,
            claimToken,
            processingUntil: options.dedupeKey ? new Date(Date.now() + REMINDER_LOCK_MS) : undefined,
            ...(type === EmailDocumentType.QUOTE ? { quoteId: document.id } : { invoiceId: document.id }),
          },
        });
      } catch (error) {
        if (options.dedupeKey && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
          return { success: false, duplicate: true };
        }
        throw error;
      }
    }

    try {
      const pdf = await this.getOrCreatePdf(tenantId, type, document);
      if (document.pdfFileId) {
        await this.prisma.emailDelivery.updateMany({ where: { id: history.id, ...(claimToken ? { claimToken } : {}) }, data: { fileId: document.pdfFileId } });
      }
      const result = await this.send({
        to,
        subject,
        html: this.documentHtml(type, document, options.reminder),
        attachments: [{ filename: `${type === EmailDocumentType.QUOTE ? 'devis' : 'facture'}-${number}.pdf`, content: pdf }],
      });
      const completed = await this.prisma.emailDelivery.updateMany({
        where: { id: history.id, ...(claimToken ? { claimToken } : {}) },
        data: { status: EmailDeliveryStatus.SENT, providerMessageId: result?.id, sentAt: new Date(), processingUntil: null },
      });
      if (claimToken && completed.count === 0) return { success: false, duplicate: true };
      return { success: true, historyId: history.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue';
      await this.prisma.emailDelivery.updateMany({ where: { id: history.id, ...(claimToken ? { claimToken } : {}) }, data: { status: EmailDeliveryStatus.FAILED, errorMessage: message, processingUntil: null } });
      throw error;
    }
  }

  private async getOrCreatePdf(tenantId: string, type: EmailDocumentType, document: DocumentData) {
    if (document.pdfFileId) {
      const file = await this.prisma.storedFile.findFirst({ where: { id: document.pdfFileId, tenantId } });
      if (file) return this.storage.getObject(file.storageKey);
    }

    const pdf = await this.pdfService.createDocumentPdf({
      ...document,
      type: type === EmailDocumentType.QUOTE ? 'QUOTE' : 'INVOICE',
      total: type === EmailDocumentType.INVOICE ? document.amountDue ?? document.taxInclusiveAmount : document.total ?? document.taxInclusiveAmount,
    }, await this.getInvoiceAppearance(tenantId));
    const storageKey = `${tenantId}/documents/${type.toLowerCase()}/${document.id}.pdf`;
    await this.storage.putObject(storageKey, pdf, 'application/pdf');
    const file = await this.prisma.storedFile.create({
      data: {
        tenantId,
        storageKey,
        fileName: `${type.toLowerCase()}-${document.number ?? document.id}.pdf`,
        mimeType: 'application/pdf',
        sizeBytes: pdf.length,
        sha256: createHash('sha256').update(pdf).digest('hex'),
      },
    });
    await this.prisma.emailDelivery.updateMany({ where: { tenantId, documentType: type, ...(type === EmailDocumentType.QUOTE ? { quoteId: document.id } : { invoiceId: document.id }), fileId: null }, data: { fileId: file.id } });
    if (type === EmailDocumentType.QUOTE) {
      await this.prisma.quote.updateMany({ where: { id: document.id, tenantId }, data: { pdfFileId: file.id } });
    } else {
      await this.prisma.invoice.updateMany({ where: { id: document.id, tenantId }, data: { pdfFileId: file.id } });
    }
    return pdf;
  }

  private documentHtml(type: EmailDocumentType, document: DocumentData, reminder = false) {
    const number = document.number || (type === EmailDocumentType.QUOTE ? 'devis' : 'facture');
    const amount = document.amountDue ?? document.total ?? document.taxInclusiveAmount;
    const date = type === EmailDocumentType.QUOTE ? document.validUntil : document.dueDate;
    return `<p>Bonjour ${this.escapeHtml(document.customerName)},</p><p>${reminder ? `Nous vous rappelons que la facture <strong>${this.escapeHtml(number)}</strong> reste impayée.` : `Vous trouverez votre ${type === EmailDocumentType.QUOTE ? 'devis' : 'facture'} <strong>${this.escapeHtml(number)}</strong> en pièce jointe.`}</p><p>Montant : <strong>${this.formatMoney(amount, document.currency)}</strong>${date ? `<br>${type === EmailDocumentType.QUOTE ? 'Valable jusqu’au' : 'Échéance'} : ${this.escapeHtml(new Date(date).toLocaleDateString('fr-FR'))}` : ''}</p><p>Cordialement,<br>${this.escapeHtml(document.tenantName)}</p>`;
  }

  private async send(message: { to: string; subject: string; html: string; attachments?: Array<{ filename: string; content: Buffer }> }, failureMessage = 'Impossible d’envoyer l’email.'): Promise<{ id?: string } | undefined> {
    if (!this.resend || !this.fromEmail) throw new InternalServerErrorException('Le service email Resend n’est pas configuré.');
    const { data, error } = await this.resend.emails.send({ from: this.fromEmail, ...message });
    if (error) {
      this.logger.error(`Resend email failed for ${message.to}: ${error.message}`);
      throw new InternalServerErrorException(failureMessage);
    }
    return data;
  }

  private formatMoney(value: unknown, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value ?? 0));
  }

  private escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
  }
}
