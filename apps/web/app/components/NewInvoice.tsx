'use client';

import { ProjectItemType } from '@prisma/client';
import styles from './NewInvoice.module.css';

export interface InvoiceAddress {
	street1?: string;
	street2?: string;
	postalCode?: string;
	city?: string;
	countryCode?: string;
}

export interface InvoiceCustomer {
	firstName?: string;
	lastName?: string;
	company?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	address?: InvoiceAddress;
}

export interface InvoiceCompany {
	companyName: string;
	siret?: string;
	vatNumber?: string;
	email?: string;
	phone?: string;
	address?: InvoiceAddress;
}

export interface InvoiceProjectItem {
	id: string;
	position: number;
	type: ProjectItemType;
	title: string;
	description?: string;
	quantity: number;
	unit?: string;
	unitPrice: number;
	vatRate: number;
}

export interface InvoiceProjectDetails {
	id?: string;
	title: string;
	reference?: string;
	description?: string;
	startDate?: string;
	endDate?: string;
	notes?: string;
	customer?: InvoiceCustomer;
	projectAddress?: InvoiceAddress;
	projectItems: InvoiceProjectItem[];
}

interface Project {
  id: string;
  title: string;
  description?: string;

  reference: string;

  startDate?: string;   
  endDate?: string;     

  status: ProjectStatus;

  projectItems?: ProjectItem[];

  customerId? : string;
  addressId? : string;
  createdById? : string;

  // createdAt: string;
}

interface ProjectItem{
  id: string;
  position: number;
  type: ProjectItemType;

  title: string;
  description?: string;
  quantity : number;
  unit?: string;
  unitPrice: number;
  vatRate: number;

  // createdAt: string;
  // updatedAt: string;
}

export interface InvoiceMeta {
	invoiceNumber: string;
	issueDate?: string;
	dueDate?: string;
}

interface NewInvoiceProps {
	project: InvoiceProjectDetails;
	company: InvoiceCompany;
	invoice: InvoiceMeta;
	currency?: string;
	locale?: string;
	paymentTerms?: string;
	footerNote?: string;
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

function formatAddress(address?: InvoiceAddress): string {
	if (!address) return '-';
	const line1 = [address.street1, address.street2].filter(Boolean).join(', ');
	const line2 = [address.postalCode, address.city].filter(Boolean).join(' ');
	const line3 = address.countryCode || '';
	return [line1, line2, line3].filter(Boolean).join(' | ') || '-';
}

export default function NewInvoice({
	project,
	company,
	invoice,
	currency = 'EUR',
	locale = 'fr-FR',
	paymentTerms = 'Paiement a 30 jours fin de mois.',
	footerNote = 'Merci pour votre confiance.',
}: NewInvoiceProps) {
	const lines = (project.projectItems || []).slice().sort((a, b) => a.position - b.position);

	const computedLines = lines.map((line) => {
		const totalExclTax = line.quantity * line.unitPrice;
		const vatAmount = totalExclTax * (line.vatRate / 100);
		const totalInclTax = totalExclTax + vatAmount;

		return {
			...line,
			totalExclTax,
			vatAmount,
			totalInclTax,
		};
	});

	const totalExclTax = computedLines.reduce((sum, line) => sum + line.totalExclTax, 0);
	const totalVat = computedLines.reduce((sum, line) => sum + line.vatAmount, 0);
	const totalInclTax = totalExclTax + totalVat;

	const customerFullName = [project.customer?.firstName, project.customer?.lastName]
		.filter(Boolean)
		.join(' ')
		.trim();

	return (
		<section className={styles.invoicePage}>
		<article className={styles.invoiceDocument}>
			<header className={`${styles.invoiceHeader} ${styles.keepTogether}`}>
				<div>
					<h1 className={styles.invoiceTitle}>FACTURE</h1>
					<p className={styles.invoiceMuted}>Numero: {invoice.invoiceNumber}</p>
					<p className={styles.invoiceMuted}>Date d&apos;emission: {formatDate(invoice.issueDate, locale)}</p>
					<p className={styles.invoiceMuted}>Date d&apos;echeance: {formatDate(invoice.dueDate, locale)}</p>
					<p className={styles.invoiceMuted}>Reference chantier: {project.reference || '-'}</p>
					<p className={styles.invoiceMuted}>Chantier: {project.title}</p>
				</div>

				<div className={styles.rightBlock}>
					<h2 className={styles.invoiceSectionTitle}>{company.companyName}</h2>
					<p className={styles.invoiceMuted}>{formatAddress(company.address)}</p>
					<p className={styles.invoiceMuted}>SIRET: {company.siret || '-'}</p>
					<p className={styles.invoiceMuted}>TVA: {company.vatNumber || '-'}</p>
					<p className={styles.invoiceMuted}>Email: {company.email || '-'}</p>
					<p className={styles.invoiceMuted}>Tel: {company.phone || '-'}</p>
				</div>
			</header>

			<section className={`${styles.invoiceParty} ${styles.keepTogether}`}>
				<div>
					<h3 className={styles.invoiceSectionTitle}>Client</h3>
					<p className={styles.invoiceMuted}>{project.customer?.company || customerFullName || '-'}</p>
					<p className={styles.invoiceMuted}>{customerFullName || '-'}</p>
					<p className={styles.invoiceMuted}>{formatAddress(project.customer?.address)}</p>
					<p className={styles.invoiceMuted}>Email: {project.customer?.email || '-'}</p>
					<p className={styles.invoiceMuted}>Tel: {project.customer?.phone || project.customer?.mobile || '-'}</p>
				</div>

				<div className={styles.rightBlock}>
					<h3 className={styles.invoiceSectionTitle}>Infos chantier</h3>
					<p className={styles.invoiceMuted}>Debut: {formatDate(project.startDate, locale)}</p>
					<p className={styles.invoiceMuted}>Fin: {formatDate(project.endDate, locale)}</p>
					<p className={styles.invoiceMuted}>Adresse chantier: {formatAddress(project.projectAddress)}</p>
				</div>
			</section>

			<section className={`${styles.invoiceLines} ${styles.keepTogether}`}>
				<table className={styles.invoiceTable}>
					<thead>
						<tr className={styles.invoiceTableHeadRow}>
							<th className={styles.invoiceTableHeadCell}>#</th>
							<th className={styles.invoiceTableHeadCell}>Designation</th>
							<th className={styles.invoiceTableHeadCell}>Type</th>
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
								<td className={styles.invoiceTableCell}>{line.type}</td>
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
						<strong>{formatMoney(totalExclTax, locale, currency)}</strong>
					</div>
					<div className={styles.invoiceTotalLine}>
						<span>Total TVA</span>
						<strong>{formatMoney(totalVat, locale, currency)}</strong>
					</div>
					<div className={`${styles.invoiceTotalLine} ${styles.invoiceTotalMain}`}>
						<span>Total TTC</span>
						<strong>{formatMoney(totalInclTax, locale, currency)}</strong>
					</div>
				</div>
			</section>

			<footer className={`${styles.invoiceFooter} ${styles.keepTogether}`}>
				<p className={styles.invoiceMuted}>{paymentTerms}</p>
				{project.notes && <p className={styles.invoiceMuted}>Notes chantier: {project.notes}</p>}
				<p className={styles.invoiceMuted}>{footerNote}</p>
			</footer>
		</article>
		</section>
	);
}
