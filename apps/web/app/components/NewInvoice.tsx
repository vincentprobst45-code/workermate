'use client';

import type { InvoicePdpStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
import { VatCategory } from '@prisma/client';
import styles from './NewInvoice.module.css';

export interface InvoiceItem {
	id: string;
	invoiceId: string;
	position: number;
	title: string;
	description: string;
	quantity: number;
	unit?: string;
	unitPrice: number;
	vatRate: number;
	total: number;
	lineIdentifier?: string;
	unitCode?: string;
	unitLabel?: string;
	subtotal?: number;
	vatCategory?: string;
	adjustments?: InvoiceItemAdjustment[];
}

interface InvoiceItemAdjustment {
	id?: string;
	position: number;
	type: 'ALLOWANCE' | 'CHARGE';
	amount: number;
	baseAmount?: number;
	percentage?: number;
	reason?: string;
	reasonCode?: string;
}

export interface Invoice {
	id: string;
	tenantId: string;
	customerId: string;
	workOrderId?: string;
	number: string;
	issueDate: string;
	dueDate?: string;
	workOrderReference: string;
	workOrderTitle: string;
	tenantName: string;
	tenantStreet1: string;
	tenantStreet2?: string;
	tenantPostalCode: string;
	tenantCity: string;
	tenantSiretNumber: string;
	tenantVatNumber: string;
	tenantEmail: string;
	tenantPhoneNumber: string;
	tenantIban?: string;
	tenantBic?: string;
	customerFirstName: string;
	customerLastName: string;
	customerStreet1: string;
	customerStreet2?: string;
	customerPostalCode: string;
	customerCity: string;
	customerEmail?: string;
	customerPhoneNumber?: string;
	customerVatNumber?: string;
	workOrderStartDate?: string;
	workOrderEndDate?: string;
	workOrderAddress?: string;
	workOrderPostalCode?: string;
	workOrderCity?: string;
	status: InvoiceStatus;
	currency: string;
	subtotal: number;
	vatAmount: number;
	total: number;
	paymentTerms?: string;
	legalMentions?: string;
	depositAmount?: number;
	discountAmount?: number;
	paidAt?: string;
	paymentMethod?: PaymentMethod;
	pdfFileId?: string;
	pdpStatus: InvoicePdpStatus;
	pdpMessageId?: string;
	quoteId?: string;
	quoteNumber?: string;
	createdAt: string;
	updatedAt: string;
	items?: InvoiceItem[];
	kind?: string;
	correctedInvoiceNumber?: string;
	correctedInvoiceIssueDate?: string;
	references?: Array<{
		referencedInvoiceNumber: string;
		referencedInvoiceIssueDate: string;
	}>;
	operationCategory?: string;
	tenantSirenNumber?: string;
	tenantCountryCode?: string;
	customerName?: string;
	customerCountryCode?: string;
	lineNetTotal?: number;
	taxExclusiveAmount?: number;
	taxInclusiveAmount?: number;
	prepaidAmount?: number;
	amountDue?: number;
	internalNotes?: string;
	allowanceTotal?: number;
	chargeTotal?: number;
	adjustments?: Array<{ id: string; position: number; type: 'ALLOWANCE' | 'CHARGE'; amount: number; reason?: string; vatCategory?: VatCategory; vatRate?: number }>;
	vatBreakdowns?: Array<{ taxableAmount: number; vatAmount: number; vatCategory: VatCategory; vatRate?: number | null }>;
	notes?: string | Array<{ text: string }>;
}

interface NewInvoiceProps {
	invoice: Invoice;
}

function formatDate(value?: string, locale = 'fr-FR'): string {
	if (!value) return '-';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '-';
	return new Intl.DateTimeFormat(locale).format(date);
}

function formatMoney(value: number, locale = 'fr-FR', currency = 'EUR'): string {
	return new Intl.NumberFormat(locale, {
		style: 'currency',
		currency,
	}).format(value);
}

function formatAddress(street1?: string, street2?: string, postalCode?: string, city?: string): string {
	const line1 = [street1, street2].filter(Boolean).join(', ');
	const line2 = [postalCode, city].filter(Boolean).join(' ');
	return [line1, line2].filter(Boolean).join(' | ') || '-';
}

function getEffectiveVatRate(vatCategory: VatCategory | string | undefined, vatRate: number): number | null {
	if (vatCategory === VatCategory.ZERO) {
		return null;
	}

	return vatCategory === VatCategory.STANDARD ? vatRate : 0;
}

export default function NewInvoice({
	invoice,
}: NewInvoiceProps) {
	const locale = 'fr-FR';
	const currency = invoice.currency || 'EUR';
	const lines = (invoice.items || []).slice().sort((a, b) => a.position - b.position);

	const computedLines = lines.map((line) => {
		const baseAmount = Number(line.quantity) * Number(line.unitPrice);
		const totalExclTax = line.adjustments?.length
			? line.adjustments.reduce(
				(total, adjustment) => {
					const amount = adjustment.percentage == null
						? Number(adjustment.amount || 0)
						: baseAmount * Number(adjustment.percentage || 0) / 100;
					return total + (adjustment.type === 'ALLOWANCE' ? -amount : amount);
				},
				baseAmount,
			)
			: Number(line.subtotal ?? baseAmount);
		const effectiveVatRate = getEffectiveVatRate(line.vatCategory, Number(line.vatRate || 0));
		const vatAmount = effectiveVatRate === null ? 0 : totalExclTax * (effectiveVatRate / 100);

		return {
			...line,
			totalExclTax,
			effectiveVatRate,
			vatAmount,
		};
	});
	const lineSubtotal = computedLines.reduce((total, line) => total + line.totalExclTax, 0);
	const allowanceTotal = invoice.adjustments?.length
		? invoice.adjustments.filter((adjustment) => adjustment.type === 'ALLOWANCE').reduce((total, adjustment) => total + Number(adjustment.amount || 0), 0)
		: Number(invoice.allowanceTotal || 0);
	const chargeTotal = invoice.adjustments?.length
		? invoice.adjustments.filter((adjustment) => adjustment.type === 'CHARGE').reduce((total, adjustment) => total + Number(adjustment.amount || 0), 0)
		: Number(invoice.chargeTotal || 0);
	const calculatedTaxExclusiveAmount = lineSubtotal - allowanceTotal + chargeTotal;
	const vatByRate = new Map<number, number>();
	if (invoice.vatBreakdowns?.length) {
		invoice.vatBreakdowns.forEach((breakdown) => {
			if (breakdown.vatCategory !== VatCategory.STANDARD) return;
			const rate = Number(breakdown.vatRate || 0);
			vatByRate.set(rate, (vatByRate.get(rate) || 0) + Number(breakdown.vatAmount || 0));
		});
	} else {
		const taxableByRate = new Map<number, number>();
		computedLines.forEach((line) => {
			if (line.effectiveVatRate === null) return;
			const rate = line.effectiveVatRate;
			taxableByRate.set(rate, (taxableByRate.get(rate) || 0) + line.totalExclTax);
		});
		(invoice.adjustments || []).forEach((adjustment) => {
			if (adjustment.vatCategory && adjustment.vatCategory !== VatCategory.STANDARD) return;
			const taxableTotal = Array.from(taxableByRate.values()).reduce((total, base) => total + base, 0);
			if (taxableTotal === 0) return;
			const signedAmount = adjustment.type === 'ALLOWANCE' ? -Number(adjustment.amount || 0) : Number(adjustment.amount || 0);
			taxableByRate.forEach((base, rate) => {
				taxableByRate.set(rate, base + signedAmount * base / taxableTotal);
			});
		});
		taxableByRate.forEach((base, rate) => {
			vatByRate.set(rate, base * rate / 100);
		});
	}
	const vatLines = Array.from(vatByRate.entries())
		.filter(([, amount]) => Math.abs(amount) > 0.005)
		.sort(([rateA], [rateB]) => rateA - rateB)
		.map(([rate, amount]) => ({ rate, amount }));
	const displayedTaxExclusiveAmount = calculatedTaxExclusiveAmount;
	const displayedVatAmount = vatLines.length > 0
		? vatLines.reduce((total, vatLine) => total + vatLine.amount, 0)
		: Number(invoice.vatAmount || 0);
	const displayedTaxInclusiveAmount = displayedTaxExclusiveAmount + displayedVatAmount;
	const customerFullName = [invoice.customerName || invoice.customerFirstName, invoice.customerLastName]
		.filter(Boolean)
		.join(' ')
		.trim();
	const initialInvoiceReference = invoice.kind === 'CORRECTIVE'
		? invoice.correctedInvoiceNumber
		: invoice.kind === 'CREDIT_NOTE'
			? invoice.references?.[0]?.referencedInvoiceNumber
			: undefined;
	const initialInvoiceIssueDate = invoice.kind === 'CORRECTIVE'
		? invoice.correctedInvoiceIssueDate
		: invoice.kind === 'CREDIT_NOTE'
			? invoice.references?.[0]?.referencedInvoiceIssueDate
			: undefined;

	return (
		<section className={styles.invoicePage}>
		<article className={styles.invoiceDocument}>
			<header className={`${styles.invoiceHeader} ${styles.keepTogether}`}>
				<div>
					<h1 className={styles.invoiceTitle}>FACTURE</h1>
					<p className={styles.invoiceMuted}>Numero: {invoice.number}</p>
					<p className={styles.invoiceMuted}>Date d&apos;emission: {formatDate(invoice.issueDate, locale)}</p>
					<p className={styles.invoiceMuted}>Date d&apos;echeance: {formatDate(invoice.dueDate, locale)}</p>
					<p className={styles.invoiceMuted}>Reference chantier: {invoice.workOrderReference || '-'}</p>
					<p className={styles.invoiceMuted}>Chantier: {invoice.workOrderTitle}</p>
					{initialInvoiceReference && (
						<>
							<p className={styles.invoiceMuted}>Facture initiale: {initialInvoiceReference}</p>
							<p className={styles.invoiceMuted}>Date facture initiale: {formatDate(initialInvoiceIssueDate, locale)}</p>
						</>
					)}
				</div>

				<div className={styles.rightBlock}>
					<h2 className={styles.invoiceSectionTitle}>{invoice.tenantName}</h2>
					<p className={styles.invoiceMuted}>{formatAddress(invoice.tenantStreet1, invoice.tenantStreet2, invoice.tenantPostalCode, invoice.tenantCity)}</p>
					<p className={styles.invoiceMuted}>SIRET: {invoice.tenantSiretNumber || '-'}</p>
					<p className={styles.invoiceMuted}>TVA: {invoice.tenantVatNumber || '-'}</p>
					<p className={styles.invoiceMuted}>Email: {invoice.tenantEmail || '-'}</p>
					<p className={styles.invoiceMuted}>Tel: {invoice.tenantPhoneNumber || '-'}</p>
				</div>
			</header>

			<section className={`${styles.invoiceParty} ${styles.keepTogether}`}>
				<div>
					<h3 className={styles.invoiceSectionTitle}>Client</h3>
					<p className={styles.invoiceMuted}>{customerFullName || '-'}</p>
					<p className={styles.invoiceMuted}>{customerFullName || '-'}</p>
					<p className={styles.invoiceMuted}>{formatAddress(invoice.customerStreet1, invoice.customerStreet2, invoice.customerPostalCode, invoice.customerCity)}</p>
					<p className={styles.invoiceMuted}>Email: {invoice.customerEmail || '-'}</p>
					<p className={styles.invoiceMuted}>Tel: {invoice.customerPhoneNumber || '-'}</p>
				</div>

				<div className={styles.rightBlock}>
					<h3 className={styles.invoiceSectionTitle}>Infos chantier</h3>
					<p className={styles.invoiceMuted}>Debut: {formatDate(invoice.workOrderStartDate, locale)}</p>
					<p className={styles.invoiceMuted}>Fin: {formatDate(invoice.workOrderEndDate, locale)}</p>
					<p className={styles.invoiceMuted}>Adresse chantier: {formatAddress(invoice.workOrderAddress, undefined, invoice.workOrderPostalCode, invoice.workOrderCity)}</p>
				</div>
			</section>

			<section className={`${styles.invoiceLines} ${styles.keepTogether}`}>
				<table className={styles.invoiceTable}>
					<thead>
						<tr className={styles.invoiceTableHeadRow}>
							<th className={styles.invoiceTableHeadCell}>#</th>
							<th className={styles.invoiceTableHeadCell}>Designation</th>
							<th className={`${styles.invoiceTableHeadCell} ${styles.invoiceCellRight}`}>Qte</th>
							<th className={styles.invoiceTableHeadCell}>Unite</th>
							<th className={`${styles.invoiceTableHeadCell} ${styles.invoiceCellRight}`}>PU HT</th>
							<th className={styles.invoiceTableHeadCell}>Remises / charges</th>
							<th className={`${styles.invoiceTableHeadCell} ${styles.invoiceCellRight}`}>TVA %</th>
							<th className={`${styles.invoiceTableHeadCell} ${styles.invoiceCellRight}`}>Total HT</th>
						</tr>
					</thead>
					<tbody>
						{computedLines.map((line) => (
							<tr key={line.id} className={`${styles.invoiceTableRow} ${styles.keepTogether}`}>
								<td className={styles.invoiceTableCell}>{line.position + 1}</td>
								<td className={styles.invoiceTableCell}>
									<p>{line.title}</p>
									{line.description && <p className={styles.invoiceSubtext}>{line.description}</p>}
								</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{line.quantity}</td>
								<td className={styles.invoiceTableCell}>{line.unitLabel || line.unitCode || line.unit || '-'}</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{formatMoney(line.unitPrice, locale, currency)}</td>
								<td className={styles.invoiceTableCell}>
									{line.adjustments?.length ? line.adjustments.map((adjustment) => (
										<p key={adjustment.id ?? `${line.id}-${adjustment.position}`} className={styles.invoiceSubtext}>
											{adjustment.type === 'ALLOWANCE' ? 'Remise' : 'Charge'}: {adjustment.percentage == null ? formatMoney(Number(adjustment.amount || 0), locale, currency) : `${Number(adjustment.percentage)} % (${formatMoney(Number(adjustment.amount || 0), locale, currency)})`}{adjustment.reason ? ` - ${adjustment.reason}` : ''}
										</p>
									)) : '-'}
								</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{line.effectiveVatRate === null ? '-' : line.effectiveVatRate.toFixed(2)}</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{formatMoney(line.totalExclTax, locale, currency)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			<section className={`${styles.invoiceTotals} ${styles.keepTogether}`}>
				<div className={styles.invoiceTotalsBox}>
					<div className={styles.invoiceTotalLine}>
						<span>Sous-total lignes</span>
						<strong>{formatMoney(lineSubtotal, locale, currency)}</strong>
					</div>
					{!!allowanceTotal && (
						<div className={styles.invoiceTotalLine}>
							<span>Remises globales</span>
							<strong>-{formatMoney(allowanceTotal, locale, currency)}</strong>
						</div>
					)}
					{!!chargeTotal && (
						<div className={styles.invoiceTotalLine}>
							<span>Charges globales</span>
							<strong>+{formatMoney(chargeTotal, locale, currency)}</strong>
						</div>
					)}
					<div className={`${styles.invoiceTotalLine} ${styles.invoiceTotalMain}`}>
						<span>Total HT</span>
						<strong>{formatMoney(displayedTaxExclusiveAmount, locale, currency)}</strong>
					</div>
					{vatLines.map((vatLine) => (
						<div key={vatLine.rate} className={styles.invoiceTotalLine}>
							<span>TVA {vatLine.rate} %</span>
							<strong>{formatMoney(vatLine.amount, locale, currency)}</strong>
						</div>
					))}
					{vatLines.length === 0 && (
						<div className={styles.invoiceTotalLine}>
							<span>TVA</span>
							<strong>{formatMoney(invoice.vatAmount, locale, currency)}</strong>
						</div>
					)}
					{!!invoice.prepaidAmount && (
						<div className={styles.invoiceTotalLine}>
							<span>Acompte</span>
							<strong>-{formatMoney(invoice.prepaidAmount, locale, currency)}</strong>
						</div>
					)}
					<div className={`${styles.invoiceTotalLine} ${styles.invoiceTotalMain}`}>
						<span>Total TTC</span>
						<strong>{formatMoney(displayedTaxInclusiveAmount, locale, currency)}</strong>
					</div>
				</div>
			</section>

			<footer className={`${styles.invoiceFooter} ${styles.keepTogether}`}>
				<p className={styles.invoiceMuted}>{invoice.paymentTerms || 'Paiement a 30 jours fin de mois.'}</p>
				{invoice.internalNotes && <p className={styles.invoiceMuted}>Notes internes: {invoice.internalNotes}</p>}
				{invoice.notes && <p className={styles.invoiceMuted}>Notes: {Array.isArray(invoice.notes) ? invoice.notes.map((note) => note.text).join(' ') : invoice.notes}</p>}
				<p className={styles.invoiceMuted}>{invoice.legalMentions || 'Merci pour votre confiance.'}</p>
			</footer>
		</article>
		</section>
	);
}
