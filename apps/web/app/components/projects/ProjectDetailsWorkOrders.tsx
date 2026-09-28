'use client';

import { LineItemType as WorkOrderItemType, WorkOrderStatus } from '@prisma/client';
import { useCallback, useEffect, useState } from 'react';
import type { Project } from '../AddProjectForm';
import { useApiClient } from '../../api-client';
import AddWorkOrderForm from '../AddWorkOrderForm';
import AddWorklogForm from './AddWorklogForm';
import WorkLogsList from './WorkLogsList';
import { CardHeader, WorkOrderStatusBadge, alertError, btnGhost, btnPrimary, cardClass } from './theme';

type ProjectDetailsWorkOrdersProps = {
	project: Project;
	onRequestAssociate: () => void;
	onRequestCreate: () => void;
	onChanged: () => void;
};

type WorkOrderDetails = {
	id: string;
	customerId?: string | null;
	addressId?: string | null;
	reference: string;
	title: string;
	description?: string | null;
	status: WorkOrderStatus;
		plannedStartDate?: string | null;
		plannedEndDate?: string | null;
	customer?: {
		firstName?: string | null;
		lastName?: string | null;
		company?: string | null;
	} | null;
	address?: {
		street1: string;
		postalCode: string;
		city: string;
	} | null;
	items: Array<{
		id: string;
		position: number;
		type: WorkOrderItemType;
		title: string;
		description?: string | null;
		quantity: number;
		unit?: string | null;
		unitCode: string;
		unitLabel?: string | null;
		subtotal: number;
		vatCategory: string;
		unitPrice: number;
		unitCost?: number | null;
		purchaseVatRate?: number | null;
		vatRate: number;
	}>;
};

type ProjectDetailsResponse = {
	workOrders: WorkOrderDetails[];
};

