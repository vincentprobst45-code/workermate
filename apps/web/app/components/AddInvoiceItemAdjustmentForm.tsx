'use client';

import { InvoiceAdjustmentType } from '@prisma/client';
import { type FormEvent, useState } from 'react';

export interface InvoiceItemAdjustmentFormData {
	id?: string;
	position: number;
	type: InvoiceAdjustmentType;
	amount: number;
	baseAmount: number;
	percentage?: number;
	reason: string;
	reasonCode: string;
}

type AddInvoiceItemAdjustmentFormProps = {
	show: boolean;
	baseAmount: number;
	initialAdjustment?: InvoiceItemAdjustmentFormData;
	onCreated: (adjustment: InvoiceItemAdjustmentFormData) => void;
	onUpdated?: (adjustment: InvoiceItemAdjustmentFormData) => void;
	onClose: () => void;
};

const inputClassName = 'rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900';

export default function AddInvoiceItemAdjustmentForm({ show, baseAmount, initialAdjustment, onCreated, onUpdated, onClose }: AddInvoiceItemAdjustmentFormProps) {
	const [form, setForm] = useState<InvoiceItemAdjustmentFormData>(initialAdjustment ?? {
		position: 0,
		type: InvoiceAdjustmentType.ALLOWANCE,
		amount: 0,
		baseAmount,
		percentage: undefined,
		reason: '',
		reasonCode: '',
	});
	const [mode, setMode] = useState<'AMOUNT' | 'PERCENTAGE'>(initialAdjustment?.percentage == null ? 'AMOUNT' : 'PERCENTAGE');

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const percentage = mode === 'PERCENTAGE' ? Number(form.percentage) || 0 : undefined;
		const amount = mode === 'PERCENTAGE' ? Math.round(baseAmount * (percentage || 0)) / 100 : Number(form.amount) || 0;
		const adjustment = {
			...form,
			amount,
			baseAmount,
			percentage,
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
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Mode
					<select className={inputClassName} value={mode} onChange={(event) => setMode(event.target.value as 'AMOUNT' | 'PERCENTAGE')}>
						<option value="AMOUNT">Montant absolu</option>
						<option value="PERCENTAGE">Pourcentage</option>
					</select>
				</label>
				<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Base HT
					<input className={`${inputClassName} bg-zinc-100`} value={baseAmount.toFixed(2)} readOnly />
				</label>
				{mode === 'AMOUNT' ? (
					<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Montant HT *
						<input type="number" min="0" step="0.01" required className={inputClassName} value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.valueAsNumber || 0 })} />
					</label>
				) : (
					<label className="flex flex-col gap-1 text-sm font-medium text-zinc-700">Pourcentage *
						<input type="number" min="0" max="100" step="0.000001" required className={inputClassName} value={form.percentage ?? ''} onChange={(event) => setForm({ ...form, percentage: event.target.valueAsNumber || 0 })} />
					</label>
				)}
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
