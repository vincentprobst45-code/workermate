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
	InvoiceKind,
	InvoiceStatus,
	PaymentMethod,
	LineItemType as WorkOrderItemType,
	InvoiceAdjustmentType,
	VatCategory,
} from '@prisma/client';
import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import CatalogItemList, { type CatalogItem } from './CatalogItemList';
import AddCustomerForm, { type Customer } from './AddCustomerForm';
import AddWorkOrderForm from './AddWorkOrderForm';
import AddInvoiceAdjustmentForm, { type InvoiceAdjustmentFormData } from './AddInvoiceAdjustmentForm';
import AddInvoiceItemAdjustmentForm, { type InvoiceItemAdjustmentFormData } from './AddInvoiceItemAdjustmentForm';
import CustomersList, { type Customer as CustomerRecord } from './CustomersList';
import InvoicesList, { type Invoice as CreatedInvoice } from './InvoicesList';
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
	vatCategory: VatCategory;
	total: number;
	adjustments: InvoiceItemAdjustmentFormData[];
}

interface InvoiceVatBreakdownFormData {
	taxableAmount: number;
	vatAmount: number;
	vatCategory: VatCategory;
	vatRate?: number;
}

interface InvoicePaymentFormData {
	rowId: string;
	amount: string;
	paidAt: string;
	method: PaymentMethod | '';
	reference: string;
	notes: string;
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
	vatBreakdowns: InvoiceVatBreakdownFormData[];
	total: number;
	allowanceTotal: number;
	chargeTotal: number;
	taxExclusiveAmount: number;
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
	payments: InvoicePaymentFormData[];
	adjustments: InvoiceAdjustmentFormData[];
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
	adjustments: InvoiceItemAdjustmentFormData[];
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
	vatBreakdowns?: InvoiceVatBreakdownFormData[];
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
	adjustments?: InvoiceAdjustmentFormData[];
	kind?: string;
	correctedInvoiceId?: string;
	referencedInvoiceId?: string;
	operationCategory: 'GOODS' | 'SERVICES' | 'MIXED';
	tenantSirenNumber: string;
	tenantCountryCode: string;
	customerName: string;
	customerCountryCode: string;
	accountingCurrency?: string;
	internalNotes?: string;
	payments?: Array<{
		amount: number;
		paidAt: string;
		method?: PaymentMethod;
		reference?: string;
		notes?: string;
	}>;
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

function toDatetimeLocalValue(value?: string | null): string {
	if (!value) {
		return '';
	}

	const parsed = new Date(value);
	return Number.isNaN(parsed.getTime()) ? value : toDatetimeLocal(parsed);
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
		vatBreakdowns: [],
		vatRate: 20,
		allowanceTotal: 0,
		chargeTotal: 0,
		taxExclusiveAmount: 0,
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
		payments: [],
		adjustments: [],
	};
}

function toFiniteNumber(value: unknown): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : 0;
}

function roundMoney(value: number): number {
	return Math.round(value * 100) / 100;
}

function calculateInvoiceItemSubtotal(item: Pick<AddInvoiceItemFormData, 'quantity' | 'unitPrice' | 'adjustments'>): number {
	const baseAmount = roundMoney(toFiniteNumber(item.quantity) * toFiniteNumber(item.unitPrice));
	const adjustmentTotal = item.adjustments.reduce((sum, adjustment) => {
		const amount = adjustment.percentage == null
			? toFiniteNumber(adjustment.amount)
			: roundMoney(baseAmount * toFiniteNumber(adjustment.percentage) / 100);
		return sum + (adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? -amount : amount);
	}, 0);

	return roundMoney(baseAmount + adjustmentTotal);
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
		vatCategory: VatCategory.STANDARD,
		total: 0,
		adjustments: [],
	};
}

