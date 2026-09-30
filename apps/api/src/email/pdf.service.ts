import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type PdfAdjustment = {
  type?: string;
  amount?: unknown;
  percentage?: unknown;
  reason?: string | null;
};

type PdfItem = {
  position?: number;
  title?: string | null;
  description?: string | null;
  quantity?: unknown;
  unit?: string | null;
  unitCode?: string | null;
  unitLabel?: string | null;
  unitPrice?: unknown;
  vatRate?: unknown;
  vatCategory?: string | null;
  vatExemptionReason?: string | null;
  total?: unknown;
  subtotal?: unknown;
  adjustments?: PdfAdjustment[];
};

type PdfVatBreakdown = {
  vatAmount?: unknown;
  vatCategory?: string | null;
  vatRate?: unknown;
};

type PdfDocument = {
  type: 'QUOTE' | 'INVOICE';
  kind?: string | null;
  status?: string | null;
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
  workOrderReference?: string | null;
  workOrderTitle?: string | null;
  workOrderStartDate?: Date | string | null;
  workOrderEndDate?: Date | string | null;
  workOrderAddress?: string | null;
  workOrderPostalCode?: string | null;
  workOrderCity?: string | null;
  correctedInvoiceNumber?: string | null;
  referencedInvoiceNumber?: string | null;
  total?: unknown;
  allowanceTotal?: unknown;
  chargeTotal?: unknown;
  vatAmount?: unknown;
  prepaidAmount?: unknown;
  depositAmount?: unknown;
  amountDue?: unknown;
  currency?: string;
  paymentTerms?: string | null;
  legalMentions?: string | null;
  internalNotes?: string | null;
  notes?: string | Array<{ text?: string | null }> | null;
  issueDate?: Date | string | null;
  date?: Date | string | null;
  dueDate?: Date | string | null;
  validUntil?: Date | string | null;
  items?: PdfItem[];
  adjustments?: PdfAdjustment[];
  vatBreakdowns?: PdfVatBreakdown[];
};

type ComputedLine = PdfItem & {
  totalExclTax: number;
  effectiveVatRate: number | null;
  vatAmount: number;
};