function formatDate(value?: string | null): string {
	if (!value) {
		return '-';
	}

	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

function formatCustomerName(customer: WorkOrderDetails['customer']): string {
	if (!customer) {
		return '-';
	}

	return [customer.firstName, customer.lastName, customer.company]
		.filter((value): value is string => Boolean(value?.trim()))
		.map((value) => value.trim())
		.join(' ') || '-';
}

export default function ProjectDetailsWorkOrders({ project, onRequestAssociate, onRequestCreate, onChanged }: ProjectDetailsWorkOrdersProps) {
	const api = useApiClient();
	const [workOrders, setWorkOrders] = useState<WorkOrderDetails[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [reloadVersion, setReloadVersion] = useState(0);
	const [associating, setAssociating] = useState(false);
	const [workOrderForNewLog, setWorkOrderForNewLog] = useState<WorkOrderDetails | null>(null);
	const [workOrderForEdit, setWorkOrderForEdit] = useState<WorkOrderDetails | null>(null);
	const [workLogsRefreshKey, setWorkLogsRefreshKey] = useState(0);
	const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
	const [workLogCounts, setWorkLogCounts] = useState<Record<string, number>>({});
	const handleWorkLogCountChange = useCallback((workOrderId: string, count: number) => {
		setWorkLogCounts((current) => ({ ...current, [workOrderId]: count }));
	}, []);

	useEffect(() => {
		if (!workOrderForNewLog && !workOrderForEdit) return;
		function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') { setWorkOrderForNewLog(null); setWorkOrderForEdit(null); } }
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [workOrderForEdit, workOrderForNewLog]);

	useEffect(() => {
		let cancelled = false;

		async function loadWorkOrders() {
			setLoading(true);
			try {
				const response = await api.get(`/projects/${project.id}`);
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const data: ProjectDetailsResponse = await response.json();
				if (!cancelled) {
					setWorkOrders(data.workOrders);
					setError('');
				}
			} catch {
				if (!cancelled) {
					setWorkOrders([]);
					setError('Erreur lors de la récupération des chantiers du projet.');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void loadWorkOrders();

		return () => {
			cancelled = true;
		};
	}, [api, project.id, reloadVersion]);

	async function disassociateWorkOrder(workOrderId: string) {
		if (!window.confirm('Désassocier ce chantier du projet ?')) return;
		setAssociating(true);
		try {
			const response = await api.delete(`/projects/${project.id}/work-orders/${workOrderId}`);
			if (!response.ok) throw new Error('Erreur');
			setReloadVersion((currentVersion) => currentVersion + 1);
			onChanged();
		} catch {
			setError('Erreur lors de la désassociation du chantier.');
		} finally {
			setAssociating(false);
		}
	}

	const visibleWorkOrders = statusFilter === 'ALL' ? workOrders : workOrders.filter((workOrder) => workOrder.status === statusFilter);

	return (
		<div className="space-y-4">
			<div className={`${cardClass} flex flex-wrap items-center justify-between gap-3`}>
				<CardHeader title={`Chantiers (${workOrders.length})`} />
				<div className="flex flex-wrap items-center gap-2">
					<label className="flex items-center gap-2 text-sm text-slate-600"><span className="sr-only">Filtrer les chantiers par statut</span><select aria-label="Filtrer les chantiers par statut" className="rounded-lg border border-slate-300 bg-white px-3 py-2" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | WorkOrderStatus)}><option value="ALL">Tous les statuts</option><option value="DRAFT">Brouillons</option><option value="PLANNED">Planifiés</option><option value="IN_PROGRESS">En cours</option><option value="COMPLETED">Terminés</option><option value="CANCELLED">Annulés</option></select></label>
				<button
					type="button"
					className={btnPrimary}
					onClick={onRequestAssociate}
				>
					Ajouter un chantier
				</button>
					<button type="button" className={btnGhost} onClick={onRequestCreate}>Créer un chantier</button>
				</div>
			</div>
			{loading && <p className="text-sm text-slate-500">Chargement des chantiers...</p>}
			{error && <div className={alertError}>{error}</div>}
			{!loading && !error && !workOrders.length && (
				<p className="text-sm text-slate-500">Aucun chantier associé à ce projet.</p>
			)}
			{!loading && !error && workOrders.length > 0 && !visibleWorkOrders.length && (
				<p className="text-sm text-slate-500">Aucun chantier ne correspond à ce filtre.</p>
			)}
			{!loading && !error && visibleWorkOrders.length > 0 && (
				<div className="space-y-3">
					{visibleWorkOrders.map((workOrder) => (
						<article key={workOrder.id} className={cardClass}>
							<div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
								<div className="min-w-0">
									<p className="font-medium text-slate-900">{workOrder.reference}</p>
									<h4 className="text-base font-semibold text-slate-900">{workOrder.title}</h4>
									<div className="mt-2"><WorkOrderStatusBadge status={workOrder.status} /></div>
								</div>
								<div className="flex flex-wrap gap-2">
								<button
									type="button"
									className={btnGhost}
									onClick={() => setWorkOrderForEdit(workOrder)}
								>
									Modifier le chantier
								</button>
								<button type="button" className={btnGhost} disabled={associating} onClick={() => void disassociateWorkOrder(workOrder.id)}>
									{associating ? 'Retrait...' : 'Retirer du projet'}
								</button>
								</div>
							</div>
							<div className="grid gap-4 py-4 text-sm md:grid-cols-3">
								<p className="whitespace-pre-wrap text-slate-600 md:col-span-2">{workOrder.description || 'Aucune description.'}</p>
								<div className="space-y-1 text-slate-600"><p><strong className="text-slate-900">Client:</strong> {formatCustomerName(workOrder.customer)}</p><p><strong className="text-slate-900">Adresse:</strong> {workOrder.address ? <>{workOrder.address.street1}, {workOrder.address.postalCode} {workOrder.address.city}</> : '-'}</p><p><strong className="text-slate-900">Dates:</strong> {formatDate(workOrder.plannedStartDate)} → {formatDate(workOrder.plannedEndDate)}</p></div>
							</div>
			<div className="border-t border-slate-200 pt-4">
				<h4 className="mb-3 text-sm font-medium text-slate-900">Étapes ({workOrder.items.length})</h4>
				{workOrder.items.length ? <>
					<div className="hidden overflow-x-auto md:block">
						<table className="w-full border-collapse text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="border border-slate-200 px-3 py-2">Étape</th><th className="border border-slate-200 px-3 py-2">Type</th><th className="border border-slate-200 px-3 py-2 text-right">Quantité</th><th className="border border-slate-200 px-3 py-2">Unité</th><th className="border border-slate-200 px-3 py-2 text-right">Total HT</th></tr></thead><tbody>{workOrder.items.map((item) => <tr key={item.id}><td className="border border-slate-200 px-3 py-2 font-medium text-slate-900">{item.title}</td><td className="border border-slate-200 px-3 py-2 text-slate-600">{item.type}</td><td className="border border-slate-200 px-3 py-2 text-right">{item.quantity}</td><td className="border border-slate-200 px-3 py-2">{item.unitLabel || item.unit || item.unitCode || '-'}</td><td className="border border-slate-200 px-3 py-2 text-right">{Number(item.subtotal || 0).toFixed(2)} €</td></tr>)}</tbody></table>
					</div>
					<ul className="space-y-2 md:hidden">{workOrder.items.map((item) => <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="font-medium text-slate-900">{item.title}</p><p className="mt-1 text-xs text-slate-600">{item.type} · {item.quantity} {item.unitLabel || item.unit || item.unitCode || 'unité'}</p><p className="mt-1 text-xs text-slate-600">Total HT: {Number(item.subtotal || 0).toFixed(2)} €</p>{item.description && <p className="mt-2 text-sm text-slate-600">{item.description}</p>}</li>)}</ul>
				</> : <p className="text-sm text-slate-600">Aucune étape.</p>}
			</div>
							<div className="border-t border-slate-200 pt-4">
								<div className="mb-3 flex items-center justify-between gap-3">
									<h4 className="text-sm font-medium text-slate-900">Fiches de suivi ({workLogCounts[workOrder.id] ?? 0})</h4>
									<button type="button" className={btnPrimary} onClick={() => setWorkOrderForNewLog(workOrder)}>
										Ajouter une fiche de suivi
									</button>
								</div>
								<WorkLogsList workOrderId={workOrder.id} refreshKey={workLogsRefreshKey} onCountChange={(count) => handleWorkLogCountChange(workOrder.id, count)} />
							</div>
						</article>
					))}
				</div>
			)}
			{workOrderForNewLog && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => setWorkOrderForNewLog(null)}>
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="new-worklog-title" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 id="new-worklog-title" className="text-lg font-semibold text-slate-900">Nouvelle fiche de suivi: {workOrderForNewLog.title}</h4>
							<button type="button" className={btnGhost} onClick={() => setWorkOrderForNewLog(null)}>Fermer</button>
						</div>
						<AddWorklogForm
							projectId={project.id}
							workOrderId={workOrderForNewLog.id}
							onCreated={() => {
								setWorkOrderForNewLog(null);
								setWorkLogsRefreshKey((currentKey) => currentKey + 1);
							}}
						/>
					</div>
				</div>
			)}
			{workOrderForEdit && (
				<div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={() => setWorkOrderForEdit(null)}>
					<div className="w-full max-w-6xl rounded-2xl bg-white p-5 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="edit-workorder-title" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 id="edit-workorder-title" className="text-xl font-semibold text-slate-900">Modifier le chantier</h4>
							<button type="button" className={btnGhost} onClick={() => setWorkOrderForEdit(null)}>Fermer</button>
						</div>
						<AddWorkOrderForm
							show={true}
							initialWorkOrder={{
								...workOrderForEdit,
								description: workOrderForEdit.description ?? '',
								customerId: workOrderForEdit.customerId ?? undefined,
								addressId: workOrderForEdit.addressId ?? undefined,
								startDate: workOrderForEdit.plannedStartDate ?? undefined,
								endDate: workOrderForEdit.plannedEndDate ?? undefined,
								items: workOrderForEdit.items.map((item) => ({
									...item,
									description: item.description ?? '',
									unit: item.unit ?? '',
									unitCost: item.unitCost ?? undefined,
									purchaseVatRate: item.purchaseVatRate ?? undefined,
								}))
							}}
							onCreated={() => undefined}
							onUpdated={(updatedWorkOrder) => {
								setWorkOrders((currentWorkOrders) => currentWorkOrders.map((current) => current.id === updatedWorkOrder.id ? updatedWorkOrder as WorkOrderDetails : current));
								setWorkOrderForEdit(null);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