function createEmptyInvoicePayment(): InvoicePaymentFormData {
	return {
		rowId: crypto.randomUUID(),
		amount: '',
		paidAt: toDatetimeLocal(new Date()),
		method: '',
		reference: '',
		notes: '',
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
	adjustments: InvoiceAdjustmentFormData[] = [],
): {
	invoiceItems: AddInvoiceItemFormData[];
	subtotal: number;
	vatAmount: number;
	vatBreakdowns?: InvoiceVatBreakdownFormData[];
	total: number;
	allowanceTotal: number;
	chargeTotal: number;
	taxExclusiveAmount: number;
} {
	let subtotal = 0;
	let vatAmount = 0;

	const invoiceItems = items.map((item, index) => {
		const quantity = toFiniteNumber(item.quantity);
		const unitPrice = toFiniteNumber(item.unitPrice);
		const vatRate = toFiniteNumber(item.vatRate);
		const baseAmount = roundMoney(quantity * unitPrice);
		const lineSubtotal = calculateInvoiceItemSubtotal(item);
		const lineVat = item.vatCategory === VatCategory.STANDARD
			? roundMoney(lineSubtotal * (vatRate / 100))
			: 0;
		const total = roundMoney(lineSubtotal + lineVat);

		subtotal += lineSubtotal;
		vatAmount += lineVat;

		return {
			...item,
			position: index,
			quantity,
			unitPrice,
			vatRate,
			vatCategory: item.vatCategory,
			total,
			adjustments: item.adjustments.map((adjustment, adjustmentIndex) => ({
				...adjustment,
				position: adjustmentIndex,
				baseAmount,
				amount: adjustment.percentage == null
					? toFiniteNumber(adjustment.amount)
					: roundMoney(baseAmount * toFiniteNumber(adjustment.percentage) / 100),
			})),
		};
	});

	subtotal = roundMoney(subtotal);
	vatAmount = roundMoney(vatAmount);
	const breakdowns = new Map<string, InvoiceVatBreakdownFormData>();
	for (const item of invoiceItems) {
		const effectiveRate = item.vatCategory === VatCategory.STANDARD ? toFiniteNumber(item.vatRate) : undefined;
		const key = `${item.vatCategory}:${effectiveRate ?? ''}`;
		const current = breakdowns.get(key);
		const lineSubtotal = calculateInvoiceItemSubtotal(item);
		if (current) {
			current.taxableAmount = roundMoney(current.taxableAmount + lineSubtotal);
		} else {
			breakdowns.set(key, {
				taxableAmount: lineSubtotal,
				vatAmount: 0,
				vatCategory: item.vatCategory,
				vatRate: effectiveRate,
			});
		}
	}
	const allowanceTotal = roundMoney(adjustments.filter((adjustment) => adjustment.type === InvoiceAdjustmentType.ALLOWANCE).reduce((sum, adjustment) => sum + toFiniteNumber(adjustment.amount), 0));
	const chargeTotal = roundMoney(adjustments.filter((adjustment) => adjustment.type === InvoiceAdjustmentType.CHARGE).reduce((sum, adjustment) => sum + toFiniteNumber(adjustment.amount), 0));
	const taxExclusiveAmount = roundMoney(subtotal - allowanceTotal + chargeTotal);
	for (const adjustment of adjustments) {
		const eligible = Array.from(breakdowns.values()).filter(
			(breakdown) => breakdown.vatCategory === adjustment.vatCategory,
		);
		const eligibleTotal = eligible.reduce((sum, breakdown) => sum + breakdown.taxableAmount, 0);
		if (eligibleTotal === 0) continue;
		const signedAmount = adjustment.type === InvoiceAdjustmentType.ALLOWANCE
			? -toFiniteNumber(adjustment.amount)
			: toFiniteNumber(adjustment.amount);
		for (const breakdown of eligible) {
			breakdown.taxableAmount = roundMoney(
				breakdown.taxableAmount + signedAmount * breakdown.taxableAmount / eligibleTotal,
			);
		}
	}
	const vatBreakdowns = Array.from(breakdowns.values()).map((breakdown) => ({
		...breakdown,
		vatAmount: breakdown.vatCategory === VatCategory.STANDARD
			? roundMoney(breakdown.taxableAmount * toFiniteNumber(breakdown.vatRate) / 100)
			: 0,
	}));
	vatAmount = roundMoney(vatBreakdowns.reduce((sum, breakdown) => sum + breakdown.vatAmount, 0));
	const grossTotal = roundMoney(taxExclusiveAmount + vatAmount);
	const total = roundMoney(
		Math.max(grossTotal - toFiniteNumber(depositAmount), 0),
	);

	return {
		invoiceItems,
		subtotal,
		vatAmount,
				vatBreakdowns,
		total,
		allowanceTotal,
		chargeTotal,
		taxExclusiveAmount,
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
		vatCategory?: VatCategory;
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
		vatCategory: item.vatCategory ?? VatCategory.STANDARD,
		total: 0,
		adjustments: [],
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
	onAddAdjustment: () => void;
	onEditAdjustment: (adjustment: InvoiceItemAdjustmentFormData) => void;
	onDeleteAdjustment: (adjustmentIndex: number) => void;
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
	onAddAdjustment,
	onEditAdjustment,
	onDeleteAdjustment,
	onDelete,
}: SortableInvoiceLineProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: item.rowId,
	});
	const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	};

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`border-b border-zinc-200 bg-white py-2 ${isDragging ? 'opacity-60 shadow-lg' : ''}`}
		>
			<div className="flex items-start gap-2">
				<div className="flex w-7 shrink-0 flex-col items-center gap-1 pt-0.5">
					<button
						type="button"
						className="rounded px-1.5 py-0.5 text-sm text-zinc-500 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={onDelete}
						aria-label="Supprimer la ligne"
						title="Supprimer la ligne"
					>
						X
					</button>
					<button
						type="button"
						className="rounded px-1.5 py-0.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={onMoveUp}
						disabled={index === 0}
						aria-label="Monter la ligne"
					>
						↑
					</button>
					<button
						type="button"
						className="cursor-grab rounded px-1.5 py-0.5 text-sm text-zinc-500 hover:bg-zinc-100 active:cursor-grabbing"
						aria-label="Glisser la ligne"
						title="Glisser la ligne"
						{...attributes}
						{...listeners}
					>
						≡
					</button>
					<button
						type="button"
						className="rounded px-1.5 py-0.5 text-sm text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={onMoveDown}
						disabled={index === totalItems - 1}
						aria-label="Descendre la ligne"
					>
						↓
					</button>
				</div>
				<div className="min-w-0 flex-1">
					<div className="grid grid-cols-[minmax(0,3fr)_minmax(4rem,0.8fr)_minmax(4rem,0.9fr)_minmax(5rem,1fr)_minmax(4.5rem,0.8fr)_minmax(5.5rem,1fr)] items-end gap-2">
						<FieldLabel label="Libellé" required compact>
							<input className={`${fieldClassName} px-2 py-1.5 text-xs`} value={item.title} onChange={(event) => onTitleChange(event.target.value)} required />
						</FieldLabel>
						<FieldLabel label="Qté" compact>
							<input type="number" min="0" step="0.01" className={`${fieldClassName} px-2 py-1.5 text-xs`} value={item.quantity} onChange={(event) => onQuantityChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} />
						</FieldLabel>
						<FieldLabel label="Unité" compact>
							<input className={`${fieldClassName} px-2 py-1.5 text-xs`} value={item.unit || ''} onChange={(event) => onUnitChange(event.target.value)} />
						</FieldLabel>
						<FieldLabel label="PU HT" compact>
							<input type="number" min="0" step="0.01" className={`${fieldClassName} px-2 py-1.5 text-xs`} value={item.unitPrice} onChange={(event) => onUnitPriceChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} />
						</FieldLabel>
						<FieldLabel label="TVA" compact>
							<input type="number" min="0" step="0.01" className={`${fieldClassName} px-2 py-1.5 text-xs`} value={item.vatRate} onChange={(event) => onVatRateChange(Number.isNaN(event.target.valueAsNumber) ? 0 : event.target.valueAsNumber)} />
						</FieldLabel>
						<div className="min-w-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1.5 text-xs text-zinc-700">
							<span className="block truncate" title={`${calculateInvoiceItemSubtotal(item).toFixed(2)} ${currency || 'EUR'}`}>{calculateInvoiceItemSubtotal(item).toFixed(2)} {currency || 'EUR'}</span>
						</div>
					</div>
					<div className="mt-1 flex items-center gap-2">
						<p className="min-w-0 flex-1 truncate text-xs text-zinc-500">{item.description || 'Aucune description'}</p>
						<button type="button" className="shrink-0 text-xs text-zinc-500 underline hover:text-zinc-900" onClick={() => setShowAdvancedOptions((current) => !current)}>
							••• Options avancées
						</button>
					</div>
					{showAdvancedOptions && (
						<div className="mt-2 grid grid-cols-1 gap-2 rounded-md bg-zinc-50 p-2 sm:grid-cols-2">
							<FieldLabel label="Type" compact>
								<select className={`${fieldClassName} px-2 py-1.5 text-xs`} value={item.type} onChange={(event) => onTypeChange(event.target.value as WorkOrderItemType)}>
									{invoiceItemTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
								</select>
							</FieldLabel>
							<FieldLabel label="Description détaillée" compact>
								<textarea className="min-h-12 rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-xs text-zinc-900" value={item.description} onChange={(event) => onDescriptionChange(event.target.value)} />
							</FieldLabel>
							<div className="sm:col-span-2">
								<button type="button" className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900" onClick={onAddAdjustment}>
									+ Ajouter une remise ou des frais de ligne
								</button>
								{item.adjustments.length > 0 && <div className="mt-2 space-y-1">
									{item.adjustments.map((adjustment, adjustmentIndex) => (
										<div key={adjustment.id ?? `${item.rowId}-adjustment-${adjustmentIndex}`} className="flex items-center justify-between gap-2 text-xs text-zinc-700">
											<span>{adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? 'Remise' : 'Frais / charge'}: {adjustment.percentage == null ? `${adjustment.amount.toFixed(2)} ${currency}` : `${adjustment.percentage}% (${adjustment.amount.toFixed(2)} ${currency})`}{adjustment.reason ? ` - ${adjustment.reason}` : ''}</span>
											<span className="flex shrink-0 gap-2"><button type="button" className="underline" onClick={() => onEditAdjustment(adjustment)}>Modifier</button><button type="button" className="text-red-700 underline" onClick={() => onDeleteAdjustment(adjustmentIndex)}>Supprimer</button></span>
										</div>
									))}
								</div>}
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

type AddInvoiceFormProps = {
	onCreated: (invoice: CreatedInvoice) => void;
	onUpdated?: (invoice: CreatedInvoice) => void;
	initialInvoice?: CreatedInvoice;
	invoiceKind: InvoiceKind;
	onChange?: (invoice: PreviewInvoice) => void;
	show: boolean;
};

const fieldClassName = 'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

const invoiceKindLabels: Record<InvoiceKind, string> = {
	[InvoiceKind.STANDARD]: 'standard',
	[InvoiceKind.DEPOSIT]: 'd’acompte',
	[InvoiceKind.PROGRESS]: 'de situation',
	[InvoiceKind.BALANCE]: 'de solde',
	[InvoiceKind.CORRECTIVE]: 'rectificative',
	[InvoiceKind.CREDIT_NOTE]: 'd’avoir',
};

type FieldLabelProps = {
	label: string;
	required?: boolean;
	children: ReactNode;
	className?: string;
	compact?: boolean;
};

function createDraftPreviewInvoice(
	form: AddInvoiceFormData,
	sourceInvoice?: CreatedInvoice | null,
	kind?: InvoiceKind,
	sourceSnapshot?: { number?: string; issueDate?: string },
): PreviewInvoice {
	const sourceNumber = sourceInvoice?.number ?? sourceSnapshot?.number;
	const sourceIssueDate = sourceInvoice?.issueDate ?? sourceSnapshot?.issueDate;

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
		lineNetTotal: toFiniteNumber(form.subtotal),
		allowanceTotal: toFiniteNumber(form.allowanceTotal),
		chargeTotal: toFiniteNumber(form.chargeTotal),
		taxExclusiveAmount: toFiniteNumber(form.taxExclusiveAmount),
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
		kind,
		correctedInvoiceNumber: kind === InvoiceKind.CORRECTIVE ? sourceNumber : undefined,
		correctedInvoiceIssueDate: kind === InvoiceKind.CORRECTIVE ? sourceIssueDate : undefined,
		references: kind === InvoiceKind.CREDIT_NOTE && sourceNumber && sourceIssueDate ? [{
			referencedInvoiceNumber: sourceNumber,
			referencedInvoiceIssueDate: sourceIssueDate,
		}] : undefined,
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
			vatCategory: item.vatCategory,
			total: item.total,
			subtotal: calculateInvoiceItemSubtotal(item),
			adjustments: item.adjustments.map((adjustment) => ({
				id: adjustment.id,
				position: adjustment.position,
				type: adjustment.type,
				amount: adjustment.amount,
				baseAmount: adjustment.baseAmount,
				percentage: adjustment.percentage,
				reason: adjustment.reason,
				reasonCode: adjustment.reasonCode,
			})),
		})),
		adjustments: form.adjustments.map((adjustment, position) => ({
			id: adjustment.id ?? `draft-adjustment-${position}`,
			position,
			type: adjustment.type,
			amount: adjustment.amount,
			reason: adjustment.reason,
			vatCategory: adjustment.vatCategory,
			vatRate: adjustment.vatRate,
		})),
	};
}


