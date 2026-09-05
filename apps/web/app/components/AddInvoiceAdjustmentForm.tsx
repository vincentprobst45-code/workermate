'use client';

import { InvoiceAdjustmentType, VatCategory } from '@prisma/client';
import { type FormEvent, useState } from 'react';

export interface InvoiceAdjustmentFormData {
	id?: string;
	position: number;
	type: InvoiceAdjustmentType;
	amount: number;
	baseAmount?: number;
	percentage?: number;
	vatCategory: VatCategory;
	vatRate?: number;
	reason: string;
	reasonCode: string;
}

type AddInvoiceAdjustmentFormProps = {
	show: boolean;
	initialAdjustment?: InvoiceAdjustmentFormData;
	onCreated: (adjustment: InvoiceAdjustmentFormData) => void;
	onUpdated?: (adjustment: InvoiceAdjustmentFormData) => void;
	onClose: () => void;
};

const inputClassName = 'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

export default function AddInvoiceAdjustmentForm({ show, initialAdjustment, onCreated, onUpdated, onClose }: AddInvoiceAdjustmentFormProps) {
	const [form, setForm] = useState<InvoiceAdjustmentFormData>(initialAdjustment ?? {
		position: 0,
		type: InvoiceAdjustmentType.ALLOWANCE,
		amount: 0,
		baseAmount: undefined,
		percentage: undefined,
		vatCategory: VatCategory.STANDARD,
		vatRate: 20,
		reason: '',
		reasonCode: '',
	});

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const adjustment = {
			...form,
			amount: Number(form.amount) || 0,
			baseAmount: form.baseAmount === undefined ? undefined : Number(form.baseAmount) || 0,
			percentage: form.percentage === undefined ? undefined : Number(form.percentage) || 0,
			vatRate: form.vatRate === undefined ? undefined : Number(form.vatRate) || 0,
		};
		if (initialAdjustment) onUpdated?.(adjustment);
		else onCreated(adjustment);
		onClose();
	}

	if (!show) return null;

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Type
					<select className={inputClassName} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as InvoiceAdjustmentType })}>
						<option value={InvoiceAdjustmentType.ALLOWANCE}>Remise</option>
						<option value={InvoiceAdjustmentType.CHARGE}>Frais / charge</option>
					</select>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Montant HT *
					<input type="number" min="0" step="0.01" required className={inputClassName} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.valueAsNumber || 0 })} />
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Base HT
					<input type="number" min="0" step="0.01" className={inputClassName} value={form.baseAmount ?? ''} onChange={(event) => setForm({ ...form, baseAmount: event.target.value === '' ? undefined : event.target.valueAsNumber })} />
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Pourcentage
					<input type="number" min="0" step="0.000001" className={inputClassName} value={form.percentage ?? ''} onChange={(event) => setForm({ ...form, percentage: event.target.value === '' ? undefined : event.target.valueAsNumber })} />
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Catégorie TVA *
					<select className={inputClassName} value={form.vatCategory} onChange={(event) => setForm({ ...form, vatCategory: event.target.value as VatCategory })}>
						<option value="STANDARD">Standard</option><option value="EXEMPT">Exonérée</option><option value="REVERSE_CHARGE">Autoliquidation</option><option value="INTRA_COMMUNITY_SUPPLY">Intracommunautaire</option><option value="EXPORT">Export</option><option value="OUTSIDE_SCOPE">Hors champ</option><option value="ZERO">Taux zéro</option>
					</select>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Taux TVA
					<input type="number" min="0" step="0.01" className={inputClassName} value={form.vatRate ?? ''} onChange={(event) => setForm({ ...form, vatRate: event.target.value === '' ? undefined : event.target.valueAsNumber })} />
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Motif
					<input className={inputClassName} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} />
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Code motif
					<input className={inputClassName} value={form.reasonCode} onChange={(event) => setForm({ ...form, reasonCode: event.target.value })} />
				</label>
			</div>
			<div className="flex justify-end gap-2">
				<button type="button" className="rounded-md border border-zinc-300 px-3 py-2 text-sm" onClick={onClose}>Annuler</button>
				<button type="submit" className="rounded-md bg-zinc-900 px-3 py-2 text-sm text-white">{initialAdjustment ? 'Modifier' : 'Ajouter'}</button>
			</div>
		</form>
	);
}