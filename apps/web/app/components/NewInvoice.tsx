'use client';

import type { InvoicePdpStatus, InvoiceStatus, PaymentMethod } from '@prisma/client';
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
}

export interface Invoice {
	id: string;
	tenantId: string;
	customerId: string;
	projectId?: string;
	number: string;
	issueDate: string;
	dueDate?: string;
	projectReference: string;
	projectTitle: string;
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
	projectStartDate?: string;
	projectEndDate?: string;
	projectAddress?: string;
	projectPostalCode?: string;
	projectCity?: string;
	status: InvoiceStatus;
	currency: string;
	subtotal: number;
	vatAmount: number;
	total: number;
	paymentTerms?: string;
	legalMentions?: string;
	notes?: string;
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

export default function NewInvoice({
	invoice,
}: NewInvoiceProps) {
	const locale = 'fr-FR';
	const currency = invoice.currency || 'EUR';
	const lines = (invoice.items || []).slice().sort((a, b) => a.position - b.position);

	const computedLines = lines.map((line) => {
		const totalExclTax = line.quantity * line.unitPrice;
		const vatAmount = totalExclTax * (line.vatRate / 100);

		return {
			...line,
			totalExclTax,
			vatAmount,
		};
	});

	const customerFullName = [invoice.customerFirstName, invoice.customerLastName]
		.filter(Boolean)
		.join(' ')
		.trim();

	return (
		<section className={styles.invoicePage}>
		<article className={styles.invoiceDocument}>
			<header className={`${styles.invoiceHeader} ${styles.keepTogether}`}>
				<div>
					<h1 className={styles.invoiceTitle}>FACTURE</h1>
					<p className={styles.invoiceMuted}>Numero: {invoice.number}</p>
					<p className={styles.invoiceMuted}>Date d&apos;emission: {formatDate(invoice.issueDate, locale)}</p>
					<p className={styles.invoiceMuted}>Date d&apos;echeance: {formatDate(invoice.dueDate, locale)}</p>
					<p className={styles.invoiceMuted}>Reference chantier: {invoice.projectReference || '-'}</p>
					<p className={styles.invoiceMuted}>Chantier: {invoice.projectTitle}</p>
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
					<p className={styles.invoiceMuted}>Debut: {formatDate(invoice.projectStartDate, locale)}</p>
					<p className={styles.invoiceMuted}>Fin: {formatDate(invoice.projectEndDate, locale)}</p>
					<p className={styles.invoiceMuted}>Adresse chantier: {formatAddress(invoice.projectAddress, undefined, invoice.projectPostalCode, invoice.projectCity)}</p>
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
								<td className={styles.invoiceTableCell}>{line.unit || '-'}</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{formatMoney(line.unitPrice, locale, currency)}</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{line.vatRate.toFixed(2)}</td>
								<td className={`${styles.invoiceTableCell} ${styles.invoiceCellRight}`}>{formatMoney(line.totalExclTax, locale, currency)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>

			<section className={`${styles.invoiceTotals} ${styles.keepTogether}`}>
				<div className={styles.invoiceTotalsBox}>
					<div className={styles.invoiceTotalLine}>
						<span>Total HT</span>
						<strong>{formatMoney(invoice.subtotal, locale, currency)}</strong>
					</div>
					<div className={styles.invoiceTotalLine}>
						<span>Total TVA</span>
						<strong>{formatMoney(invoice.vatAmount, locale, currency)}</strong>
					</div>
					{!!invoice.discountAmount && (
						<div className={styles.invoiceTotalLine}>
							<span>Remise</span>
							<strong>-{formatMoney(invoice.discountAmount, locale, currency)}</strong>
						</div>
					)}
					{!!invoice.depositAmount && (
						<div className={styles.invoiceTotalLine}>
							<span>Acompte</span>
							<strong>-{formatMoney(invoice.depositAmount, locale, currency)}</strong>
						</div>
					)}
					<div className={`${styles.invoiceTotalLine} ${styles.invoiceTotalMain}`}>
						<span>Total TTC</span>
						<strong>{formatMoney(invoice.total, locale, currency)}</strong>
					</div>
				</div>
			</section>

			<footer className={`${styles.invoiceFooter} ${styles.keepTogether}`}>
				<p className={styles.invoiceMuted}>{invoice.paymentTerms || 'Paiement a 30 jours fin de mois.'}</p>
				{invoice.notes && <p className={styles.invoiceMuted}>Notes chantier: {invoice.notes}</p>}
				<p className={styles.invoiceMuted}>{invoice.legalMentions || 'Merci pour votre confiance.'}</p>
			</footer>
		</article>
		</section>
	);
}