type Totals = {
  lineSubtotal: number;
  allowanceTotal: number;
  chargeTotal: number;
  taxExclusive: number;
  vatLines: Array<{ rate: number; amount: number }>;
  vatAmount: number;
  deposit: number;
  totalInclusive: number;
  netToPay: number;
  exemptionMentions: string[];
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const COLORS = { ink: '#172033', muted: '#64748b', line: '#dbe3ec', soft: '#f4f7fa', accent: '#274c77' };

@Injectable()
export class PdfService {
  async createDocumentPdf(document: PdfDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdf.on('end', () => resolve(Buffer.concat(chunks)));
      pdf.on('error', reject);

      const lines = this.computeLines(document);
      const totals = this.computeTotals(document, lines);
      this.drawHeader(pdf, document);
      this.drawParties(pdf, document);
      this.drawLines(pdf, document, lines);
      this.drawTotals(pdf, document, totals);
      this.drawFooter(pdf, document, totals.exemptionMentions);
      this.addPageNumbers(pdf);
      pdf.end();
    });
  }

  private drawHeader(pdf: PDFKit.PDFDocument, document: PdfDocument) {
    const leftWidth = CONTENT_WIDTH * 0.52;
    const rightX = MARGIN + leftWidth + 18;
    const rightWidth = CONTENT_WIDTH - leftWidth - 18;

    pdf.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(22).text(this.documentTitle(document), MARGIN, MARGIN, { width: leftWidth });
    pdf.fillColor(COLORS.ink).font('Helvetica').fontSize(9);
    this.textLine(pdf, `Numero: ${this.value(document.number)}`, MARGIN, leftWidth);
    this.textLine(pdf, `Date d'emission: ${this.formatDate(document.issueDate ?? document.date)}`, MARGIN, leftWidth);
    this.textLine(pdf, `Date d'echeance: ${this.formatDate(document.dueDate)}`, MARGIN, leftWidth);
    if (document.validUntil) this.textLine(pdf, `Valable jusqu'au: ${this.formatDate(document.validUntil)}`, MARGIN, leftWidth);
    if (document.workOrderReference) this.textLine(pdf, `Reference chantier: ${document.workOrderReference}`, MARGIN, leftWidth);
    if (document.workOrderTitle) this.textLine(pdf, `Chantier: ${document.workOrderTitle}`, MARGIN, leftWidth);
    if (document.correctedInvoiceNumber) this.textLine(pdf, `Facture initiale: ${document.correctedInvoiceNumber}`, MARGIN, leftWidth);
    if (document.referencedInvoiceNumber) this.textLine(pdf, `Facture referencee: ${document.referencedInvoiceNumber}`, MARGIN, leftWidth);
    const leftBottom = pdf.y;

    pdf.y = MARGIN + 34;
    pdf.fillColor(COLORS.ink).font('Helvetica-Bold').fontSize(12).text(document.tenantName, rightX, MARGIN, { width: rightWidth, align: 'right' });
    pdf.font('Helvetica').fontSize(9);
    this.textLine(pdf, this.address(document.tenantStreet1, document.tenantStreet2, document.tenantPostalCode, document.tenantCity), rightX, rightWidth, 'right');
    this.textLine(pdf, `SIRET: ${this.value(document.tenantSiretNumber)}`, rightX, rightWidth, 'right');
    this.textLine(pdf, `TVA: ${this.value(document.tenantVatNumber)}`, rightX, rightWidth, 'right');
    this.textLine(pdf, `Email: ${this.value(document.tenantEmail)}`, rightX, rightWidth, 'right');
    this.textLine(pdf, `Tel: ${this.value(document.tenantPhoneNumber)}`, rightX, rightWidth, 'right');

    const bottom = Math.max(leftBottom, pdf.y, MARGIN + 96);
    pdf.moveTo(MARGIN, bottom + 12).lineTo(PAGE_WIDTH - MARGIN, bottom + 12).strokeColor(COLORS.line).stroke();
    pdf.y = bottom + 18;
  }

  private drawParties(pdf: PDFKit.PDFDocument, document: PdfDocument) {
    const gap = 18;
    const width = (CONTENT_WIDTH - gap) / 2;
    const rightX = MARGIN + width + gap;
    const top = pdf.y;
    const hasWorkOrder = Boolean(document.workOrderReference || document.workOrderTitle || document.workOrderAddress);

    this.drawPanel(pdf, MARGIN, top, width, 'CLIENT', [
      document.customerName,
      document.customerVatNumber ? `TVA: ${document.customerVatNumber}` : '',
      this.address(document.customerStreet1, document.customerStreet2, document.customerPostalCode, document.customerCity),
      `Email: ${this.value(document.customerEmail)}`,
      `Tel: ${this.value(document.customerPhoneNumber)}`,
    ]);
    if (hasWorkOrder) {
      this.drawPanel(pdf, rightX, top, width, 'INFOS CHANTIER', [
        document.workOrderReference ? `Reference: ${document.workOrderReference}` : '',
        document.workOrderTitle ? `Chantier: ${document.workOrderTitle}` : '',
        document.workOrderStartDate ? `Debut: ${this.formatDate(document.workOrderStartDate)}` : '',
        document.workOrderEndDate ? `Fin: ${this.formatDate(document.workOrderEndDate)}` : '',
        this.address(document.workOrderAddress, undefined, document.workOrderPostalCode, document.workOrderCity),
      ]);
    }
    pdf.y = top + (hasWorkOrder ? 94 : 80);
  }

  private drawLines(pdf: PDFKit.PDFDocument, document: PdfDocument, lines: ComputedLine[]) {
    const hasAdjustments = lines.some((line) => (line.adjustments?.length ?? 0) > 0);
    const columns = hasAdjustments ? [20, 145, 32, 40, 60, 95, 40, 79] : [20, 180, 32, 45, 70, 0, 45, 119];
    const headers = hasAdjustments ? ['#', 'Designation', 'Qte', 'Unite', 'PU HT', 'Remises / charges', 'TVA %', 'Total HT'] : ['#', 'Designation', 'Qte', 'Unite', 'PU HT', '', 'TVA %', 'Total HT'];
    this.drawTableRow(pdf, pdf.y, columns, headers, true);
    pdf.y += 24;

    for (const line of lines) {
      const description = [this.value(line.title) || 'Ligne', line.description?.trim()].filter(Boolean).join('\n');
      const adjustmentText = (line.adjustments ?? []).map((adjustment) => `${adjustment.type === 'ALLOWANCE' ? 'Remise' : 'Charge'}: ${adjustment.percentage == null ? this.formatMoney(adjustment.amount, document.currency) : `${this.formatQuantity(adjustment.percentage)} % (${this.formatMoney(adjustment.amount, document.currency)})`}${adjustment.reason ? ` - ${adjustment.reason}` : ''}`).join('\n');
      const cells = [String((line.position ?? 0) + 1), description, this.formatQuantity(line.quantity), this.value(line.unitLabel) || this.value(line.unitCode) || this.value(line.unit) || '-', this.formatMoney(line.unitPrice, document.currency), adjustmentText || '-', this.vatLabel(line.effectiveVatRate, line.vatCategory), this.formatMoney(line.totalExclTax, document.currency)];
      const height = Math.max(25, ...cells.map((cell, index) => this.cellHeight(pdf, cell, columns[index])));
      if (pdf.y + height > PAGE_HEIGHT - 105) {
        pdf.addPage();
        pdf.y = MARGIN;
        this.drawTableRow(pdf, pdf.y, columns, headers, true);
        pdf.y += 24;
      }
      this.drawTableRow(pdf, pdf.y, columns, cells, false);
      pdf.y += height;
    }
    pdf.y += 10;
  }

  private drawTotals(pdf: PDFKit.PDFDocument, document: PdfDocument, totals: Totals) {
    const boxWidth = 250;
    const x = PAGE_WIDTH - MARGIN - boxWidth;
    const rows: Array<[string, string, boolean]> = [['Sous-total lignes', this.formatMoney(totals.lineSubtotal, document.currency), false]];
    if (totals.allowanceTotal) rows.push(['Remises globales', `-${this.formatMoney(totals.allowanceTotal, document.currency)}`, false]);
    if (totals.chargeTotal) rows.push(['Charges globales', `+${this.formatMoney(totals.chargeTotal, document.currency)}`, false]);
    rows.push(['Total HT', this.formatMoney(totals.taxExclusive, document.currency), true]);
    for (const vatLine of totals.vatLines) rows.push([`TVA ${this.formatQuantity(vatLine.rate)} %`, this.formatMoney(vatLine.amount, document.currency), false]);
    if (!totals.vatLines.length) rows.push(['TVA', this.formatMoney(totals.vatAmount, document.currency), false]);
    if (totals.deposit) rows.push(['Acompte', `-${this.formatMoney(totals.deposit, document.currency)}`, false]);
    rows.push(['Total TTC', this.formatMoney(totals.totalInclusive, document.currency), true]);
    rows.push(['Net a payer', this.formatMoney(totals.netToPay, document.currency), true]);

    const height = rows.length * 16 + 10;
    if (pdf.y + height > PAGE_HEIGHT - 105) {
      pdf.addPage();
      pdf.y = MARGIN;
    }
    pdf.roundedRect(x, pdf.y, boxWidth, height, 4).fillAndStroke(COLORS.soft, COLORS.line);
    let rowY = pdf.y + 5;
    for (const [label, value, prominent] of rows) {
      pdf.fillColor(prominent ? COLORS.accent : COLORS.ink).font(prominent ? 'Helvetica-Bold' : 'Helvetica').fontSize(prominent ? 10 : 9);
      pdf.text(label, x + 10, rowY, { width: 135 });
      pdf.text(value, x + 145, rowY, { width: boxWidth - 155, align: 'right' });
      rowY += 16;
    }
    pdf.y += height + 12;
  }

  private drawFooter(pdf: PDFKit.PDFDocument, document: PdfDocument, exemptionMentions: string[]) {
    if (pdf.y > PAGE_HEIGHT - 145) {
      pdf.addPage();
      pdf.y = MARGIN;
    }
    pdf.moveTo(MARGIN, pdf.y).lineTo(PAGE_WIDTH - MARGIN, pdf.y).strokeColor(COLORS.line).stroke();
    pdf.y += 10;
    pdf.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5);
    const footerLines = [
      document.paymentTerms || 'Paiement a 30 jours fin de mois.',
      document.tenantIban || document.tenantBic ? `IBAN: ${this.value(document.tenantIban)}${document.tenantIban && document.tenantBic ? ' - ' : ''}BIC: ${this.value(document.tenantBic)}` : '',
      ...exemptionMentions,
      document.internalNotes ? `Notes internes: ${document.internalNotes}` : '',
      document.notes ? `Notes: ${Array.isArray(document.notes) ? document.notes.map((note) => note.text).filter(Boolean).join(' ') : document.notes}` : '',
      document.legalMentions || 'Merci pour votre confiance.',
    ].filter(Boolean);
    for (const line of footerLines) {
      pdf.text(line, MARGIN, pdf.y, { width: CONTENT_WIDTH });
      pdf.y += 12;
    }
  }

  private drawPanel(pdf: PDFKit.PDFDocument, x: number, y: number, width: number, title: string, lines: string[]) {
    pdf.roundedRect(x, y, width, 78, 4).fillAndStroke('#fbfcfe', COLORS.line);
    pdf.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(8).text(title, x + 10, y + 9, { width: width - 20 });
    pdf.fillColor(COLORS.ink).font('Helvetica').fontSize(8.5);
    let lineY = y + 24;
    for (const line of lines.filter(Boolean)) {
      pdf.text(line, x + 10, lineY, { width: width - 20, lineBreak: false, ellipsis: true });
      lineY += 11;
    }
  }

  private drawTableRow(pdf: PDFKit.PDFDocument, y: number, columns: number[], cells: string[], header: boolean) {
    const height = header ? 24 : Math.max(25, ...cells.map((cell, index) => this.cellHeight(pdf, cell, columns[index])));
    let x = MARGIN;
    if (header) pdf.rect(MARGIN, y, CONTENT_WIDTH, height).fill(COLORS.accent);
    else pdf.rect(MARGIN, y, CONTENT_WIDTH, height).fillAndStroke('#ffffff', COLORS.line);
    cells.forEach((cell, index) => {
      const width = columns[index];
      if (!width) return;
      pdf.fillColor(header ? '#ffffff' : COLORS.ink).font(header ? 'Helvetica-Bold' : 'Helvetica').fontSize(header ? 7 : 7.5);
      pdf.text(cell, x + 4, y + (header ? 7 : 6), { width: width - 8, height: height - 8, align: index === 0 || index === 2 || index >= 4 ? 'right' : 'left' });
      x += width;
    });
  }

  private addPageNumbers(pdf: PDFKit.PDFDocument) {
    const range = pdf.bufferedPageRange();
    for (let index = range.start; index < range.start + range.count; index += 1) {
      pdf.switchToPage(index);
      pdf.fillColor(COLORS.muted).font('Helvetica').fontSize(8).text(`Page ${index + 1} / ${range.count}`, MARGIN, PAGE_HEIGHT - 30, { width: CONTENT_WIDTH, align: 'right' });
    }
  }

  private computeLines(document: PdfDocument): ComputedLine[] {
    return (document.items ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((line, index) => {
      const baseAmount = this.number(line.quantity) * this.number(line.unitPrice);
      const totalExclTax = line.adjustments?.length
        ? line.adjustments.reduce((total, adjustment) => {
          const amount = adjustment.percentage == null ? this.number(adjustment.amount) : baseAmount * this.number(adjustment.percentage) / 100;
          return total + (adjustment.type === 'ALLOWANCE' ? -amount : amount);
        }, baseAmount)
        : this.number(line.subtotal ?? line.total ?? baseAmount);
      const effectiveVatRate = line.vatCategory === 'ZERO' ? null : line.vatCategory === 'STANDARD' || !line.vatCategory ? this.number(line.vatRate) : 0;
      return { ...line, position: line.position ?? index, totalExclTax, effectiveVatRate, vatAmount: effectiveVatRate === null ? 0 : totalExclTax * effectiveVatRate / 100 };
    });
  }

  private computeTotals(document: PdfDocument, lines: ComputedLine[]): Totals {
    const lineSubtotal = lines.reduce((total, line) => total + line.totalExclTax, 0);
    const allowanceTotal = document.adjustments?.length ? document.adjustments.filter((adjustment) => adjustment.type === 'ALLOWANCE').reduce((total, adjustment) => total + this.number(adjustment.amount), 0) : this.number(document.allowanceTotal);
    const chargeTotal = document.adjustments?.length ? document.adjustments.filter((adjustment) => adjustment.type === 'CHARGE').reduce((total, adjustment) => total + this.number(adjustment.amount), 0) : this.number(document.chargeTotal);
    const taxExclusive = lineSubtotal - allowanceTotal + chargeTotal;
    const vatLines = document.vatBreakdowns?.length
      ? document.vatBreakdowns.filter((breakdown) => breakdown.vatCategory === 'STANDARD').map((breakdown) => ({ rate: this.number(breakdown.vatRate), amount: this.number(breakdown.vatAmount) }))
      : Array.from(lines.reduce((vat, line) => {
        if (line.effectiveVatRate !== null) vat.set(line.effectiveVatRate, (vat.get(line.effectiveVatRate) ?? 0) + line.vatAmount);
        return vat;
      }, new Map<number, number>())).map(([rate, amount]) => ({ rate, amount }));
    const vatAmount = vatLines.reduce((total, line) => total + line.amount, 0) || this.number(document.vatAmount);
    const totalInclusive = taxExclusive + vatAmount;
    const deposit = this.number(document.prepaidAmount ?? document.depositAmount);
    const netToPay = document.amountDue == null ? totalInclusive - deposit : this.number(document.amountDue);
    const exemptionMentions = Array.from(new Set(lines.filter((line) => line.vatCategory && line.vatCategory !== 'STANDARD' && line.vatCategory !== 'ZERO').map((line) => line.vatExemptionReason || this.vatMention(line.vatCategory)).filter(Boolean))) as string[];
    return { lineSubtotal, allowanceTotal, chargeTotal, taxExclusive, vatLines: vatLines.filter((line) => Math.abs(line.amount) > 0.005), vatAmount, deposit, totalInclusive, netToPay, exemptionMentions };
  }

  private documentTitle(document: PdfDocument) {
    if (document.type === 'QUOTE') return 'DEVIS';
    if (document.kind === 'CREDIT_NOTE') return 'AVOIR';
    if (document.kind === 'CORRECTIVE') return 'FACTURE RECTIFICATIVE';
    if (document.kind === 'DEPOSIT') return "FACTURE D'ACOMPTE";
    if (document.kind === 'PROGRESS') return 'FACTURE DE SITUATION';
    if (document.kind === 'BALANCE') return 'FACTURE DE SOLDE';
    return 'FACTURE';
  }

  private cellHeight(pdf: PDFKit.PDFDocument, value: string, width: number) {
    pdf.fontSize(7.5);
    return pdf.heightOfString(value, { width: Math.max(width - 8, 1) }) + 12;
  }

  private textLine(pdf: PDFKit.PDFDocument, value: string, x: number, width: number, align: 'left' | 'right' = 'left') {
    pdf.text(value, x, pdf.y, { width, align, lineBreak: false, ellipsis: true });
    pdf.y += 10;
  }

  private address(street1?: string | null, street2?: string | null, postalCode?: string | null, city?: string | null) {
    const firstLine = [street1, street2].filter(Boolean).join(', ');
    const secondLine = [postalCode, city].filter(Boolean).join(' ');
    return [firstLine, secondLine].filter(Boolean).join(' | ') || '-';
  }

  private formatDate(value?: Date | string | null) {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : new Intl.DateTimeFormat('fr-FR').format(date);
  }

  private formatMoney(value: unknown, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(this.number(value));
  }

  private formatQuantity(value: unknown) {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 3 }).format(this.number(value || 1));
  }

  private vatLabel(rate: number | null, category?: string | null) {
    if (category && category !== 'STANDARD' && category !== 'ZERO') return ({ EXEMPT: 'Exo.', REVERSE_CHARGE: 'Autoliq.', INTRA_COMMUNITY_SUPPLY: 'Intracom.', EXPORT: 'Export', OUTSIDE_SCOPE: 'Hors champ' } as Record<string, string>)[category] ?? '-';
    return rate === null ? '-' : rate.toFixed(2);
  }

  private vatMention(category?: string | null) {
    return ({ EXEMPT: 'Exoneration de TVA.', REVERSE_CHARGE: 'Autoliquidation de la TVA par le preneur.', INTRA_COMMUNITY_SUPPLY: 'Livraison intracommunautaire exoneree.', EXPORT: 'Exportation hors UE exoneree.', OUTSIDE_SCOPE: "Operation hors du champ d'application de la TVA." } as Record<string, string>)[category ?? ''];
  }

  private number(value: unknown) {
    const result = Number(value ?? 0);
    return Number.isFinite(result) ? result : 0;
  }

  private value(value?: string | null) {
    return value?.trim() || '-';
  }
}
