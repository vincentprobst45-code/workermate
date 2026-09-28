import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
  async createDocumentPdf(document: {
    type: 'QUOTE' | 'INVOICE';
    number?: string | null;
    title?: string | null;
    customerName: string;
    tenantName: string;
    total?: unknown;
    currency?: string;
    date?: Date | string | null;
    dueDate?: Date | string | null;
    validUntil?: Date | string | null;
    items?: Array<{ description?: string | null; quantity?: unknown; unitPrice?: unknown; total?: unknown; subtotal?: unknown }>;
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 48 });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      const label = document.type === 'QUOTE' ? 'DEVIS' : 'FACTURE';
      pdf.fontSize(20).text(document.tenantName).moveDown(0.5);
      pdf.fontSize(24).text(`${label} ${document.number ?? ''}`.trim());
      pdf.moveDown();
      pdf.fontSize(11).text(`Client : ${document.customerName}`);
      if (document.title) pdf.text(`Objet : ${document.title}`);
      if (document.date) pdf.text(`Date : ${this.formatDate(document.date)}`);
      if (document.validUntil) pdf.text(`Valable jusqu'au : ${this.formatDate(document.validUntil)}`);
      if (document.dueDate) pdf.text(`Echeance : ${this.formatDate(document.dueDate)}`);
      pdf.moveDown();

      if (document.items?.length) {
        pdf.fontSize(11).text('Prestations', { underline: true });
        document.items.forEach((item, index) => {
          const amount = item.total ?? item.subtotal ?? Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0);
          pdf.text(`${index + 1}. ${item.description ?? 'Ligne'} - ${this.formatQuantity(item.quantity)} x ${this.formatMoney(item.unitPrice, document.currency)} = ${this.formatMoney(amount, document.currency)}`);
        });
        pdf.moveDown();
      }

      pdf.fontSize(15).text(`Total : ${this.formatMoney(document.total, document.currency)}`, { align: 'right' });
      pdf.moveDown(2);
      pdf.fontSize(9).fillColor('#666666').text('Document généré par Workermate. Ce PDF constitue un snapshot du document au moment de son envoi.');
      pdf.end();
    });
  }

  private formatDate(value: Date | string) {
    return new Date(value).toLocaleDateString('fr-FR');
  }

  private formatMoney(value: unknown, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value ?? 0));
  }

  private formatQuantity(value: unknown) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(Number(value ?? 1));
  }
}