function FieldLabel({ label, required = false, children, className = '', compact = false }: FieldLabelProps) {
	return (
		<label className={`flex flex-col ${compact ? 'gap-0.5' : 'gap-1.5'} ${className}`.trim()}>
			<span className={`${compact ? 'text-[11px]' : 'text-sm'} font-medium text-zinc-700`}>
				{label}
				{required ? ' *' : ''}
			</span>
			{children}
		</label>
	);
}

export default function AddInvoiceForm({ onCreated, onUpdated, initialInvoice, invoiceKind, onChange, show }: AddInvoiceFormProps) {
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
			notes: Array.isArray(initialInvoice.notes)
				? initialInvoice.notes.map((note) => note.text).join(' ')
				: initialInvoice.notes ?? '',
			depositAmount: Number(initialInvoice.depositAmount ?? 0),
			discountAmount: Number(initialInvoice.discountAmount ?? 0),
			paidAt: initialInvoice.paidAt ?? '',
			pdfFileId: initialInvoice.pdfFileId ?? '',
			pdpMessageId: initialInvoice.pdpMessageId ?? '',
			quoteId: initialInvoice.quoteId ?? '',
			quoteNumber: initialInvoice.quoteNumber ?? '',
			currency: initialInvoice.currency ?? 'EUR',
			issueDate: toDatetimeLocalValue(initialInvoice.issueDate),
			dueDate: toDatetimeLocalValue(initialInvoice.dueDate),
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
				vatCategory: item.vatCategory ?? VatCategory.STANDARD,
				total: roundMoney(
					Number(item.subtotal ?? Number(item.quantity) * Number(item.unitPrice)) *
					(1 + (item.vatCategory === VatCategory.STANDARD ? Number(item.vatRate || 0) : 0) / 100),
				),
				adjustments: (item.adjustments ?? []).map((adjustment) => ({
					id: adjustment.id,
					position: adjustment.position,
					type: adjustment.type,
					amount: Number(adjustment.amount) || 0,
					baseAmount: Number(adjustment.baseAmount ?? Number(item.quantity) * Number(item.unitPrice)),
					percentage: adjustment.percentage == null ? undefined : Number(adjustment.percentage),
					reason: adjustment.reason ?? '',
					reasonCode: adjustment.reasonCode ?? '',
				})),
			})),
			payments: (initialInvoice.payments ?? []).map((payment) => ({
				rowId: payment.id,
				amount: String(payment.amount ?? ''),
				paidAt: toDatetimeLocalValue(payment.paidAt),
				method: payment.method ?? '',
				reference: payment.reference ?? '',
				notes: payment.notes ?? '',
			})),
			adjustments: (initialInvoice.adjustments ?? []).map((adjustment) => ({
				id: adjustment.id,
				position: adjustment.position,
				type: adjustment.type,
				amount: Number(adjustment.amount) || 0,
				baseAmount: adjustment.baseAmount === undefined ? undefined : Number(adjustment.baseAmount),
				percentage: adjustment.percentage == null ? undefined : Number(adjustment.percentage),
				vatCategory: adjustment.vatCategory as VatCategory,
				vatRate: adjustment.vatRate === undefined ? undefined : Number(adjustment.vatRate),
				reason: adjustment.reason ?? '',
				reasonCode: adjustment.reasonCode ?? '',
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
	const [showAssociatedQuoteModal, setShowAssociatedQuoteModal] = useState(false);
	const [associatedQuote, setAssociatedQuote] = useState<QuoteOption | null>(null);
	const [showTopQuotesList, setShowTopQuotesList] = useState(false);
	const [selectedTopQuote, setSelectedTopQuote] = useState<QuoteOption | null>(null);
	const [topQuotesError, setTopQuotesError] = useState('');
	const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
	const [catalogItemsLoading, setCatalogItemsLoading] = useState(false);
	const [catalogItemsError, setCatalogItemsError] = useState('');
	const [showCatalogItemsList, setShowCatalogItemsList] = useState(false);
	const [showAddLineMenu, setShowAddLineMenu] = useState(false);
	const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
	const [showTopWorkOrdersList, setShowTopWorkOrdersList] = useState(false);
	const [selectedTopWorkOrder, setSelectedTopWorkOrder] = useState<WorkOrderOption | null>(null);
	const [topWorkOrdersError, setTopWorkOrdersError] = useState('');
	const [, setCustomerMode] = useState<CustomerMode>(
		initialInvoice?.customerId ? 'existing' : 'new',
	);
	const [, setWorkOrderMode] = useState<WorkOrderMode>(
		initialInvoice?.workOrderId ? 'existing' : 'new',
	);
	const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
	const [showCustomerSelector, setShowCustomerSelector] = useState(false);
	const [showNewWorkOrderModal, setShowNewWorkOrderModal] = useState(false);
	const [showWorkOrderSelector, setShowWorkOrderSelector] = useState(false);
	const [showCustomerFields, setShowCustomerFields] = useState(false);
	const [showWorkOrderFields, setShowWorkOrderFields] = useState(false);
	const [showTenantFields, setShowTenantFields] = useState(false);
	const [selectedSourceInvoice, setSelectedSourceInvoice] = useState<CreatedInvoice | null>(null);
	const [showSourceInvoiceModal, setShowSourceInvoiceModal] = useState(false);
	const [showInvoiceAdjustmentModal, setShowInvoiceAdjustmentModal] = useState(false);
	const [editingInvoiceAdjustment, setEditingInvoiceAdjustment] = useState<InvoiceAdjustmentFormData | null>(null);
	const [lineAdjustmentTarget, setLineAdjustmentTarget] = useState<{ rowId: string; adjustment?: InvoiceItemAdjustmentFormData } | null>(null);
	const [sourceInvoices, setSourceInvoices] = useState<CreatedInvoice[]>([]);
	const [sourceInvoicesLoading, setSourceInvoicesLoading] = useState(false);
	const [sourceInvoicesError, setSourceInvoicesError] = useState('');
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const sensors = useSensors(useSensor(PointerSensor));
	const generatedInvoiceNumber = formatInvoiceNumber(
		getInvoiceYear(form.issueDate),
		(invoiceSequenceByYear[getInvoiceYear(form.issueDate)] ?? 0) + 1,
	);
	const displayedInvoiceNumber = initialInvoice ? (form.number || initialInvoice.number || '') : generatedInvoiceNumber;
	const sourceInvoiceButtonLabel = invoiceKind === InvoiceKind.CORRECTIVE
		? 'Choisir la facture à corriger'
		: 'Choisir la facture pour laquelle créer un avoir';
	const customerListItems: CustomerRecord[] = customers.map((customer) => ({
		id: customer.id,
		tenantId: 'current-tenant',
		firstName: customer.firstName ?? '',
		lastName: customer.lastName,
		company: customer.company,
		email: customer.email,
		phone: customer.phone,
		mobile: customer.mobile,
		vatNumber: customer.vatNumber,
		address: customer.address,
		createdAt: '',
	}));
	const selectedCustomer = customers.find((customer) => customer.id === form.customerId);
	const customerSummaryName = selectedCustomer ? formatCustomerLabel(selectedCustomer) : `${form.customerFirstName} ${form.customerLastName}`.trim();
	const customerSummaryContact = selectedCustomer?.email || selectedCustomer?.phone || selectedCustomer?.mobile || form.customerEmail || form.customerPhoneNumber || '-';
	const customerSummaryLocation = selectedCustomer
		? [selectedCustomer.address?.postalCode, selectedCustomer.address?.city].filter(Boolean).join(' ')
		: [form.customerPostalCode, form.customerCity].filter(Boolean).join(' ');
	const hasCustomerSummary = Boolean(customerSummaryName || customerSummaryContact !== '-' || customerSummaryLocation);

	useEffect(() => {
		onChange?.(createDraftPreviewInvoice(
		{ ...form, number: displayedInvoiceNumber },
		selectedSourceInvoice,
		invoiceKind,
		initialInvoice?.kind === invoiceKind
			? {
				number: invoiceKind === InvoiceKind.CORRECTIVE
					? initialInvoice.correctedInvoiceNumber
					: initialInvoice.references?.[0]?.referencedInvoiceNumber,
				issueDate: invoiceKind === InvoiceKind.CORRECTIVE
					? initialInvoice.correctedInvoiceIssueDate
					: initialInvoice.references?.[0]?.referencedInvoiceIssueDate,
			}
			: undefined,
	));
	}, [displayedInvoiceNumber, form, initialInvoice, invoiceKind, onChange, selectedSourceInvoice]);

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
				currentForm.adjustments,
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
				nextForm.adjustments,
			);

			return {
				...nextForm,
				...totals,
			};
		});
	}

	function updateInvoiceAdjustments(adjustments: InvoiceAdjustmentFormData[]) {
		setForm((currentForm) => ({
			...currentForm,
			...recomputeInvoice(currentForm.invoiceItems, currentForm.depositAmount, currentForm.discountAmount, adjustments),
			adjustments: adjustments.map((adjustment, position) => ({ ...adjustment, position })),
		}));
	}

	function openInvoiceAdjustmentForm(adjustment?: InvoiceAdjustmentFormData) {
		setEditingInvoiceAdjustment(adjustment ?? null);
		setShowInvoiceAdjustmentModal(true);
	}

	function updateLineAdjustments(rowId: string, adjustments: InvoiceItemAdjustmentFormData[]) {
		updateInvoiceItems((items) => items.map((item) => item.rowId === rowId ? { ...item, adjustments } : item));
	}

	function openLineAdjustmentForm(rowId: string, adjustment?: InvoiceItemAdjustmentFormData) {
		setLineAdjustmentTarget({ rowId, adjustment });
	}

	async function openSourceInvoiceSelector() {
		setShowSourceInvoiceModal(true);
		setSourceInvoicesLoading(true);
		setSourceInvoicesError('');

		try {
			const response = await api.get('/invoices');
			if (!response.ok) {
				throw new Error('Erreur');
			}

			setSourceInvoices((await response.json()) as CreatedInvoice[]);
		} catch {
			setSourceInvoices([]);
			setSourceInvoicesError('Erreur lors de la récupération des factures.');
		} finally {
			setSourceInvoicesLoading(false);
		}
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

	async function openAssociatedQuoteSelector() {
		setQuotesError('');
		setShowAssociatedQuoteModal(true);
		setShowQuotesList(false);
		setShowTopQuotesList(false);
		setQuotesLoading(true);

		try {
			const response = await api.get('/quotes');
			if (!response.ok) {
				throw new Error('Erreur');
			}

			setQuotes((await response.json()) as QuoteOption[]);
		} catch {
			setQuotes([]);
			setQuotesError('Erreur lors de la récupération des devis');
		} finally {
			setQuotesLoading(false);
		}
	}

	function handleAssociatedQuoteSelection(quote: QuoteOption) {
		setAssociatedQuote(quote);
		setForm((currentForm) => ({
			...currentForm,
			quoteId: quote.id,
			quoteNumber: quote.number,
		}));
		setShowAssociatedQuoteModal(false);
		setQuotesError('');
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
				vatCategory: quoteItem.vatCategory,
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
		setCustomerMode(quote.customerId ? 'existing' : 'new');
		setWorkOrderMode(quote.workOrderId ? 'existing' : 'new');

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
			tenantEmail: trimToUndefined(quote.tenantEmail) ?? tenantDefaults?.email ?? '',
			tenantPhoneNumber: trimToUndefined(quote.tenantPhoneNumber) ?? tenantDefaults?.phoneNumber ?? '',
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
				vatCategory: workOrderItem.vatCategory,
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
			workOrderStartDate: toDatetimeLocalValue(workOrder.plannedStartDate ?? workOrder.startDate),
			workOrderEndDate: toDatetimeLocalValue(workOrder.plannedEndDate ?? workOrder.endDate),
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

	function handleSelectedCustomer(customer: CustomerRecord) {
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
		setShowCustomerSelector(false);
		setError('');
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

	function handleSelectedWorkOrder(workOrder: WorkOrderBase) {
		setForm((currentForm) => ({
			...currentForm,
			workOrderId: workOrder.id,
			workOrderReference: workOrder.reference ?? '',
			workOrderTitle: workOrder.title ?? '',
			workOrderStartDate: toDatetimeLocalValue(workOrder.plannedStartDate ?? workOrder.startDate),
			workOrderEndDate: toDatetimeLocalValue(workOrder.plannedEndDate ?? workOrder.endDate),
			workOrderAddress: 'address' in workOrder ? workOrder.address?.street1 ?? '' : '',
			workOrderPostalCode: 'address' in workOrder ? workOrder.address?.postalCode ?? '' : '',
			workOrderCity: 'address' in workOrder ? workOrder.address?.city ?? '' : '',
		}));
		setWorkOrderMode('existing');
		setShowWorkOrderSelector(false);
		setError('');
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

		if ((invoiceKind === InvoiceKind.CORRECTIVE || invoiceKind === InvoiceKind.CREDIT_NOTE) && !selectedSourceInvoice) {
			setError('Sélectionnez une facture source.');
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
			kind: invoiceKind,
			correctedInvoiceId: invoiceKind === InvoiceKind.CORRECTIVE ? selectedSourceInvoice?.id : undefined,
			referencedInvoiceId: invoiceKind === InvoiceKind.CREDIT_NOTE ? selectedSourceInvoice?.id : undefined,
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
				vatCategory: item.vatCategory,
				adjustments: item.adjustments.map((adjustment, position) => ({
					...adjustment,
					position,
					id: undefined,
				})),
			})),
			adjustments: form.adjustments.map((adjustment, position) => ({
				...adjustment,
				position,
				id: undefined,
			})),
			...(!initialInvoice && {
				payments: form.payments
					.filter((payment) => payment.amount.trim() && payment.paidAt)
					.map((payment) => ({
						amount: Number(payment.amount),
						paidAt: payment.paidAt,
						method: payment.method || undefined,
						reference: trimToUndefined(payment.reference),
						notes: trimToUndefined(payment.notes),
					})),
			}),
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
				setAssociatedQuote(null);
				setSelectedSourceInvoice(null);
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
				{initialInvoice ? 'Modifier la facture' : `Nouvelle facture ${invoiceKindLabels[invoiceKind]}`}
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

			{(invoiceKind === InvoiceKind.CORRECTIVE || invoiceKind === InvoiceKind.CREDIT_NOTE) && (
				<section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5">
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							className="rounded-md border border-amber-700 bg-amber-700 px-3 py-2 text-sm text-white transition hover:bg-amber-800"
							onClick={() => { void openSourceInvoiceSelector(); }}
						>
							{sourceInvoiceButtonLabel}
						</button>
						{selectedSourceInvoice && (
							<p className="min-w-0 text-sm text-amber-950">
								<strong>{selectedSourceInvoice.number || '-'}</strong> · {selectedSourceInvoice.workOrderTitle || '-'} · {selectedSourceInvoice.customerName || `${selectedSourceInvoice.customerFirstName} ${selectedSourceInvoice.customerLastName}`.trim() || '-'} · {selectedSourceInvoice.issueDate ? new Date(selectedSourceInvoice.issueDate).toLocaleDateString('fr-FR') : '-'} · {selectedSourceInvoice.status} · {Number(selectedSourceInvoice.taxInclusiveAmount ?? selectedSourceInvoice.total ?? 0).toFixed(2)} {selectedSourceInvoice.currency || 'EUR'}
							</p>
						)}
					</div>
				</section>
			)}

			<section className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:p-5">
				<div className="mb-4 flex items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Client</h4>
				</div>
				<div className="mb-4 flex flex-wrap gap-2">
					<button
						type="button"
						className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
						onClick={() => setShowCustomerSelector(true)}
					>
						Remplir depuis un client existant
					</button>
					<button
						type="button"
						className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
						onClick={() => setShowNewCustomerModal(true)}
					>
						Nouveau client
					</button>
				</div>

				{hasCustomerSummary && (
					<div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-sm text-zinc-700">
						<p className="min-w-0 truncate">
							<strong>{customerSummaryName || '-'}</strong> · {customerSummaryContact} · {customerSummaryLocation || '-'}
						</p>
						<button
							type="button"
							className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
							onClick={() => setShowCustomerFields((current) => !current)}
						>
							{showCustomerFields ? 'Fermer' : 'Modifier'}
						</button>
					</div>
				)}

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
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Ajustements de facture</h4>
					<button type="button" className="rounded-md border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm text-white transition hover:bg-emerald-800" onClick={() => openInvoiceAdjustmentForm()}>
						+ Ajouter une remise ou des frais
					</button>
				</div>
				{form.adjustments.length === 0 ? <p className="text-sm text-zinc-500">Aucun ajustement enregistré.</p> : (
					<div className="space-y-2">
						{form.adjustments.map((adjustment, index) => (
							<div key={adjustment.id ?? `adjustment-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
								<span className="min-w-0 flex-1 truncate text-zinc-700">{adjustment.type === InvoiceAdjustmentType.ALLOWANCE ? 'Remise' : 'Frais / charge'}: {adjustment.reason || 'Sans motif'} ({adjustment.amount.toFixed(2)} {form.currency || 'EUR'}, {adjustment.vatRate ?? 0}% TVA)</span>
								<span className="flex shrink-0 gap-2"><button type="button" className="rounded border border-zinc-300 px-2 py-1 text-xs" onClick={() => openInvoiceAdjustmentForm(adjustment)}>Modifier</button><button type="button" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700" onClick={() => updateInvoiceAdjustments(form.adjustments.filter((_, currentIndex) => currentIndex !== index))}>Supprimer</button></span>
							</div>
						))}
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
						className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
						onClick={() => setShowWorkOrderSelector(true)}
					>
						Remplir depuis un chantier existant
					</button>
					<button
						type="button"
						className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100"
						onClick={() => setShowNewWorkOrderModal(true)}
					>
						Nouveau chantier
					</button>
				</div>

				{form.workOrderId && (
					<div className="flex items-center justify-between gap-3 border-t border-zinc-200 pt-3 text-sm text-zinc-700">
						<p className="min-w-0 truncate">
							<strong>{form.workOrderTitle || '-'}</strong> · {form.workOrderReference || '-'} · {[form.workOrderPostalCode, form.workOrderCity].filter(Boolean).join(' ') || '-'}
						</p>
						<button
							type="button"
							className="shrink-0 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 transition hover:bg-zinc-100"
							onClick={() => setShowWorkOrderFields((current) => !current)}
						>
							{showWorkOrderFields ? 'Fermer' : 'Modifier'}
						</button>
					</div>
				)}
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
					<div className="relative">
						<button type="button" className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-700" onClick={() => setShowAddLineMenu((current) => !current)}>
							+ Ajouter une ligne
						</button>
						{showAddLineMenu && (
							<div className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
								<button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => { setShowAddLineMenu(false); void openCatalogItemSelector(); }}>Depuis le catalogue</button>
								<button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => { setShowAddLineMenu(false); updateInvoiceItems((items) => [...items, createEmptyInvoiceItem(items.length)]); }}>Ligne libre</button>
								<button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => { setShowAddLineMenu(false); void openQuoteSelector(); }}>Depuis le devis</button>
								<button type="button" className="block w-full rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100" onClick={() => { setShowAddLineMenu(false); openWorkOrderLineSelector(); }}>Depuis le chantier</button>
							</div>
						)}
					</div>
				</div>

				{quotesError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{quotesError}</div>}
				{workOrdersError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{workOrdersError}</div>}
				{catalogItemsError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{catalogItemsError}</div>}

				{showQuotesList && (
					<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQuotesList(false)}>
					<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-3 flex items-center gap-2">
							<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un devis</h4>
							<button type="button" className="ml-auto rounded border px-3 py-2 text-sm" onClick={() => setShowQuotesList(false)}>
								Fermer
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
					<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowWorkOrdersList(false)}>
					<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-3 flex items-center gap-2">
							<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un chantier</h4>
							<button type="button" className="ml-auto rounded border px-3 py-2 text-sm" onClick={() => setShowWorkOrdersList(false)}>
								Fermer
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
					<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCatalogItemsList(false)}>
					<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-3 flex items-center gap-2">
							<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un article catalogue</h4>
							<button type="button" className="ml-auto rounded border px-3 py-2 text-sm" onClick={() => setShowCatalogItemsList(false)}>
								Fermer
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
									onAddAdjustment={() => openLineAdjustmentForm(item.rowId)}
									onEditAdjustment={(adjustment) => openLineAdjustmentForm(item.rowId, adjustment)}
									onDeleteAdjustment={(adjustmentIndex) => updateLineAdjustments(item.rowId, item.adjustments.filter((_, currentIndex) => currentIndex !== adjustmentIndex))}
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
				<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
					<h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-700">Paiements</h4>
					<button type="button" className="rounded-md border border-emerald-700 bg-emerald-700 px-3 py-2 text-sm text-white transition hover:bg-emerald-800" onClick={() => setForm((currentForm) => ({ ...currentForm, payments: [...currentForm.payments, createEmptyInvoicePayment()] }))}>
						Ajouter un paiement
					</button>
				</div>
				{form.payments.length === 0 && <p className="text-sm text-zinc-500">Aucun paiement enregistré.</p>}
				<div className="space-y-3">
					{form.payments.map((payment, index) => (
						<div key={payment.rowId} className="rounded-lg border border-zinc-200 bg-white p-3">
							<div className="mb-3 flex items-center justify-between gap-2">
								<span className="text-sm font-medium text-zinc-700">Paiement {index + 1}</span>
								<button type="button" className="rounded border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50" onClick={() => setForm((currentForm) => ({ ...currentForm, payments: currentForm.payments.filter((currentPayment) => currentPayment.rowId !== payment.rowId) }))}>Supprimer</button>
							</div>
							<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
								<FieldLabel label="Montant" required><input type="number" min="0.01" step="0.01" className={fieldClassName} value={payment.amount} onChange={(event) => setForm((currentForm) => ({ ...currentForm, payments: currentForm.payments.map((currentPayment) => currentPayment.rowId === payment.rowId ? { ...currentPayment, amount: event.target.value } : currentPayment) }))} required /></FieldLabel>
								<FieldLabel label="Date du paiement" required><input type="datetime-local" className={fieldClassName} value={payment.paidAt} onChange={(event) => setForm((currentForm) => ({ ...currentForm, payments: currentForm.payments.map((currentPayment) => currentPayment.rowId === payment.rowId ? { ...currentPayment, paidAt: event.target.value } : currentPayment) }))} required /></FieldLabel>
								<FieldLabel label="Méthode"><select className={fieldClassName} value={payment.method} onChange={(event) => setForm((currentForm) => ({ ...currentForm, payments: currentForm.payments.map((currentPayment) => currentPayment.rowId === payment.rowId ? { ...currentPayment, method: event.target.value as PaymentMethod | '' } : currentPayment) }))}><option value="">Non précisée</option><option value="BANK_TRANSFER">Virement</option><option value="CARD">Carte</option><option value="CASH">Espèces</option><option value="CHECK">Chèque</option><option value="OTHER">Autre</option></select></FieldLabel>
								<FieldLabel label="Référence"><input className={fieldClassName} value={payment.reference} onChange={(event) => setForm((currentForm) => ({ ...currentForm, payments: currentForm.payments.map((currentPayment) => currentPayment.rowId === payment.rowId ? { ...currentPayment, reference: event.target.value } : currentPayment) }))} /></FieldLabel>
								<FieldLabel label="Notes" className="sm:col-span-2 lg:col-span-4"><input className={fieldClassName} value={payment.notes} onChange={(event) => setForm((currentForm) => ({ ...currentForm, payments: currentForm.payments.map((currentPayment) => currentPayment.rowId === payment.rowId ? { ...currentPayment, notes: event.target.value } : currentPayment) }))} /></FieldLabel>
							</div>
						</div>
					))}
				</div>
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
							<option value="ISSUED">Émise</option>
							<option value="REPLACED">Remplacée</option>
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
					{form.vatBreakdowns.length > 0 && (
						<div className="text-xs text-zinc-600">
							<p className="font-medium text-zinc-700">Ventilation TVA</p>
							{form.vatBreakdowns.map((breakdown) => (
								<div key={`${breakdown.vatCategory}-${breakdown.vatRate ?? 'none'}`} className="flex justify-between gap-3">
									<span>{breakdown.vatCategory}{breakdown.vatRate === undefined ? '' : ` ${breakdown.vatRate}%`}</span>
									<span>{toFiniteNumber(breakdown.vatAmount).toFixed(2)} {form.currency || 'EUR'}</span>
								</div>
							))}
						</div>
					)}
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
					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-zinc-700">Devis associé</span>
						<button
							type="button"
							className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white transition hover:bg-zinc-700"
							onClick={() => { void openAssociatedQuoteSelector(); }}
						>
							Associer un devis
						</button>
						{(associatedQuote || form.quoteNumber) && (
							<div className="flex min-w-0 items-center gap-3">
								<p className="min-w-0 truncate text-sm text-zinc-600">
									{associatedQuote?.number || form.quoteNumber} · {associatedQuote?.title || 'Devis associé'}
								</p>
								<button
									type="button"
									className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50"
									onClick={() => {
										setAssociatedQuote(null);
										setForm((currentForm) => ({ ...currentForm, quoteId: '', quoteNumber: '' }));
									}}
								>
									Désassocier
								</button>
							</div>
						)}
					</div>
				</div>
			</section>

			<button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700">
				{initialInvoice ? 'Modifier' : 'Créer la facture'}
			</button>
		</form>

			{showAssociatedQuoteModal && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAssociatedQuoteModal(false)}>
					<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-3 flex items-center justify-between gap-3">
							<h4 className="text-lg font-semibold text-zinc-900">Associer un devis</h4>
							<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowAssociatedQuoteModal(false)}>
								Fermer
							</button>
						</div>
						{quotesError && <div className="mb-3 rounded bg-red-100 p-3 text-red-700">{quotesError}</div>}
						{quotesLoading ? (
							<p>Chargement des devis...</p>
						) : (
							<QuotesList
								quotes={quotes}
								onDelete={null}
								handleSelectedQuote={handleAssociatedQuoteSelection}
							/>
						)}
					</div>
				</div>
			)}

		{lineAdjustmentTarget && (() => {
			const targetItem = form.invoiceItems.find((item) => item.rowId === lineAdjustmentTarget.rowId);
			if (!targetItem) return null;
			const baseAmount = roundMoney(targetItem.quantity * targetItem.unitPrice);
			return (
				<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setLineAdjustmentTarget(null)}>
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 className="text-lg font-semibold text-zinc-900">Remise ou frais de ligne</h4>
							<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setLineAdjustmentTarget(null)}>Fermer</button>
						</div>
						<AddInvoiceItemAdjustmentForm
							key={`${lineAdjustmentTarget.rowId}-${lineAdjustmentTarget.adjustment?.id ?? 'new'}`}
							show={true}
							baseAmount={baseAmount}
							initialAdjustment={lineAdjustmentTarget.adjustment}
							onCreated={(adjustment) => updateLineAdjustments(targetItem.rowId, [...targetItem.adjustments, adjustment])}
							onUpdated={(adjustment) => updateLineAdjustments(targetItem.rowId, targetItem.adjustments.map((current) => current.id === adjustment.id ? adjustment : current))}
							onClose={() => setLineAdjustmentTarget(null)}
						/>
					</div>
				</div>
			);
		})()}

		{showCustomerSelector && (
			<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCustomerSelector(false)}>
				<div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
					<div className="mb-3 flex items-center justify-between gap-3">
						<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un client</h4>
						<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowCustomerSelector(false)}>
							Fermer
						</button>
					</div>
					<CustomersList
						customers={customerListItems}
						onDelete={null}
						handleSelectedCustomer={handleSelectedCustomer}
					/>
				</div>
			</div>
		)}

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

		{showWorkOrderSelector && (
			<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowWorkOrderSelector(false)}>
				<div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
					<div className="mb-3 flex items-center justify-between gap-3">
						<h4 className="text-lg font-semibold text-zinc-900">Sélectionner un chantier</h4>
						<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowWorkOrderSelector(false)}>
							Fermer
						</button>
					</div>
					{workOrdersLoading ? (
						<p>Chargement des chantiers...</p>
					) : (
						<WorkOrdersList
							workOrders={workOrders}
							onDelete={null}
							handleSelectedWorkOrder={handleSelectedWorkOrder}
						/>
					)}
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

		{showSourceInvoiceModal && (
			<div
				className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
				onClick={() => setShowSourceInvoiceModal(false)}
			>
				<div
					className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-4 shadow-xl"
					onClick={(event) => event.stopPropagation()}
				>
					<div className="mb-3 flex items-center justify-between gap-3">
						<h4 className="text-lg font-semibold text-zinc-900">Sélectionner une facture source</h4>
						<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowSourceInvoiceModal(false)}>
							Fermer
						</button>
					</div>
					{sourceInvoicesError && <p className="mb-3 rounded bg-red-100 p-3 text-red-700">{sourceInvoicesError}</p>}
					{sourceInvoicesLoading ? (
						<p>Chargement des factures...</p>
					) : (
						<InvoicesList
							invoices={sourceInvoices}
							onDelete={null}
							handleSelectedInvoice={(invoice) => {
								setSelectedSourceInvoice(invoice);
								setShowSourceInvoiceModal(false);
								setSourceInvoicesError('');
							}}
						/>
					)}
				</div>
			</div>
		)}

		{showInvoiceAdjustmentModal && (
			<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowInvoiceAdjustmentModal(false)}>
				<div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
					<div className="mb-4 flex items-center justify-between gap-3">
						<h4 className="text-lg font-semibold text-zinc-900">{editingInvoiceAdjustment ? 'Modifier l’ajustement' : 'Ajouter une remise ou des frais'}</h4>
						<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowInvoiceAdjustmentModal(false)}>Fermer</button>
					</div>
					<AddInvoiceAdjustmentForm
						key={editingInvoiceAdjustment?.id ?? 'new-adjustment'}
						show={true}
						initialAdjustment={editingInvoiceAdjustment ?? undefined}
						onCreated={(adjustment) => updateInvoiceAdjustments([...form.adjustments, adjustment])}
						onUpdated={(adjustment) => updateInvoiceAdjustments(form.adjustments.map((current) => current.id === adjustment.id ? adjustment : current))}
						onClose={() => { setShowInvoiceAdjustmentModal(false); setEditingInvoiceAdjustment(null); }}
					/>
				</div>
			</div>
		)}
		</>
	);
}
