'use client';

import {
	closestCenter,
	DndContext,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
	InvoicePdpStatus,
	InvoiceStatus,
	PaymentMethod,
	LineItemType as WorkOrderItemType,
} from '@prisma/client';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import CatalogItemList, { type CatalogItem } from './CatalogItemList';
import AddCustomerForm, { type Customer } from './AddCustomerForm';
import AddWorkOrderForm from './AddWorkOrderForm';
import type { Invoice as CreatedInvoice } from './InvoicesList';
import type { Invoice as PreviewInvoice } from './NewInvoice';
import QuotesList, { type Quote as QuoteOption } from './QuotesList';
import WorkOrdersList, { type WorkOrder as WorkOrderBase } from './WorkOrdersList';

type CustomerMode = 'new' | 'existing';
type WorkOrderMode = 'new' | 'existing';

interface TenantInvoiceDefaults {
	name?: string | null;
	email?: string | null;
	phoneNumber?: string | null;
	siretNumber?: string | null;
	vatNumber?: string | null;
	iban?: string | null;
	bic?: string | null;
	defaultCurrency?: string | null;
	defaultPaymentTerms?: string | null;
	defaultLegalMentions?: string | null;
	defaultInvoiceNotes?: string | null;
	address: {
		street1?: string;
		street2?: string;
		postalCode?: string;
		city?: string;
	} | null;
}

interface CustomerOption {
	id: string;
	firstName?: string;
	lastName?: string;
	company?: string;
	email?: string;
	phone?: string;
	mobile?: string;
	vatNumber?: string;
	address?: {
		street1?: string;
		street2?: string;
		postalCode?: string;
		city?: string;
	};
}

interface WorkOrderOption extends WorkOrderBase {
	address?: {
		street1?: string;
		postalCode?: string;
		city?: string;
	};
}

interface AddInvoiceItemFormData {
	rowId: string;
	type: WorkOrderItemType;
	position: number;
	title: string;
	description: string;
	quantity: number;
	unit?: string;
	unitPrice: number;
	vatRate: number;
	total: number;
}

export interface AddInvoiceFormData {
	customerId: string;
	workOrderId: string;
	number: string;
	issueDate: string;
	dueDate: string;
	workOrderReference: string;
	workOrderTitle: string;
	tenantName: string;
	tenantStreet1: string;
	tenantStreet2: string;
	tenantPostalCode: string;
	tenantCity: string;
	tenantSiretNumber: string;
	tenantVatNumber: string;
	tenantEmail: string;
	tenantPhoneNumber: string;
	tenantIban: string;
	tenantBic: string;
	customerFirstName: string;
	customerLastName: string;
	customerStreet1: string;
	customerStreet2: string;
	customerPostalCode: string;
	customerCity: string;
	customerEmail: string;
	customerPhoneNumber: string;
	customerVatNumber: string;
	workOrderStartDate: string;
	workOrderEndDate: string;
	workOrderAddress: string;
	workOrderPostalCode: string;
	workOrderCity: string;
	status: InvoiceStatus;
	currency: string;
	subtotal: number;
	vatAmount: number;
	total: number;
	paymentTerms: string;
	legalMentions: string;
	notes: string;
	depositAmount: number;
	discountAmount: number;
	paidAt: string;
	paymentMethod: PaymentMethod | '';
	pdfFileId: string;
	pdpStatus: InvoicePdpStatus;
	pdpMessageId: string;
	quoteId: string;
	quoteNumber: string;
	invoiceItems: AddInvoiceItemFormData[];
}

interface CreateInvoiceItemPayload {
	type: WorkOrderItemType;
	position: number;
	title: string;
	description: string;
	quantity: number;
	unit?: string;
	unitPrice: number;
	vatRate: number;
	total: number;
}

interface CreateInvoiceDto {
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
	status?: InvoiceStatus;
	currency?: string;
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
	pdpStatus?: InvoicePdpStatus;
	pdpMessageId?: string;
	quoteId?: string;
	quoteNumber?: string;
	invoiceItems?: CreateInvoiceItemPayload[];
	kind?: string;
	operationCategory: 'GOODS' | 'SERVICES' | 'MIXED';
	tenantSirenNumber: string;
	tenantCountryCode: string;
	customerName: string;
	customerCountryCode: string;
	accountingCurrency?: string;
	internalNotes?: string;
}

const INVOICE_NUMBER_PREFIX = 'FAC';
const INVOICE_NUMBER_PAD = 4;

function getInvoiceYear(value?: string): number {
	if (!value) {
		return new Date().getFullYear();
	}

	const parsedDate = new Date(value);
	if (Number.isNaN(parsedDate.getTime())) {
		return new Date().getFullYear();
	}

	return parsedDate.getFullYear();
}

function parseInvoiceNumber(value: string): { year: number; sequence: number } | null {
	const match = /^FAC-(\d{4})-(\d+)$/.exec(value.trim());
	if (!match) {
		return null;
	}

	const year = Number(match[1]);
	const sequence = Number(match[2]);
	if (!Number.isFinite(year) || !Number.isFinite(sequence)) {
		return null;
	}

	return { year, sequence };
}

function formatInvoiceNumber(year: number, sequence: number): string {
	return `${INVOICE_NUMBER_PREFIX}-${year}-${String(sequence).padStart(INVOICE_NUMBER_PAD, '0')}`;
}

function computeSequenceByYearFromNumbers(numbers: string[]): Record<number, number> {
	const maxByYear: Record<number, number> = {};

	for (const number of numbers) {
		const parsed = parseInvoiceNumber(number);
		if (!parsed) {
			continue;
		}

		maxByYear[parsed.year] = Math.max(maxByYear[parsed.year] ?? 0, parsed.sequence);
	}

	return maxByYear;
}

function toDatetimeLocal(date: Date): string {
	const offset = date.getTimezoneOffset();
	const local = new Date(date.getTime() - offset * 60_000);
	return local.toISOString().slice(0, 16);
}

function trimToUndefined(value?: string | null): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

function trimOrEmpty(value?: string | null): string {
	return value?.trim() ?? '';
}

function createEmptyInvoice(tenantDefaults?: TenantInvoiceDefaults): AddInvoiceFormData {
	const now = new Date();
	const due = new Date(now);
	due.setDate(due.getDate() + 30);

	return {
		customerId: '',
		workOrderId: '',
		number: '',
		issueDate: toDatetimeLocal(now),
		dueDate: toDatetimeLocal(due),
		workOrderReference: '',
		workOrderTitle: '',
		tenantName: tenantDefaults?.name ?? '',
		tenantStreet1: tenantDefaults?.address?.street1 ?? '',
		tenantStreet2: tenantDefaults?.address?.street2 ?? '',
		tenantPostalCode: tenantDefaults?.address?.postalCode ?? '',
		tenantCity: tenantDefaults?.address?.city ?? '',
		tenantSiretNumber: tenantDefaults?.siretNumber ?? '',
		tenantVatNumber: tenantDefaults?.vatNumber ?? '',
		tenantEmail: tenantDefaults?.email ?? '',
		tenantPhoneNumber: tenantDefaults?.phoneNumber ?? '',
		tenantIban: tenantDefaults?.iban ?? '',
		tenantBic: tenantDefaults?.bic ?? '',
		customerFirstName: '',
		customerLastName: '',
		customerStreet1: '',
		customerStreet2: '',
		customerPostalCode: '',
		customerCity: '',
		customerEmail: '',
		customerPhoneNumber: '',
		customerVatNumber: '',
		workOrderStartDate: '',
		workOrderEndDate: '',
		workOrderAddress: '',
		workOrderPostalCode: '',
		workOrderCity: '',
		status: 'DRAFT',
		currency: tenantDefaults?.defaultCurrency ?? 'EUR',
		subtotal: 0,
		vatAmount: 0,
		total: 0,
		paymentTerms: tenantDefaults?.defaultPaymentTerms ?? '',
		legalMentions: tenantDefaults?.defaultLegalMentions ?? '',
		notes: tenantDefaults?.defaultInvoiceNotes ?? '',
		depositAmount: 0,
		discountAmount: 0,
		paidAt: '',
		paymentMethod: '',
		pdfFileId: '',
		pdpStatus: 'NOT_SENT',
		pdpMessageId: '',
		quoteId: '',
		quoteNumber: '',
		invoiceItems: [createEmptyInvoiceItem(0)],
	};
}

function toFiniteNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

function createInvoiceItemRowId(): string {
	return crypto.randomUUID();
}

function createEmptyInvoiceItem(position: number): AddInvoiceItemFormData {
	return {
		rowId: createInvoiceItemRowId(),
		type: 'OTHER',
		position,
		title: '',
		description: '',
		quantity: 1,
		unit: '',
		unitPrice: 0,
		vatRate: 20,
		total: 0,
	};
}

const invoiceItemTypeOptions: Array<{ value: WorkOrderItemType; label: string }> = [
	{ value: 'LABOR', label: 'Travaux' },
	{ value: 'MATERIAL', label: 'Materiel' },
	{ value: 'EQUIPMENT', label: 'Equipement' },
	{ value: 'TRAVEL', label: 'Deplacement' },
	{ value: 'SERVICE', label: 'Service' },
	{ value: 'OTHER', label: 'Autre' },
];

