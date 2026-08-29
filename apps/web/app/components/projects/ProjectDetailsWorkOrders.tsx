'use client';

import { LineItemType as WorkOrderItemType, WorkOrderStatus } from '@prisma/client';
import { useEffect, useState } from 'react';
import type { Project } from '../AddProjectForm';
import { useApiClient } from '../../api-client';
import AddWorkOrderForm from '../AddWorkOrderForm';
import AddWorklogForm from './AddWorklogForm';
import WorkLogsList from './WorkLogsList';
import { CardHeader, WorkOrderStatusBadge, alertError, btnGhost, btnPrimary, cardClass } from './theme';

type ProjectDetailsWorkOrdersProps = {
	project: Project;
};

type WorkOrderDetails = {
	id: string;
	customerId?: string | null;
	addressId?: string | null;
	reference: string;
	title: string;
	description?: string | null;
	status: WorkOrderStatus;
	startDate?: string | null;
	endDate?: string | null;
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

type WorkOrderSelection = {
	id: string;
	reference: string;
	title: string;
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

export default function ProjectDetailsWorkOrders({ project }: ProjectDetailsWorkOrdersProps) {
	const api = useApiClient();
	const [workOrders, setWorkOrders] = useState<WorkOrderDetails[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [reloadVersion, setReloadVersion] = useState(0);
	const [showAddWorkOrderModal, setShowAddWorkOrderModal] = useState(false);
	const [addMode, setAddMode] = useState<'existing' | 'new'>('existing');
	const [availableWorkOrders, setAvailableWorkOrders] = useState<WorkOrderSelection[]>([]);
	const [availableWorkOrdersLoading, setAvailableWorkOrdersLoading] = useState(false);
	const [selectedWorkOrderId, setSelectedWorkOrderId] = useState('');
	const [associationError, setAssociationError] = useState('');
	const [associating, setAssociating] = useState(false);
	const [workOrderForNewLog, setWorkOrderForNewLog] = useState<WorkOrderDetails | null>(null);
	const [workOrderForEdit, setWorkOrderForEdit] = useState<WorkOrderDetails | null>(null);
	const [workLogsRefreshKey, setWorkLogsRefreshKey] = useState(0);

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
					setWorkOrders(data.workOrders.map((workOrder) => ({
						...workOrder,
						startDate: workOrder.startDate ?? null,
						endDate: workOrder.endDate ?? null,
					})));
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

	useEffect(() => {
		if (!showAddWorkOrderModal || addMode !== 'existing') {
			return;
		}

		let cancelled = false;

		async function loadAvailableWorkOrders() {
			setAvailableWorkOrdersLoading(true);
			try {
				const response = await api.get('/workOrders');
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const data: WorkOrderSelection[] = await response.json();
				if (!cancelled) {
					setAvailableWorkOrders(data);
				}
			} catch {
				if (!cancelled) {
					setAssociationError('Erreur lors de la récupération des chantiers.');
				}
			} finally {
				if (!cancelled) {
					setAvailableWorkOrdersLoading(false);
				}
			}
		}

		void loadAvailableWorkOrders();

		return () => {
			cancelled = true;
		};
	}, [addMode, api, showAddWorkOrderModal]);

	function closeAddWorkOrderModal() {
		setShowAddWorkOrderModal(false);
		setSelectedWorkOrderId('');
		setAssociationError('');
	}

	async function associateWorkOrder(workOrderId: string) {
		setAssociating(true);
		setAssociationError('');

		try {
			const associationResponse = await api.post(
				`/projects/${project.id}/work-orders/${workOrderId}`,
			);
			if (!associationResponse.ok) {
				throw new Error('Erreur');
			}

			closeAddWorkOrderModal();
			setReloadVersion((currentVersion) => currentVersion + 1);
		} catch {
			setAssociationError('Erreur lors de l’association du chantier au projet.');
		} finally {
			setAssociating(false);
		}
	}

	return (
		<div className="space-y-4">
			<div className={cardClass}>
				<CardHeader title="Chantiers" />
				<button
					type="button"
					className={btnPrimary}
					onClick={() => setShowAddWorkOrderModal(true)}
				>
					Ajouter un chantier
				</button>
			</div>
			{loading && <p className="text-sm text-slate-500">Chargement des chantiers...</p>}
			{error && <div className={alertError}>{error}</div>}
			{!loading && !error && !workOrders.length && (
				<p className="text-sm text-slate-500">Aucun chantier associé à ce projet.</p>
			)}
			{!loading && !error && workOrders.length > 0 && (
				<div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
					{workOrders.map((workOrder) => (
						<article key={workOrder.id} className={`grid gap-4 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(20rem,1.5fr)_minmax(14rem,0.9fr)] ${cardClass}`}>
							<div className="space-y-2 text-sm">
								<button
									type="button"
									className={btnGhost}
									onClick={() => setWorkOrderForEdit(workOrder)}
								>
									Modifier le chantier
								</button>
								<p className="font-medium text-slate-900">{workOrder.reference}</p>
								<h4 className="text-base font-semibold text-slate-900">{workOrder.title}</h4>
								<div><WorkOrderStatusBadge status={workOrder.status} /></div>
								<p className="whitespace-pre-wrap text-slate-600">{workOrder.description || 'Aucune description.'}</p>
								<div className="border-t border-slate-200 pt-3">
									<h5 className="mb-2 font-medium text-slate-900">Étapes</h5>
									{workOrder.items.length ? (
										<ol className="space-y-2">
											{workOrder.items.map((item) => (
												<li key={item.id} className="border-l-2 border-slate-300 pl-2">
													<p className="font-medium text-slate-900">{item.title}</p>
													{item.description && <p className="text-slate-600">{item.description}</p>}
													<p className="mt-1 text-xs text-slate-500">{item.quantity} {item.unit || 'unité'}</p>
												</li>
											))}
										</ol>
									) : <p className="text-slate-600">Aucune étape.</p>}
								</div>
							</div>
							<div className="min-w-0 border-y border-slate-200 py-4 lg:border-x lg:border-y-0 lg:px-4 lg:py-0">
								<div className="mb-3 flex items-center justify-between gap-3">
									<h4 className="text-sm font-medium text-slate-900">Fiches de suivi</h4>
									<button type="button" className={btnPrimary} onClick={() => setWorkOrderForNewLog(workOrder)}>
										Ajouter une fiche de suivi
									</button>
								</div>
								<WorkLogsList workOrderId={workOrder.id} refreshKey={workLogsRefreshKey} />
							</div>
							<div className="space-y-2 text-sm text-slate-600">
								<p><strong className="text-slate-900">Client:</strong> {formatCustomerName(workOrder.customer)}</p>
								<p><strong className="text-slate-900">Adresse:</strong> {workOrder.address ? <><br />{workOrder.address.street1}<br />{workOrder.address.postalCode} {workOrder.address.city}</> : '-'}</p>
								<p><strong className="text-slate-900">Début:</strong> {formatDate(workOrder.startDate)}</p>
								<p><strong className="text-slate-900">Fin:</strong> {formatDate(workOrder.endDate)}</p>
							</div>
						</article>
					))}
				</div>
			)}
			{showAddWorkOrderModal && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={closeAddWorkOrderModal}>
					<div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 className="text-lg font-semibold text-slate-900">Ajouter un chantier au projet</h4>
							<button type="button" className={btnGhost} onClick={closeAddWorkOrderModal}>Fermer</button>
						</div>
						<div className="mb-4 flex gap-2 border-b border-slate-200">
							<button type="button" className={`border-b-2 px-3 py-2 text-sm ${addMode === 'existing' ? 'border-indigo-600 font-medium text-indigo-700' : 'border-transparent text-slate-500'}`} onClick={() => setAddMode('existing')}>Chantier existant</button>
							<button type="button" className={`border-b-2 px-3 py-2 text-sm ${addMode === 'new' ? 'border-indigo-600 font-medium text-indigo-700' : 'border-transparent text-slate-500'}`} onClick={() => setAddMode('new')}>Nouveau chantier</button>
						</div>
						{associationError && <div className={`mb-4 ${alertError}`}>{associationError}</div>}
						{addMode === 'existing' ? (
							<div className="space-y-4">
								{availableWorkOrdersLoading ? <p className="text-sm text-slate-500">Chargement des chantiers...</p> : (
									<select className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" value={selectedWorkOrderId} onChange={(event) => setSelectedWorkOrderId(event.target.value)}>
										<option value="">-- Sélectionner un chantier --</option>
										{availableWorkOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.reference} - {workOrder.title}</option>)}
									</select>
								)}
								<button type="button" disabled={!selectedWorkOrderId || associating} className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`} onClick={() => void associateWorkOrder(selectedWorkOrderId)}>
									{associating ? 'Association...' : 'Associer au projet'}
								</button>
							</div>
						) : (
							<AddWorkOrderForm show={true} onCreated={(workOrder) => void associateWorkOrder(workOrder.id)} />
						)}
					</div>
				</div>
			)}
			{workOrderForNewLog && (
				<div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4" onClick={() => setWorkOrderForNewLog(null)}>
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 className="text-lg font-semibold text-slate-900">Nouvelle fiche de suivi: {workOrderForNewLog.title}</h4>
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
					<div className="w-full max-w-6xl rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 className="text-xl font-semibold text-slate-900">Modifier le chantier</h4>
							<button type="button" className={btnGhost} onClick={() => setWorkOrderForEdit(null)}>Fermer</button>
						</div>
						<AddWorkOrderForm
							show={true}
							initialWorkOrder={{
								...workOrderForEdit,
								description: workOrderForEdit.description ?? '',
								customerId: workOrderForEdit.customerId ?? undefined,
								addressId: workOrderForEdit.addressId ?? undefined,
								startDate: workOrderForEdit.startDate ?? undefined,
								endDate: workOrderForEdit.endDate ?? undefined,
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