function recomputeInvoice(
	items: AddInvoiceItemFormData[],
	depositAmount: number,
	discountAmount: number,
): {
	invoiceItems: AddInvoiceItemFormData[];
	subtotal: number;
	vatAmount: number;
	total: number;
} {
	let subtotal = 0;
	let vatAmount = 0;

	const invoiceItems = items.map((item, index) => {
		const quantity = toFiniteNumber(item.quantity);
		const unitPrice = toFiniteNumber(item.unitPrice);
		const vatRate = toFiniteNumber(item.vatRate);
		const lineSubtotal = roundMoney(quantity * unitPrice);
		const lineVat = roundMoney(lineSubtotal * (vatRate / 100));
		const total = roundMoney(lineSubtotal + lineVat);

		subtotal += lineSubtotal;
		vatAmount += lineVat;

		return {
			...item,
			position: index,
			quantity,
			unitPrice,
			vatRate,
			total,
		};
	});

	subtotal = roundMoney(subtotal);
	vatAmount = roundMoney(vatAmount);
	const grossTotal = roundMoney(subtotal + vatAmount);
	const total = roundMoney(
		Math.max(grossTotal - toFiniteNumber(discountAmount) - toFiniteNumber(depositAmount), 0),
	);

	return {
		invoiceItems,
		subtotal,
		vatAmount,
		total,
	};
}

function buildImportedInvoiceItems(
	items: Array<{
		title: string;
		description?: string;
		quantity: number;
		unit?: string;
		unitPrice: number;
		vatRate: number;
		type?: WorkOrderItemType;
	}>,
): AddInvoiceItemFormData[] {
	return items.map((item, index) => ({
		rowId: createInvoiceItemRowId(),
		type: item.type ?? 'OTHER',
		position: index,
		title: item.title,
		description: item.description ?? '',
		quantity: Number(item.quantity) || 0,
		unit: item.unit ?? '',
		unitPrice: Number(item.unitPrice) || 0,
		vatRate: Number(item.vatRate) || 0,
		total: 0,
	}));
}

function mergeImportedInvoiceItems(
	existingItems: AddInvoiceItemFormData[],
	importedItems: AddInvoiceItemFormData[],
): AddInvoiceItemFormData[] {
	const baseItems =
		existingItems.length === 1 && !existingItems[0].title.trim() ? [] : existingItems;

	return [
		...baseItems,
		...importedItems.map((item, index) => ({
			...item,
			position: baseItems.length + index,
		})),
	];
}

function formatCustomerLabel(customer: CustomerOption): string {
	const person = [customer.firstName, customer.lastName]
		.filter((value): value is string => Boolean(value && value.trim()))
		.join(' ');

	return person || customer.company?.trim() || customer.id;
}

function formatWorkOrderLabel(workOrder: WorkOrderOption): string {
	return `${workOrder.reference} - ${workOrder.title}`;
}

type SortableInvoiceLineProps = {
	item: AddInvoiceItemFormData;
	index: number;
	totalItems: number;
	currency: string;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onTypeChange: (value: WorkOrderItemType) => void;
	onTitleChange: (value: string) => void;
	onQuantityChange: (value: number) => void;
	onUnitChange: (value: string) => void;
	onDescriptionChange: (value: string) => void;
	onUnitPriceChange: (value: number) => void;
	onVatRateChange: (value: number) => void;
	onDelete: () => void;
};

function SortableInvoiceLine({
	item,
	index,
	totalItems,
	currency,
	onMoveUp,
	onMoveDown,
	onTypeChange,
	onTitleChange,
	onQuantityChange,
	onUnitChange,
	onDescriptionChange,
	onUnitPriceChange,
	onVatRateChange,
	onDelete,
}: SortableInvoiceLineProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.rowId,
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
		>
			<div className="flex gap-3">
				<div className="flex flex-col gap-2">
					<button
						type="button"
						className="cursor-grab rounded border px-2 py-1 text-sm active:cursor-grabbing"
						aria-label="Glisser la ligne"
						title="Glisser la ligne"
						{...attributes}
						{...listeners}
					>
						≡
					</button>
					<button
						type="button"
						className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
						onClick={onMoveUp}
						disabled={index === 0}
					>
						↑
					</button>
					<button
						type="button"
						className="rounded border px-2 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50"
						onClick={onMoveDown}
						disabled={index === totalItems - 1}
					>
						↓
					</button>
				</div>
				<div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
					<FieldLabel label="Type">
						<select className={fieldClassName} value={item.type} onChange={(event) => onTypeChange(event.target.value as WorkOrderItemType)}>
							{invoiceItemTypeOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</FieldLabel>
					<FieldLabel label="Titre" required className="lg:col-span-2">
						<input className={fieldClassName} value={item.title} onChange={(event) => onTitleChange(event.target.value)} required />
					</FieldLabel>
					<FieldLabel label="Quantité">
						<input type="number" min="0" step="0.01" className={fieldClassName} value={item.quantity} onChange={(event) => onQuantityChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} />
					</FieldLabel>
					<FieldLabel label="Unité">
						<input className={fieldClassName} value={item.unit || ''} onChange={(event) => onUnitChange(event.target.value)} />
					</FieldLabel>
					<FieldLabel label="Description" className="sm:col-span-2 lg:col-span-4">
						<textarea className="min-h-24 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900" value={item.description} onChange={(event) => onDescriptionChange(event.target.value)} />
					</FieldLabel>
					<FieldLabel label="Prix unitaire">
						<input type="number" min="0" step="0.01" className={fieldClassName} value={item.unitPrice} onChange={(event) => onUnitPriceChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} />
					</FieldLabel>
					<FieldLabel label="TVA (%)">
						<input type="number" min="0" step="0.01" className={fieldClassName} value={item.vatRate} onChange={(event) => onVatRateChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} />
					</FieldLabel>
					<div className="flex items-end rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
						Total ligne: {item.total.toFixed(2)} {currency || 'EUR'}
					</div>
					<div className="flex items-end">
						<button
							type="button"
							className="w-full rounded-md border border-red-300 bg-red-100 px-3 py-2 text-sm text-red-700 transition hover:bg-red-200"
							onClick={onDelete}
						>
							Supprimer la ligne
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

type AddInvoiceFormProps = {
	onCreated: (invoice: CreatedInvoice) => void;
	onUpdated?: (invoice: CreatedInvoice) => void;
	initialInvoice?: CreatedInvoice;
	onChange?: (invoice: PreviewInvoice) => void;
	show: boolean;
};

const fieldClassName = 'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

type FieldLabelProps = {
	label: string;
	required?: boolean;
	children: ReactNode;
	className?: string;
};

function createDraftPreviewInvoice(form: AddInvoiceFormData): PreviewInvoice {
	return {
		id: 'draft-invoice',
		tenantId: 'draft-tenant',
		customerId: trimOrEmpty(form.customerId) || 'draft-customer',
		workOrderId: trimToUndefined(form.workOrderId),
		number: trimOrEmpty(form.number),
		issueDate: form.issueDate,
		dueDate: trimToUndefined(form.dueDate),
		workOrderReference: trimOrEmpty(form.workOrderReference),
		workOrderTitle: trimOrEmpty(form.workOrderTitle),
		tenantName: trimOrEmpty(form.tenantName),
		tenantStreet1: trimOrEmpty(form.tenantStreet1),
		tenantStreet2: trimToUndefined(form.tenantStreet2),
		tenantPostalCode: trimOrEmpty(form.tenantPostalCode),
		tenantCity: trimOrEmpty(form.tenantCity),
		tenantSiretNumber: trimOrEmpty(form.tenantSiretNumber),
		tenantVatNumber: trimOrEmpty(form.tenantVatNumber),
		tenantEmail: trimOrEmpty(form.tenantEmail),
		tenantPhoneNumber: trimOrEmpty(form.tenantPhoneNumber),
		tenantIban: trimToUndefined(form.tenantIban),
		tenantBic: trimToUndefined(form.tenantBic),
		customerFirstName: trimOrEmpty(form.customerFirstName),
		customerLastName: trimOrEmpty(form.customerLastName),
		customerStreet1: trimOrEmpty(form.customerStreet1),
		customerStreet2: trimToUndefined(form.customerStreet2),
		customerPostalCode: trimOrEmpty(form.customerPostalCode),
		customerCity: trimOrEmpty(form.customerCity),
		customerEmail: trimToUndefined(form.customerEmail),
		customerPhoneNumber: trimToUndefined(form.customerPhoneNumber),
		customerVatNumber: trimToUndefined(form.customerVatNumber),
		workOrderStartDate: trimToUndefined(form.workOrderStartDate),
		workOrderEndDate: trimToUndefined(form.workOrderEndDate),
		workOrderAddress: trimToUndefined(form.workOrderAddress),
		workOrderPostalCode: trimToUndefined(form.workOrderPostalCode),
		workOrderCity: trimToUndefined(form.workOrderCity),
		status: form.status,
		currency: trimOrEmpty(form.currency) || 'EUR',
		subtotal: toFiniteNumber(form.subtotal),
		vatAmount: toFiniteNumber(form.vatAmount),
		total: toFiniteNumber(form.total),
		paymentTerms: trimToUndefined(form.paymentTerms),
		legalMentions: trimToUndefined(form.legalMentions),
		notes: trimToUndefined(form.notes),
		depositAmount: toFiniteNumber(form.depositAmount),
		discountAmount: toFiniteNumber(form.discountAmount),
		paidAt: trimToUndefined(form.paidAt),
		paymentMethod: form.paymentMethod || undefined,
		pdfFileId: trimToUndefined(form.pdfFileId),
		pdpStatus: form.pdpStatus,
		pdpMessageId: trimToUndefined(form.pdpMessageId),
		quoteId: trimToUndefined(form.quoteId),
		quoteNumber: trimToUndefined(form.quoteNumber),
		createdAt: form.issueDate || new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		items: form.invoiceItems.map((item) => ({
			id: item.rowId,
			invoiceId: 'draft-invoice',
			position: item.position,
			title: item.title,
			description: item.description,
			quantity: item.quantity,
			unit: trimToUndefined(item.unit),
			unitPrice: item.unitPrice,
			vatRate: item.vatRate,
			total: item.total,
		})),
	};
}

function FieldLabel({ label, required = false, children, className = '' }: FieldLabelProps) {
	return (
		<label className={`flex flex-col gap-1.5 ${className}`.trim()}>
			<span className="text-sm font-medium text-zinc-700">
				{label}
				{required ? ' *' : ''}
			</span>
			{children}
		</label>
	);
}

export default function AddInvoiceForm({ onCreated, onUpdated, initialInvoice, onChange, show }: AddInvoiceFormProps) {
	const api = useApiClient();
	const [tenantDefaults, setTenantDefaults] = useState<TenantInvoiceDefaults | null>(null);
	const [form, setForm] = useState<AddInvoiceFormData>(() => {
		if (!initialInvoice) {
			return createEmptyInvoice();
		}

		const empty = createEmptyInvoice();
		return {
			...empty,
			...initialInvoice,
			number: initialInvoice.number ?? '',
			workOrderId: initialInvoice.workOrderId ?? '',
			tenantStreet2: initialInvoice.tenantStreet2 ?? '',
			tenantIban: initialInvoice.tenantIban ?? '',
			tenantBic: initialInvoice.tenantBic ?? '',
			customerStreet2: initialInvoice.customerStreet2 ?? '',
			customerEmail: initialInvoice.customerEmail ?? '',
			customerPhoneNumber: initialInvoice.customerPhoneNumber ?? '',
			customerVatNumber: initialInvoice.customerVatNumber ?? '',
			workOrderStartDate: initialInvoice.workOrderStartDate ?? '',
			workOrderEndDate: initialInvoice.workOrderEndDate ?? '',
			workOrderAddress: initialInvoice.workOrderAddress ?? '',
			workOrderPostalCode: initialInvoice.workOrderPostalCode ?? '',
			workOrderCity: initialInvoice.workOrderCity ?? '',
			paymentTerms: initialInvoice.paymentTerms ?? '',
			legalMentions: initialInvoice.legalMentions ?? '',
			notes: initialInvoice.notes ?? '',
			depositAmount: Number(initialInvoice.depositAmount ?? 0),
			discountAmount: Number(initialInvoice.discountAmount ?? 0),
			paidAt: initialInvoice.paidAt ?? '',
			pdfFileId: initialInvoice.pdfFileId ?? '',
			pdpMessageId: initialInvoice.pdpMessageId ?? '',
			quoteId: initialInvoice.quoteId ?? '',
			quoteNumber: initialInvoice.quoteNumber ?? '',
			currency: initialInvoice.currency ?? 'EUR',
			issueDate: initialInvoice.issueDate,
			dueDate: initialInvoice.dueDate ?? '',
			paymentMethod: initialInvoice.paymentMethod ?? '',
			invoiceItems: (initialInvoice.items ?? []).map((item, index) => ({
				rowId: item.id || createInvoiceItemRowId(),
				type: 'OTHER',
				position: index,
				title: item.title,
				description: item.description ?? '',
				quantity: Number(item.quantity) || 0,
				unit: item.unit ?? '',
				unitPrice: Number(item.unitPrice) || 0,
				vatRate: Number(item.vatRate) || 0,
				total: Number(item.total) || 0,
			})),
		};
	});
	const [invoiceSequenceByYear, setInvoiceSequenceByYear] = useState<Record<number, number>>({});
	const [customers, setCustomers] = useState<CustomerOption[]>([]);
	const [workOrders, setWorkOrders] = useState<WorkOrderOption[]>([]);
	const [workOrdersLoading, setWorkOrdersLoading] = useState(false);
	const [workOrdersError, setWorkOrdersError] = useState('');
	const [showWorkOrdersList, setShowWorkOrdersList] = useState(false);
	const [selectedImportWorkOrder, setSelectedImportWorkOrder] = useState<WorkOrderOption | null>(null);
	const [quotes, setQuotes] = useState<QuoteOption[]>([]);
	const [quotesLoading, setQuotesLoading] = useState(false);
	const [quotesError, setQuotesError] = useState('');
	const [showQuotesList, setShowQuotesList] = useState(false);
	const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(null);
	const [showTopQuotesList, setShowTopQuotesList] = useState(false);
	const [selectedTopQuote, setSelectedTopQuote] = useState<QuoteOption | null>(null);
	const [topQuotesError, setTopQuotesError] = useState('');
	const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
	const [catalogItemsLoading, setCatalogItemsLoading] = useState(false);
	const [catalogItemsError, setCatalogItemsError] = useState('');
	const [showCatalogItemsList, setShowCatalogItemsList] = useState(false);
	const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
	const [showTopWorkOrdersList, setShowTopWorkOrdersList] = useState(false);
	const [selectedTopWorkOrder, setSelectedTopWorkOrder] = useState<WorkOrderOption | null>(null);
	const [topWorkOrdersError, setTopWorkOrdersError] = useState('');
	const [customerMode, setCustomerMode] = useState<CustomerMode>(
		initialInvoice?.customerId ? 'existing' : 'new',
	);
	const [workOrderMode, setWorkOrderMode] = useState<WorkOrderMode>(
		initialInvoice?.workOrderId ? 'existing' : 'new',
	);
	const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
	const [showNewWorkOrderModal, setShowNewWorkOrderModal] = useState(false);
	const [showCustomerFields, setShowCustomerFields] = useState(false);
	const [showWorkOrderFields, setShowWorkOrderFields] = useState(false);
	const [showTenantFields, setShowTenantFields] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const sensors = useSensors(useSensor(PointerSensor));
	const generatedInvoiceNumber = formatInvoiceNumber(
		getInvoiceYear(form.issueDate),
		(invoiceSequenceByYear[getInvoiceYear(form.issueDate)] ?? 0) + 1,
	);
	const displayedInvoiceNumber = initialInvoice ? (form.number || initialInvoice.number || '') : generatedInvoiceNumber;

	useEffect(() => {
		onChange?.(createDraftPreviewInvoice({ ...form, number: displayedInvoiceNumber }));
	}, [displayedInvoiceNumber, form, onChange]);

	useEffect(() => {
		let cancelled = false;

		async function loadExistingInvoiceNumbers() {
			try {
				const response = await api.get('/invoices');
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const invoices = (await response.json()) as Array<{ number?: string | null }>;
				if (cancelled) {
					return;
				}

				const numbers = invoices
					.map((invoice) => invoice.number?.trim())
					.filter((value): value is string => Boolean(value));
				setInvoiceSequenceByYear(computeSequenceByYearFromNumbers(numbers));
			} catch {
				if (!cancelled) {
					setInvoiceSequenceByYear({});
				}
			}
		}

		void loadExistingInvoiceNumbers();

		return () => {
			cancelled = true;
		};
	}, [api]);

	useEffect(() => {
		let cancelled = false;

		async function loadTenantDefaults() {
			try {
				const response = await api.get('/tenants/current');
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const data: TenantInvoiceDefaults = await response.json();
				if (!cancelled) {
					setTenantDefaults(data);
					if (!initialInvoice) {
						setForm((currentForm) => ({
							...createEmptyInvoice(data),
							customerId: currentForm.customerId,
							workOrderId: currentForm.workOrderId,
							invoiceItems: currentForm.invoiceItems.length
								? currentForm.invoiceItems
								: [createEmptyInvoiceItem(0)],
						}));
					}
				}
			} catch {
				if (!cancelled) {
					setError('Erreur lors de la récupération des paramètres entreprise');
				}
			}
		}

		void loadTenantDefaults();

		return () => {
			cancelled = true;
		};
	}, [api]);

	useEffect(() => {
		let cancelled = false;

		async function loadCustomers() {
			try {
				const response = await api.get('/customers');
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const data: CustomerOption[] = await response.json();
				if (!cancelled) {
					setCustomers(data);
				}
			} catch {
				if (!cancelled) {
					setCustomers([]);
				}
			}
		}

		void loadCustomers();

		return () => {
			cancelled = true;
		};
	}, [api]);

	useEffect(() => {
		let cancelled = false;

		async function loadWorkOrders() {
			setWorkOrdersLoading(true);
			try {
				const response = await api.get('/workOrders');
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const data: WorkOrderOption[] = await response.json();
				if (!cancelled) {
					setWorkOrders(data);
					setWorkOrdersError('');
				}
			} catch {
				if (!cancelled) {
					setWorkOrders([]);
					setWorkOrdersError('Erreur lors de la récupération des chantiers');
				}
			} finally {
				if (!cancelled) {
					setWorkOrdersLoading(false);
				}
			}
		}

		void loadWorkOrders();

		return () => {
			cancelled = true;
		};
	}, [api]);

	function updateInvoiceItems(updater: (items: AddInvoiceItemFormData[]) => AddInvoiceItemFormData[]) {
		setForm((currentForm) => {
			const nextItems = updater(currentForm.invoiceItems);
			const totals = recomputeInvoice(
				nextItems,
				currentForm.depositAmount,
				currentForm.discountAmount,
			);

			return {
				...currentForm,
				...totals,
			};
		});
	}

	function updateInvoiceSummary(patch: Partial<AddInvoiceFormData>) {
		setForm((currentForm) => {
			const nextForm = {
				...currentForm,
				...patch,
			};
			const totals = recomputeInvoice(
				nextForm.invoiceItems,
				nextForm.depositAmount,
				nextForm.discountAmount,
			);

			return {
				...nextForm,
				...totals,
			};
		});
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;

		if (!over || active.id === over.id) {
			return;
		}

		updateInvoiceItems((items) => {
			const oldIndex = items.findIndex((item) => item.rowId === active.id);
			const newIndex = items.findIndex((item) => item.rowId === over.id);

			if (oldIndex === -1 || newIndex === -1) {
				return items;
			}

			return arrayMove(items, oldIndex, newIndex);
		});
	}

	async function openQuoteSelector() {
		setQuotesError('');
		setShowQuotesList(true);
		setShowCatalogItemsList(false);
		setShowWorkOrdersList(false);
		setSelectedQuote(null);
		setQuotesLoading(true);

		try {
			const response = await api.get('/quotes');
			if (!response.ok) {
				throw new Error('Erreur');
			}

			const data: QuoteOption[] = await response.json();
			setQuotes(data);
		} catch {
			setQuotes([]);
			setQuotesError('Erreur lors de la récupération des devis');
		} finally {
			setQuotesLoading(false);
		}
	}

	async function openTopQuoteSelector() {
		setTopQuotesError('');
		setShowTopQuotesList(true);
		setShowTopWorkOrdersList(false);
		setSelectedTopQuote(null);
		setQuotesLoading(true);

		try {
			const response = await api.get('/quotes');
			if (!response.ok) {
				throw new Error('Erreur');
			}

			const data: QuoteOption[] = await response.json();
			setQuotes(data);
		} catch {
			setQuotes([]);
			setTopQuotesError('Erreur lors de la récupération des devis');
		} finally {
			setQuotesLoading(false);
		}
	}

	function buildQuoteInvoiceItems(quote: QuoteOption): AddInvoiceItemFormData[] {
		return buildImportedInvoiceItems(
			quote.items.map((quoteItem) => ({
				title: quoteItem.title,
				description: quoteItem.description ?? '',
				quantity: Number(quoteItem.quantity) || 0,
				unit: quoteItem.unit ?? '',
				unitPrice: Number(quoteItem.unitPrice) || 0,
				vatRate: Number(quoteItem.vatRate) || 0,
				type: 'type' in quoteItem ? (quoteItem.type as WorkOrderItemType | undefined) : 'OTHER',
			})),
		);
	}

	function replaceFormFromQuote(quote: QuoteOption) {
		const nextItems = quote.items.length
			? buildQuoteInvoiceItems(quote)
			: [createEmptyInvoiceItem(0)];
		const baseForm = createEmptyInvoice(tenantDefaults || undefined);
		const totals = recomputeInvoice(nextItems, quote.depositAmount ?? 0, baseForm.discountAmount);

		setForm({
			...baseForm,
			customerId: quote.customerId,
			workOrderId: quote.workOrderId ?? '',
			quoteId: quote.id,
			quoteNumber: quote.number,
			tenantName: quote.tenantName ?? quote.tenantLegalName ?? tenantDefaults?.name ?? '',
			tenantStreet1: quote.tenantStreet1 ?? tenantDefaults?.address?.street1 ?? '',
			tenantStreet2: quote.tenantStreet2 ?? '',
			tenantPostalCode: quote.tenantPostalCode ?? tenantDefaults?.address?.postalCode ?? '',
			tenantCity: quote.tenantCity ?? tenantDefaults?.address?.city ?? '',
			tenantSiretNumber: quote.tenantSiretNumber ?? quote.tenantSirenNumber ?? tenantDefaults?.siretNumber ?? '',
			tenantVatNumber: quote.tenantVatNumber ?? tenantDefaults?.vatNumber ?? '',
			tenantEmail: quote.tenantEmail ?? tenantDefaults?.email ?? '',
			tenantPhoneNumber: quote.tenantPhoneNumber ?? tenantDefaults?.phoneNumber ?? '',
			tenantIban: quote.tenantIban ?? '',
			tenantBic: quote.tenantBic ?? '',
			customerFirstName: quote.customerFirstName ?? quote.customerName ?? '',
			customerLastName: quote.customerLastName ?? '',
			customerStreet1: quote.customerStreet1 ?? '',
			customerStreet2: quote.customerStreet2 ?? '',
			customerPostalCode: quote.customerPostalCode,
			customerCity: quote.customerCity,
			customerEmail: quote.customerEmail ?? '',
			customerPhoneNumber: quote.customerPhoneNumber ?? '',
			customerVatNumber: quote.customerVatNumber ?? '',
			workOrderReference: quote.workOrderReference ?? '',
			workOrderTitle: quote.workOrderTitle ?? '',
			workOrderStartDate: quote.workOrderStartDate ?? '',
			workOrderEndDate: quote.workOrderEndDate ?? '',
			workOrderAddress: quote.workOrderAddress ?? '',
			workOrderPostalCode: quote.workOrderPostalCode ?? '',
			workOrderCity: quote.workOrderCity ?? '',
			currency: quote.currency || baseForm.currency,
			paymentTerms: quote.paymentTerms ?? '',
			legalMentions: quote.legalMentions ?? '',
			notes: quote.notes ?? '',
			depositAmount: toFiniteNumber(quote.depositAmount ?? 0),
			discountAmount: 0,
			...totals,
		});
	}

	function appendQuoteLinesToForm(quote: QuoteOption) {
		const importedQuoteItems = buildQuoteInvoiceItems(quote);

		setForm((currentForm) => {
			const invoiceItems = mergeImportedInvoiceItems(currentForm.invoiceItems, importedQuoteItems);
			const totals = recomputeInvoice(
				invoiceItems,
				currentForm.depositAmount,
				currentForm.discountAmount,
			);

			return {
				...currentForm,
				quoteId: quote.id,
				quoteNumber: quote.number,
				...totals,
			};
		});
	}

	function chooseSelectedQuote() {
		if (!selectedQuote) {
			return;
		}

		if (!selectedQuote.items.length) {
			setQuotesError('Le devis sélectionné ne contient aucune ligne.');
			return;
		}

		appendQuoteLinesToForm(selectedQuote);

		setShowQuotesList(false);
		setSelectedQuote(null);
		setQuotesError('');
		setSuccess('Formulaire rempli depuis le devis et lignes importées.');
	}

	function chooseTopSelectedQuote() {
		if (!selectedTopQuote) {
			return;
		}

		replaceFormFromQuote(selectedTopQuote);
		setShowTopQuotesList(false);
		setSelectedTopQuote(null);
		setTopQuotesError('');
		setSuccess('Formulaire rempli depuis le devis et lignes importées.');
	}

	function openWorkOrderLineSelector() {
		setWorkOrdersError('');
		setShowWorkOrdersList(true);
		setShowCatalogItemsList(false);
		setShowQuotesList(false);
		setSelectedImportWorkOrder(null);
	}

	function openTopWorkOrderSelector() {
		setTopWorkOrdersError('');
		setShowTopWorkOrdersList(true);
		setShowTopQuotesList(false);
		setSelectedTopWorkOrder(null);
	}

	function buildWorkOrderInvoiceItems(workOrder: WorkOrderOption): AddInvoiceItemFormData[] {
		return buildImportedInvoiceItems(
			workOrder.items.map((workOrderItem) => ({
				title: workOrderItem.title,
				description: workOrderItem.description ?? '',
				quantity: Number(workOrderItem.quantity) || 0,
				unit: workOrderItem.unit ?? '',
				unitPrice: Number(workOrderItem.unitPrice) || 0,
				vatRate: Number(workOrderItem.vatRate) || 0,
				type: workOrderItem.type,
			})),
		);
	}

	function replaceFormFromWorkOrder(workOrder: WorkOrderOption) {
		const nextItems = workOrder.items.length
			? buildWorkOrderInvoiceItems(workOrder)
			: [createEmptyInvoiceItem(0)];
		const baseForm = createEmptyInvoice(tenantDefaults || undefined);
		const totals = recomputeInvoice(nextItems, baseForm.depositAmount, baseForm.discountAmount);

		setForm({
			...baseForm,
			workOrderId: workOrder.id,
			workOrderReference: workOrder.reference ?? '',
			workOrderTitle: workOrder.title ?? '',
			workOrderStartDate: trimToUndefined(workOrder.startDate) ?? '',
			workOrderEndDate: trimToUndefined(workOrder.endDate) ?? '',
			workOrderAddress: workOrder.address?.street1 ?? '',
			workOrderPostalCode: workOrder.address?.postalCode ?? '',
			workOrderCity: workOrder.address?.city ?? '',
			...totals,
		});
	}

	function appendWorkOrderLinesToForm(workOrder: WorkOrderOption) {
		const importedWorkOrderItems = buildWorkOrderInvoiceItems(workOrder);

		setForm((currentForm) => {
			const invoiceItems = mergeImportedInvoiceItems(currentForm.invoiceItems, importedWorkOrderItems);
			const totals = recomputeInvoice(
				invoiceItems,
				currentForm.depositAmount,
				currentForm.discountAmount,
			);

			return {
				...currentForm,
				...totals,
			};
		});
	}

	function chooseSelectedWorkOrderLines() {
		if (!selectedImportWorkOrder) {
			return;
		}

		if (!selectedImportWorkOrder.items.length) {
			setWorkOrdersError('Le chantier sélectionné ne contient aucune étape.');
			return;
		}

		appendWorkOrderLinesToForm(selectedImportWorkOrder);

		setShowWorkOrdersList(false);
		setSelectedImportWorkOrder(null);
		setWorkOrdersError('');
		setSuccess('Lignes importées depuis le chantier.');
	}

	function chooseTopSelectedWorkOrder() {
		if (!selectedTopWorkOrder) {
			return;
		}

		replaceFormFromWorkOrder(selectedTopWorkOrder);
		setShowTopWorkOrdersList(false);
		setSelectedTopWorkOrder(null);
		setTopWorkOrdersError('');
		setSuccess('Formulaire rempli depuis le chantier et lignes importées.');
	}

	async function openCatalogItemSelector() {
		setCatalogItemsError('');
		setShowCatalogItemsList(true);
		setShowWorkOrdersList(false);
		setShowQuotesList(false);
		setSelectedCatalogItem(null);
		setCatalogItemsLoading(true);

		try {
			const response = await api.get('/catalogitems');
			if (!response.ok) {
				throw new Error('Erreur');
			}

			const data: CatalogItem[] = await response.json();
			setCatalogItems(data);
		} catch {
			setCatalogItems([]);
			setCatalogItemsError('Erreur lors de la récupération des articles catalogue');
		} finally {
			setCatalogItemsLoading(false);
		}
	}

	function chooseSelectedCatalogItem() {
		if (!selectedCatalogItem) {
			return;
		}

		updateInvoiceItems((items) =>
			mergeImportedInvoiceItems(
				items,
				buildImportedInvoiceItems([
					{
						title: selectedCatalogItem.title,
						description: selectedCatalogItem.description ?? '',
						quantity: Number(selectedCatalogItem.defaultQuantity) || 1,
						unit: selectedCatalogItem.unit ?? '',
						unitPrice: Number(selectedCatalogItem.unitPrice) || 0,
						vatRate: Number(selectedCatalogItem.vatRate) || 0,
						type: selectedCatalogItem.type,
					},
				]),
			),
		);

		setShowCatalogItemsList(false);
		setSelectedCatalogItem(null);
		setCatalogItemsError('');
		setSuccess('Ligne importée depuis le catalogue.');
	}

	function handleCreatedCustomer(customer: Customer) {
		setCustomers((currentOptions) => {
			if (currentOptions.some((option) => option.id === customer.id)) {
				return currentOptions;
			}

			return [
				{
					id: customer.id,
					firstName: customer.firstName,
					lastName: customer.lastName,
					company: customer.company,
					email: customer.email,
					phone: customer.phone,
					mobile: customer.mobile,
					vatNumber: customer.vatNumber,
					address: customer.address,
				},
				...currentOptions,
			];
		});

		setForm((currentForm) => ({
			...currentForm,
			customerId: customer.id,
			customerFirstName: customer.firstName ?? customer.company ?? '',
			customerLastName: customer.lastName ?? '',
			customerStreet1: customer.address?.street1 ?? '',
			customerStreet2: '',
			customerPostalCode: customer.address?.postalCode ?? '',
			customerCity: customer.address?.city ?? '',
			customerEmail: customer.email ?? '',
			customerPhoneNumber: customer.phone ?? customer.mobile ?? '',
			customerVatNumber: customer.vatNumber ?? '',
		}));

		setCustomerMode('existing');
		setShowNewCustomerModal(false);
		setError('');
		setSuccess('Client créé et associé à la facture.');
	}

	function handleCreatedWorkOrder(workOrder: {
		id: string;
		reference: string;
		title: string;
		startDate?: string;
		endDate?: string;
		address?: {
			street1?: string;
			postalCode?: string;
			city?: string;
		};
	}) {
		setWorkOrders((currentOptions) => {
			if (currentOptions.some((option) => option.id === workOrder.id)) {
				return currentOptions;
			}

			return [workOrder as WorkOrderOption, ...currentOptions];
		});

		setForm((currentForm) => ({
			...currentForm,
			workOrderId: workOrder.id,
			workOrderReference: workOrder.reference ?? '',
			workOrderTitle: workOrder.title ?? '',
			workOrderStartDate: trimToUndefined(workOrder.startDate) ?? '',
			workOrderEndDate: trimToUndefined(workOrder.endDate) ?? '',
			workOrderAddress: workOrder.address?.street1 ?? '',
			workOrderPostalCode: workOrder.address?.postalCode ?? '',
			workOrderCity: workOrder.address?.city ?? '',
		}));

		setWorkOrderMode('existing');
		setShowNewWorkOrderModal(false);
		setError('');
		setSuccess('Chantier créé et associé à la facture.');
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError('');
		setSuccess('');

		if (!displayedInvoiceNumber.trim()) {
			setError('Le numéro de facture est obligatoire.');
			return;
		}

		if (!form.customerId.trim()) {
			setError('Le client est obligatoire.');
			return;
		}

		if (!form.invoiceItems.length || form.invoiceItems.some((item) => !item.title.trim())) {
			setError('Chaque ligne de la facture doit avoir un titre.');
			return;
		}

		if (!form.customerStreet1.trim() || !form.customerPostalCode.trim() || !form.customerCity.trim()) {
			setError('Les informations d\'adresse client sont incomplètes.');
			return;
		}

		if (!form.tenantName.trim() || !form.tenantStreet1.trim() || !form.tenantPostalCode.trim() || !form.tenantCity.trim()) {
			setError('Les informations entreprise sont incomplètes.');
			return;
		}

		const payload: CreateInvoiceDto = {
			customerId: form.customerId.trim(),
			number: displayedInvoiceNumber.trim(),
			workOrderId: trimToUndefined(form.workOrderId),
			issueDate: form.issueDate,
			dueDate: trimToUndefined(form.dueDate),
			workOrderReference: form.workOrderReference.trim(),
			workOrderTitle: form.workOrderTitle.trim(),
			tenantName: form.tenantName.trim(),
			tenantStreet1: form.tenantStreet1.trim(),
			tenantStreet2: trimToUndefined(form.tenantStreet2),
			tenantPostalCode: form.tenantPostalCode.trim(),
			tenantCity: form.tenantCity.trim(),
			tenantSiretNumber: form.tenantSiretNumber.trim(),
			tenantVatNumber: form.tenantVatNumber.trim(),
			tenantEmail: form.tenantEmail.trim(),
			tenantPhoneNumber: form.tenantPhoneNumber.trim(),
			tenantIban: trimToUndefined(form.tenantIban),
			tenantBic: trimToUndefined(form.tenantBic),
			customerFirstName: form.customerFirstName.trim(),
			customerLastName: form.customerLastName.trim(),
			customerStreet1: form.customerStreet1.trim(),
			customerStreet2: trimToUndefined(form.customerStreet2),
			customerPostalCode: form.customerPostalCode.trim(),
			customerCity: form.customerCity.trim(),
			customerEmail: trimToUndefined(form.customerEmail),
			customerPhoneNumber: trimToUndefined(form.customerPhoneNumber),
			customerVatNumber: trimToUndefined(form.customerVatNumber),
			tenantSirenNumber: form.tenantSiretNumber.trim(),
			tenantCountryCode: 'FR',
			customerName: [form.customerFirstName, form.customerLastName].filter(Boolean).join(' ').trim() || form.customerId.trim(),
			customerCountryCode: 'FR',
			workOrderStartDate: trimToUndefined(form.workOrderStartDate),
			workOrderEndDate: trimToUndefined(form.workOrderEndDate),
			workOrderAddress: trimToUndefined(form.workOrderAddress),
			workOrderPostalCode: trimToUndefined(form.workOrderPostalCode),
			workOrderCity: trimToUndefined(form.workOrderCity),
			status: form.status,
			currency: form.currency.trim() || 'EUR',
			subtotal: form.subtotal,
			vatAmount: form.vatAmount,
			total: form.total,
			operationCategory: 'SERVICES',
			kind: 'STANDARD',
			paymentTerms: trimToUndefined(form.paymentTerms),
			legalMentions: trimToUndefined(form.legalMentions),
			notes: trimToUndefined(form.notes),
			depositAmount: toFiniteNumber(form.depositAmount),
			discountAmount: toFiniteNumber(form.discountAmount),
			paidAt: trimToUndefined(form.paidAt),
			pdfFileId: trimToUndefined(form.pdfFileId),
			pdpStatus: form.pdpStatus,
			pdpMessageId: trimToUndefined(form.pdpMessageId),
			quoteId: trimToUndefined(form.quoteId),
			quoteNumber: trimToUndefined(form.quoteNumber),
			invoiceItems: form.invoiceItems.map((item) => ({
				type: item.type,
				position: item.position,
				lineIdentifier: String(item.position + 1),
				title: item.title.trim(),
				description: item.description.trim(),
				quantity: item.quantity,
				unit: trimToUndefined(item.unit),
				unitCode: 'C62',
				unitPrice: item.unitPrice,
				vatRate: item.vatRate,
								total: item.total,
				subtotal: item.total,
				vatCategory: 'STANDARD',
			})),
		};

		try {
			const response = initialInvoice
				? await api.put(`/invoices/${initialInvoice.id}`, payload)
				: await api.post('/invoices', payload);
			if (!response.ok) {
				throw new Error('Erreur');
			}

			const data: CreatedInvoice = await response.json();
			const parsedNumber = parseInvoiceNumber(data.number);
			if (parsedNumber) {
				setInvoiceSequenceByYear((currentMap) => ({
					...currentMap,
					[parsedNumber.year]: Math.max(currentMap[parsedNumber.year] ?? 0, parsedNumber.sequence),
				}));
			}
			if (initialInvoice) {
				onUpdated?.(data);
				setSuccess('Facture modifiée avec succès.');
			} else {
				onCreated(data);
				setForm(createEmptyInvoice(tenantDefaults || undefined));
				setCustomerMode('new');
				setWorkOrderMode('new');
				setSuccess('Facture créée avec succès.');
			}
		} catch {
			setError('Erreur lors de la création de la facture.');
		}
	}

	return (
		<>
		<form
			onSubmit={handleSubmit}
			onKeyDown={(event) => {
				if (event.key === 'Enter') {
					event.preventDefault();
				}
			}}
			className={`mb-8 space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm ${!show ? 'hidden' : ''}`}
		>
			<h3 className="text-lg font-semibold text-zinc-900">
				{initialInvoice ? 'Modifier la facture' : 'Créer une facture'}
			</h3>
			<div className="flex flex-wrap gap-2">
				<button
					type="button"
					className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
					onClick={() => {
						void openTopQuoteSelector();
					}}
				>
					Remplir à partir d&apos;un devis existant
				</button>
				<button
					type="button"
					className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
					onClick={() => {
						openTopWorkOrderSelector();
					}}
				>
					Remplir à partir d&apos;un chantier existant
				</button>
			</div>

			{topQuotesError && <div className="rounded bg-red-100 p-3 text-red-700">{topQuotesError}</div>}
			{topWorkOrdersError && <div className="rounded bg-red-100 p-3 text-red-700">{topWorkOrdersError}</div>}

			{showTopQuotesList && (
				<div className="rounded-md border border-zinc-200 bg-white p-4">
					<div className="mb-3 flex items-center gap-2">
						<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un devis</h4>
						<button type="button" className="ml-auto rounded border px-3 py-2" onClick={() => setShowTopQuotesList(false)}>
							Fermer la liste
						</button>
					</div>
					{quotesLoading ? (
						<p>Chargement des devis...</p>
					) : (
						<QuotesList
							quotes={quotes}
							onDelete={null}
							handleSelectedQuote={(quote) => {
								setSelectedTopQuote(quote);
								setShowTopQuotesList(false);
								setTopQuotesError('');
							}}
						/>
					)}
				</div>
			)}

			{!showTopQuotesList && selectedTopQuote && (
				<div className="rounded-md border border-zinc-200 bg-white p-4">
					<h4 className="mb-3 text-lg font-semibold text-zinc-900">Devis sélectionné</h4>
					<div className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-700">
						<p><strong>Numéro:</strong> {selectedTopQuote.number}</p>
						<p><strong>Chantier:</strong> {selectedTopQuote.workOrderTitle || '-'}</p>
						<p><strong>Nombre de lignes:</strong> {selectedTopQuote.items.length || 0}</p>
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<button type="button" onClick={chooseTopSelectedQuote} className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400">
							Choisir ce devis
						</button>
						<button type="button" onClick={() => setShowTopQuotesList(true)} className="rounded-md border-2 bg-zinc-200 p-2 hover:bg-zinc-300 active:bg-zinc-400">
							Choisir un autre devis
						</button>
					</div>
				</div>
			)}

			{showTopWorkOrdersList && (
				<div className="rounded-md border border-zinc-200 bg-white p-4">
					<div className="mb-3 flex items-center gap-2">
						<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un chantier</h4>
						<button type="button" className="ml-auto rounded border px-3 py-2" onClick={() => setShowTopWorkOrdersList(false)}>
							Fermer la liste
						</button>
					</div>
					{workOrdersLoading ? (
						<p>Chargement des chantiers...</p>
					) : (
						<WorkOrdersList
							workOrders={workOrders}
							onDelete={null}
							handleSelectedWorkOrder={(workOrder) => {
								setSelectedTopWorkOrder(workOrder as WorkOrderOption);
								setShowTopWorkOrdersList(false);
								setTopWorkOrdersError('');
							}}
						/>
					)}
				</div>
			)}

			{!showTopWorkOrdersList && selectedTopWorkOrder && (
				<div className="rounded-md border border-zinc-200 bg-white p-4">
					<h4 className="mb-3 text-lg font-semibold text-zinc-900">Chantier sélectionné</h4>
					<div className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-700">
						<p><strong>Titre:</strong> {selectedTopWorkOrder.title}</p>
						<p><strong>Référence:</strong> {selectedTopWorkOrder.reference || '-'}</p>
						<p><strong>Nombre d&apos;étapes:</strong> {selectedTopWorkOrder.items.length || 0}</p>
					</div>
					<div className="mt-4 flex flex-wrap gap-3">
						<button type="button" onClick={chooseTopSelectedWorkOrder} className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400">
							Choisir ce chantier
						</button>
						<button type="button" onClick={() => setShowTopWorkOrdersList(true)} className="rounded-md border-2 bg-zinc-200 p-2 hover:bg-zinc-300 active:bg-zinc-400">
							Choisir un autre chantier
						</button>
					</div>
				</div>
			)}

			{error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}
			{success && <div className="rounded bg-green-100 p-3 text-green-700">{success}</div>}

			<section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Client</h4>
				</div>
				<div className="mb-4 flex flex-wrap gap-2">
					<button
						type="button"
						className={`rounded-md border px-3 py-2 text-sm transition ${customerMode === 'existing' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
						onClick={() => setCustomerMode('existing')}
					>
						Remplir depuis un client existant
					</button>
					<button
						type="button"
						className={`rounded-md border px-3 py-2 text-sm transition ${customerMode === 'new' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
						onClick={() => setCustomerMode('new')}
					>
						Nouveau client
					</button>
				</div>

				{customerMode === 'existing' && (
					<div className="mb-4">
						<FieldLabel label="Client existant">
							<select
								className={fieldClassName}
								value={form.customerId}
								onChange={(event) => {
									const nextCustomerId = event.target.value;
									const nextCustomer = customers.find((customer) => customer.id === nextCustomerId);

									if (!nextCustomer) {
										setForm((currentForm) => ({
											...currentForm,
											customerId: nextCustomerId,
											customerFirstName: '',
											customerLastName: '',
											customerStreet1: '',
											customerStreet2: '',
											customerPostalCode: '',
											customerCity: '',
											customerEmail: '',
											customerPhoneNumber: '',
											customerVatNumber: '',
										}));
										return;
									}

									setForm((currentForm) => ({
										...currentForm,
										customerId: nextCustomer.id,
										customerFirstName: nextCustomer.firstName ?? nextCustomer.company ?? '',
										customerLastName: nextCustomer.lastName ?? '',
										customerStreet1: nextCustomer.address?.street1 ?? '',
										customerStreet2: nextCustomer.address?.street2 ?? '',
										customerPostalCode: nextCustomer.address?.postalCode ?? '',
										customerCity: nextCustomer.address?.city ?? '',
										customerEmail: nextCustomer.email ?? '',
										customerPhoneNumber: nextCustomer.phone ?? nextCustomer.mobile ?? '',
										customerVatNumber: nextCustomer.vatNumber ?? '',
									}));
									setError('');
								}}
							>
								<option value="">-- Sélectionner un client --</option>
								{customers.map((customer) => (
									<option key={customer.id} value={customer.id}>
										{formatCustomerLabel(customer)}
									</option>
								))}
							</select>
						</FieldLabel>
					</div>
				)}

				{customerMode === 'new' && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-3">
						<p className="mb-3 text-sm text-zinc-600">Créez un nouveau client puis associez-le automatiquement à la facture.</p>
						<button
							type="button"
							className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100"
							onClick={() => setShowNewCustomerModal(true)}
						>
							Créer un nouveau client
						</button>
					</div>
				)}
					<button
						type="button"
						className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
						onClick={() => setShowCustomerFields((current) => !current)}
					>
						{showCustomerFields ? 'Fermer' : 'Modifier'}
					</button>
				{showCustomerFields && (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<FieldLabel label="Prénom client" required>
						<input className={fieldClassName} value={form.customerFirstName} onChange={(event) => setForm({ ...form, customerFirstName: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Nom client" required>
						<input className={fieldClassName} value={form.customerLastName} onChange={(event) => setForm({ ...form, customerLastName: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Email client">
						<input className={fieldClassName} type="email" value={form.customerEmail} onChange={(event) => setForm({ ...form, customerEmail: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Téléphone client">
						<input className={fieldClassName} value={form.customerPhoneNumber} onChange={(event) => setForm({ ...form, customerPhoneNumber: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="TVA client">
						<input className={fieldClassName} value={form.customerVatNumber} onChange={(event) => setForm({ ...form, customerVatNumber: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Adresse client" required>
						<input className={fieldClassName} value={form.customerStreet1} onChange={(event) => setForm({ ...form, customerStreet1: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Complément d'adresse client">
						<input className={fieldClassName} value={form.customerStreet2} onChange={(event) => setForm({ ...form, customerStreet2: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Code postal client" required>
						<input className={fieldClassName} value={form.customerPostalCode} onChange={(event) => setForm({ ...form, customerPostalCode: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Ville client" required>
						<input className={fieldClassName} value={form.customerCity} onChange={(event) => setForm({ ...form, customerCity: event.target.value })} required />
					</FieldLabel>
					</div>
				)}
			</section>

			<section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Chantier</h4>
				</div>
				<div className="mb-4 flex flex-wrap gap-2">
					<button
						type="button"
						className={`rounded-md border px-3 py-2 text-sm transition ${workOrderMode === 'existing' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
						onClick={() => setWorkOrderMode('existing')}
					>
						Remplir depuis un chantier existant
					</button>
					<button
						type="button"
						className={`rounded-md border px-3 py-2 text-sm transition ${workOrderMode === 'new' ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'}`}
						onClick={() => setWorkOrderMode('new')}
					>
						Nouveau chantier
					</button>
				</div>

				{workOrderMode === 'existing' && (
					<div className="mb-4">
						<FieldLabel label="Chantier existant">
							<select
								className={fieldClassName}
								value={form.workOrderId}
								onChange={(event) => {
									const nextWorkOrderId = event.target.value;
									const nextWorkOrder = workOrders.find((workOrder) => workOrder.id === nextWorkOrderId);

									if (!nextWorkOrder) {
										setForm((currentForm) => ({
											...currentForm,
											workOrderId: nextWorkOrderId,
											workOrderReference: '',
											workOrderTitle: '',
											workOrderStartDate: '',
											workOrderEndDate: '',
											workOrderAddress: '',
											workOrderPostalCode: '',
											workOrderCity: '',
										}));
										return;
									}

									setForm((currentForm) => ({
										...currentForm,
										workOrderId: nextWorkOrder.id,
										workOrderReference: nextWorkOrder.reference ?? '',
										workOrderTitle: nextWorkOrder.title ?? '',
										workOrderStartDate: trimToUndefined(nextWorkOrder.startDate) ?? '',
										workOrderEndDate: trimToUndefined(nextWorkOrder.endDate) ?? '',
										workOrderAddress: nextWorkOrder.address?.street1 ?? '',
										workOrderPostalCode: nextWorkOrder.address?.postalCode ?? '',
										workOrderCity: nextWorkOrder.address?.city ?? '',
									}));
									setError('');
								}}
							>
								<option value="">-- Sélectionner un chantier --</option>
								{workOrders.map((workOrder) => (
									<option key={workOrder.id} value={workOrder.id}>
										{formatWorkOrderLabel(workOrder)}
									</option>
								))}
							</select>
						</FieldLabel>
					</div>
				)}

				{workOrderMode === 'new' && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-3">
						<p className="mb-3 text-sm text-zinc-600">Créez un nouveau chantier puis associez-le automatiquement à la facture.</p>
						<button
							type="button"
							className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-800 hover:bg-blue-100"
							onClick={() => setShowNewWorkOrderModal(true)}
						>
							Créer un nouveau chantier
						</button>
					</div>
				)}
					<button
						type="button"
						className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
						onClick={() => setShowWorkOrderFields((current) => !current)}
					>
						{showWorkOrderFields ? 'Fermer' : 'Modifier'}
					</button>
				{showWorkOrderFields && (
					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<FieldLabel label="Référence chantier" required>
						<input className={fieldClassName} value={form.workOrderReference} onChange={(event) => setForm({ ...form, workOrderReference: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Titre chantier" required>
						<input className={fieldClassName} value={form.workOrderTitle} onChange={(event) => setForm({ ...form, workOrderTitle: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Début chantier">
						<input type="datetime-local" className={fieldClassName} value={form.workOrderStartDate} onChange={(event) => setForm({ ...form, workOrderStartDate: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Fin chantier">
						<input type="datetime-local" className={fieldClassName} value={form.workOrderEndDate} onChange={(event) => setForm({ ...form, workOrderEndDate: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Adresse chantier">
						<input className={fieldClassName} value={form.workOrderAddress} onChange={(event) => setForm({ ...form, workOrderAddress: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Code postal chantier">
						<input className={fieldClassName} value={form.workOrderPostalCode} onChange={(event) => setForm({ ...form, workOrderPostalCode: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Ville chantier">
						<input className={fieldClassName} value={form.workOrderCity} onChange={(event) => setForm({ ...form, workOrderCity: event.target.value })} />
					</FieldLabel>
					</div>
				)}
			</section>

			<section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Lignes de facture</h4>
					<div className="flex flex-wrap gap-2">
						<button
							type="button"
							className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
							onClick={() =>
								updateInvoiceItems((items) => [...items, createEmptyInvoiceItem(items.length)])
							}
						>
							Ajouter une ligne
						</button>
						<button
							type="button"
							className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
							onClick={() => {
								void openQuoteSelector();
							}}
						>
							Ajouter des lignes à partir d&apos;un devis
						</button>
						<button
							type="button"
							className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
							onClick={openWorkOrderLineSelector}
						>
							Ajouter des lignes à partir d&apos;un chantier
						</button>
						<button
							type="button"
							className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
							onClick={() => {
								void openCatalogItemSelector();
							}}
						>
							Ajouter une ligne à partir du catalogue
						</button>
					</div>
				</div>

				{quotesError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{quotesError}</div>}
				{workOrdersError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{workOrdersError}</div>}
				{catalogItemsError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{catalogItemsError}</div>}

				{showQuotesList && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
						<div className="mb-3 flex items-center gap-2">
							<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un devis</h4>
							<button type="button" className="ml-auto rounded border px-3 py-2" onClick={() => setShowQuotesList(false)}>
								Fermer la liste
							</button>
						</div>
						{quotesLoading ? (
							<p>Chargement des devis...</p>
						) : (
							<QuotesList
								quotes={quotes}
								onDelete={null}
								handleSelectedQuote={(quote) => {
									setSelectedQuote(quote);
									setShowQuotesList(false);
									setQuotesError('');
								}}
							/>
						)}
					</div>
				)}

				{!showQuotesList && selectedQuote && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
						<h4 className="mb-3 text-lg font-semibold text-zinc-900">Devis sélectionné</h4>
						<div className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-700">
							<p><strong>Numéro:</strong> {selectedQuote.number}</p>
							<p><strong>Chantier:</strong> {selectedQuote.workOrderTitle || '-'}</p>
							<p><strong>Nombre de lignes:</strong> {selectedQuote.items.length || 0}</p>
						</div>
						<div className="mt-4 flex flex-wrap gap-3">
							<button type="button" onClick={chooseSelectedQuote} className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400">
								Choisir ce devis
							</button>
							<button type="button" onClick={() => setShowQuotesList(true)} className="rounded-md border-2 bg-zinc-200 p-2 hover:bg-zinc-300 active:bg-zinc-400">
								Choisir un autre devis
							</button>
						</div>
					</div>
				)}

				{showWorkOrdersList && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
						<div className="mb-3 flex items-center gap-2">
							<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un chantier</h4>
							<button type="button" className="ml-auto rounded border px-3 py-2" onClick={() => setShowWorkOrdersList(false)}>
								Fermer la liste
							</button>
						</div>
						{workOrdersLoading ? (
							<p>Chargement des chantiers...</p>
						) : (
							<WorkOrdersList
								workOrders={workOrders}
								onDelete={null}
								handleSelectedWorkOrder={(workOrder) => {
									setSelectedImportWorkOrder(workOrder as WorkOrderOption);
									setShowWorkOrdersList(false);
									setWorkOrdersError('');
								}}
							/>
						)}
					</div>
				)}

				{!showWorkOrdersList && selectedImportWorkOrder && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
						<h4 className="mb-3 text-lg font-semibold text-zinc-900">Chantier sélectionné</h4>
						<div className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-700">
							<p><strong>Titre:</strong> {selectedImportWorkOrder.title}</p>
							<p><strong>Référence:</strong> {selectedImportWorkOrder.reference || '-'}</p>
							<p><strong>Nombre d&apos;étapes:</strong> {selectedImportWorkOrder.items.length || 0}</p>
						</div>
						<div className="mt-4 flex flex-wrap gap-3">
							<button type="button" onClick={chooseSelectedWorkOrderLines} className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400">
								Choisir ce chantier
							</button>
							<button type="button" onClick={() => setShowWorkOrdersList(true)} className="rounded-md border-2 bg-zinc-200 p-2 hover:bg-zinc-300 active:bg-zinc-400">
								Choisir un autre chantier
							</button>
						</div>
					</div>
				)}

				{showCatalogItemsList && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
						<div className="mb-3 flex items-center gap-2">
							<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un article catalogue</h4>
							<button type="button" className="ml-auto rounded border px-3 py-2" onClick={() => setShowCatalogItemsList(false)}>
								Fermer la liste
							</button>
						</div>
						{catalogItemsLoading ? (
							<p>Chargement des articles catalogue...</p>
						) : (
							<CatalogItemList
								catalogItems={catalogItems}
								onDelete={null}
								handleSelectedCatalogItem={(catalogItem) => {
									setSelectedCatalogItem(catalogItem);
									setShowCatalogItemsList(false);
									setCatalogItemsError('');
								}}
							/>
						)}
					</div>
				)}

				{!showCatalogItemsList && selectedCatalogItem && (
					<div className="mb-4 rounded-md border border-zinc-200 bg-white p-4">
						<h4 className="mb-3 text-lg font-semibold text-zinc-900">Article catalogue sélectionné</h4>
						<div className="rounded-md border bg-zinc-50 p-3 text-sm text-zinc-700">
							<p><strong>Titre:</strong> {selectedCatalogItem.title}</p>
							<p><strong>Type:</strong> {selectedCatalogItem.type}</p>
							<p><strong>Description:</strong> {selectedCatalogItem.description || '-'}</p>
						</div>
						<div className="mt-4 flex flex-wrap gap-3">
							<button type="button" onClick={chooseSelectedCatalogItem} className="rounded-md border-2 bg-green-200 p-2 hover:bg-green-300 active:bg-green-400">
								Choisir cet article
							</button>
							<button type="button" onClick={() => setShowCatalogItemsList(true)} className="rounded-md border-2 bg-zinc-200 p-2 hover:bg-zinc-300 active:bg-zinc-400">
								Choisir un autre article
							</button>
						</div>
					</div>
				)}

				<div className="space-y-4">
					<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
						<SortableContext items={form.invoiceItems.map((item) => item.rowId)} strategy={verticalListSortingStrategy}>
							{form.invoiceItems.map((item, index) => (
								<SortableInvoiceLine
									key={item.rowId}
									item={item}
									index={index}
									totalItems={form.invoiceItems.length}
									currency={form.currency}
									onMoveUp={() =>
										updateInvoiceItems((items) => {
											if (index === 0) {
												return items;
											}

											const nextItems = [...items];
											[nextItems[index - 1], nextItems[index]] = [nextItems[index], nextItems[index - 1]];
											return nextItems;
										})
									}
									onMoveDown={() =>
										updateInvoiceItems((items) => {
											if (index === items.length - 1) {
												return items;
											}

											const nextItems = [...items];
											[nextItems[index], nextItems[index + 1]] = [nextItems[index + 1], nextItems[index]];
											return nextItems;
										})
									}
									onTypeChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, type: value } : currentItem))}
									onTitleChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, title: value } : currentItem))}
									onQuantityChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, quantity: value } : currentItem))}
									onUnitChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, unit: value } : currentItem))}
									onDescriptionChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, description: value } : currentItem))}
									onUnitPriceChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, unitPrice: value } : currentItem))}
									onVatRateChange={(value) => updateInvoiceItems((items) => items.map((currentItem) => currentItem.rowId === item.rowId ? { ...currentItem, vatRate: value } : currentItem))}
									onDelete={() => updateInvoiceItems((items) => items.length === 1 ? [createEmptyInvoiceItem(0)] : items.filter((currentItem) => currentItem.rowId !== item.rowId))}
								/>
							))}
						</SortableContext>
					</DndContext>
				</div>
			</section>

			<section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
				<div className="flex items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Entreprise</h4>
					<button
						type="button"
						className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
						onClick={() => setShowTenantFields((current) => !current)}
					>
						{showTenantFields ? 'Fermer' : 'Modifier'}
					</button>
				</div>

				{showTenantFields && (
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<FieldLabel label="Entreprise" required>
						<input className={fieldClassName} value={form.tenantName} onChange={(event) => setForm({ ...form, tenantName: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Adresse entreprise" required>
						<input className={fieldClassName} value={form.tenantStreet1} onChange={(event) => setForm({ ...form, tenantStreet1: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Complément d'adresse entreprise">
						<input className={fieldClassName} value={form.tenantStreet2} onChange={(event) => setForm({ ...form, tenantStreet2: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Code postal entreprise" required>
						<input className={fieldClassName} value={form.tenantPostalCode} onChange={(event) => setForm({ ...form, tenantPostalCode: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Ville entreprise" required>
						<input className={fieldClassName} value={form.tenantCity} onChange={(event) => setForm({ ...form, tenantCity: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Email entreprise" required>
						<input className={fieldClassName} type="email" value={form.tenantEmail} onChange={(event) => setForm({ ...form, tenantEmail: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Téléphone entreprise" required>
						<input className={fieldClassName} value={form.tenantPhoneNumber} onChange={(event) => setForm({ ...form, tenantPhoneNumber: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="SIRET" required>
						<input className={fieldClassName} value={form.tenantSiretNumber} onChange={(event) => setForm({ ...form, tenantSiretNumber: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="TVA entreprise" required>
						<input className={fieldClassName} value={form.tenantVatNumber} onChange={(event) => setForm({ ...form, tenantVatNumber: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="IBAN">
						<input className={fieldClassName} value={form.tenantIban} onChange={(event) => setForm({ ...form, tenantIban: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="BIC">
						<input className={fieldClassName} value={form.tenantBic} onChange={(event) => setForm({ ...form, tenantBic: event.target.value })} />
					</FieldLabel>
				</div>
				)}
			</section>

			<section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
				<h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Infos facture</h4>
				<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
					<FieldLabel label="Numéro facture" required>
						<input className={`${fieldClassName} bg-zinc-100`} value={displayedInvoiceNumber} readOnly required />
					</FieldLabel>
					<FieldLabel label="Date d'émission" required>
						<input type="datetime-local" className={fieldClassName} value={form.issueDate} onChange={(event) => setForm({ ...form, issueDate: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Date d'échéance">
						<input type="datetime-local" className={fieldClassName} value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Statut">
						<select className={fieldClassName} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as InvoiceStatus })}>
							<option value="DRAFT">Brouillon</option>
							<option value="SENT">Envoyée</option>
							<option value="PAID">Payée</option>
							<option value="CANCELLED">Annulée</option>
						</select>
					</FieldLabel>
					<FieldLabel label="Devise" required>
						<input className={fieldClassName} value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} required />
					</FieldLabel>
					<FieldLabel label="Sous-total HT" required>
						<input type="number" min="0" step="0.01" className={`${fieldClassName} bg-zinc-100`} value={form.subtotal} readOnly required />
					</FieldLabel>
					<FieldLabel label="TVA" required>
						<input type="number" min="0" step="0.01" className={`${fieldClassName} bg-zinc-100`} value={form.vatAmount} readOnly required />
					</FieldLabel>
					<FieldLabel label="Total TTC" required>
						<input type="number" min="0" step="0.01" className={`${fieldClassName} bg-zinc-100`} value={form.total} readOnly required />
					</FieldLabel>
					<FieldLabel label="Conditions de paiement">
						<input className={fieldClassName} value={form.paymentTerms} onChange={(event) => setForm({ ...form, paymentTerms: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Mentions légales">
						<input className={fieldClassName} value={form.legalMentions} onChange={(event) => setForm({ ...form, legalMentions: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Notes">
						<input className={fieldClassName} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Acompte">
						<input type="number" min="0" step="0.01" className={fieldClassName} value={form.depositAmount ?? 0} onChange={(event) => updateInvoiceSummary({ depositAmount: toFiniteNumber(event.target.valueAsNumber) })} />
					</FieldLabel>
					<FieldLabel label="Remise">
						<input type="number" min="0" step="0.01" className={fieldClassName} value={form.discountAmount ?? 0} onChange={(event) => updateInvoiceSummary({ discountAmount: toFiniteNumber(event.target.valueAsNumber) })} />
					</FieldLabel>
					<FieldLabel label="Date de paiement">
						<input type="datetime-local" className={fieldClassName} value={form.paidAt} onChange={(event) => setForm({ ...form, paidAt: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Méthode de paiement">
						<select className={fieldClassName} value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod | '' })}>
							<option value="">-- Méthode de paiement --</option>
							<option value="BANK_TRANSFER">Virement</option>
							<option value="CARD">Carte</option>
							<option value="CASH">Espèces</option>
							<option value="CHECK">Chèque</option>
							<option value="OTHER">Autre</option>
						</select>
					</FieldLabel>
					<FieldLabel label="PDF File ID">
						<input className={fieldClassName} value={form.pdfFileId} onChange={(event) => setForm({ ...form, pdfFileId: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Statut PDP">
						<select className={fieldClassName} value={form.pdpStatus} onChange={(event) => setForm({ ...form, pdpStatus: event.target.value as InvoicePdpStatus })}>
							<option value="NOT_SENT">Non envoyé</option>
							<option value="SENT">Envoyé</option>
							<option value="ACCEPTED">Accepté</option>
							<option value="REJECTED">Rejeté</option>
						</select>
					</FieldLabel>
					<FieldLabel label="PDP Message ID">
						<input className={fieldClassName} value={form.pdpMessageId} onChange={(event) => setForm({ ...form, pdpMessageId: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Quote ID">
						<input className={fieldClassName} value={form.quoteId} onChange={(event) => setForm({ ...form, quoteId: event.target.value })} />
					</FieldLabel>
					<FieldLabel label="Quote Number">
						<input className={fieldClassName} value={form.quoteNumber} onChange={(event) => setForm({ ...form, quoteNumber: event.target.value })} />
					</FieldLabel>
				</div>
			</section>

			<button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
				{initialInvoice ? 'Modifier' : 'Créer la facture'}
			</button>
		</form>

		{showNewCustomerModal && (
			<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
				<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-lg font-semibold text-zinc-900">Nouveau client</h4>
						<button
							type="button"
							className="rounded border px-3 py-2 text-sm"
							onClick={() => setShowNewCustomerModal(false)}
						>
							Fermer
						</button>
					</div>
					<AddCustomerForm
						show={true}
						onCreated={handleCreatedCustomer}
					/>
				</div>
			</div>
		)}

		{showNewWorkOrderModal && (
			<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
				<div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl">
					<div className="mb-3 flex items-center justify-between">
						<h4 className="text-lg font-semibold text-zinc-900">Nouveau chantier</h4>
						<button
							type="button"
							className="rounded border px-3 py-2 text-sm"
							onClick={() => setShowNewWorkOrderModal(false)}
						>
							Fermer
						</button>
					</div>
					<AddWorkOrderForm
						show={true}
						onCreated={handleCreatedWorkOrder}
					/>
				</div>
			</div>
		)}
		</>
	);
}
