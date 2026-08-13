'use client';

import { WorkOrderStatus } from '@prisma/client';
import { useEffect, useState } from 'react';
import type { Project } from '../AddProjectForm';
import { useApiClient } from '../../api-client';
import AddWorkOrderForm from '../AddWorkOrderForm';
import AddWorklogForm from './AddWorklogForm';
import WorkLogsList from './WorkLogsList';

type ProjectDetailsWorkOrdersProps = {
	project: Project;
};

type WorkOrderDetails = {
	id: string;
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
		title: string;
		description?: string | null;
		quantity: number;
		unit?: string | null;
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

function statusLabel(status: WorkOrderStatus): string {
	const labels: Record<WorkOrderStatus, string> = {
		DRAFT: 'Brouillon',
		PLANNED: 'Planifié',
		IN_PROGRESS: 'En cours',
		COMPLETED: 'Terminé',
		CANCELLED: 'Annulé',
	};

	return labels[status];
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
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<h3 className="text-lg font-semibold text-zinc-900">Chantiers</h3>
				<button
					type="button"
					className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
					onClick={() => setShowAddWorkOrderModal(true)}
				>
					Ajouter un chantier
				</button>
			</div>
			{loading && <p className="text-sm text-zinc-600">Chargement des chantiers...</p>}
			{error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
			{!loading && !error && !workOrders.length && (
				<p className="text-sm text-zinc-600">Aucun chantier associé à ce projet.</p>
			)}
			{!loading && !error && workOrders.length > 0 && (
				<div className="max-h-[60vh] space-y-3 overflow-y-auto pr-2">
					{workOrders.map((workOrder) => (
						<article key={workOrder.id} className="grid gap-4 border border-zinc-200 bg-white p-4 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(20rem,1.5fr)_minmax(14rem,0.9fr)]">
							<div className="space-y-2 text-sm">
								<p className="font-medium text-zinc-900">{workOrder.reference}</p>
								<h4 className="text-base font-semibold text-zinc-900">{workOrder.title}</h4>
								<p className="text-zinc-600"><strong className="text-zinc-900">Statut:</strong> {statusLabel(workOrder.status)}</p>
								<p className="whitespace-pre-wrap text-zinc-600">{workOrder.description || 'Aucune description.'}</p>
								<div className="border-t border-zinc-200 pt-3">
									<h5 className="mb-2 font-medium text-zinc-900">Étapes</h5>
									{workOrder.items.length ? (
										<ol className="space-y-2">
											{workOrder.items.map((item) => (
												<li key={item.id} className="border-l-2 border-zinc-300 pl-2">
													<p className="font-medium text-zinc-900">{item.title}</p>
													{item.description && <p className="text-zinc-600">{item.description}</p>}
													<p className="mt-1 text-xs text-zinc-500">{item.quantity} {item.unit || 'unité'}</p>
												</li>
											))}
										</ol>
									) : <p className="text-zinc-600">Aucune étape.</p>}
								</div>
							</div>
							<div className="min-w-0 border-y border-zinc-200 py-4 lg:border-x lg:border-y-0 lg:px-4 lg:py-0">
								<div className="mb-3 flex items-center justify-between gap-3">
									<h4 className="text-sm font-medium text-zinc-900">Fiches de suivi</h4>
									<button type="button" className="rounded-md border border-zinc-900 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-700" onClick={() => setWorkOrderForNewLog(workOrder)}>
										Ajouter une fiche de suivi
									</button>
								</div>
								<WorkLogsList workOrderId={workOrder.id} refreshKey={workLogsRefreshKey} />
							</div>
							<div className="space-y-2 text-sm text-zinc-600">
								<p><strong className="text-zinc-900">Client:</strong> {formatCustomerName(workOrder.customer)}</p>
								<p><strong className="text-zinc-900">Adresse:</strong> {workOrder.address ? <><br />{workOrder.address.street1}<br />{workOrder.address.postalCode} {workOrder.address.city}</> : '-'}</p>
								<p><strong className="text-zinc-900">Début:</strong> {formatDate(workOrder.startDate)}</p>
								<p><strong className="text-zinc-900">Fin:</strong> {formatDate(workOrder.endDate)}</p>
							</div>
						</article>
					))}
				</div>
			)}
			{showAddWorkOrderModal && (
				<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={closeAddWorkOrderModal}>
					<div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 className="text-lg font-semibold text-zinc-900">Ajouter un chantier au projet</h4>
							<button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={closeAddWorkOrderModal}>Fermer</button>
						</div>
						<div className="mb-4 flex gap-2 border-b border-zinc-200">
							<button type="button" className={`border-b-2 px-3 py-2 text-sm ${addMode === 'existing' ? 'border-zinc-900 font-medium text-zinc-900' : 'border-transparent text-zinc-500'}`} onClick={() => setAddMode('existing')}>Chantier existant</button>
							<button type="button" className={`border-b-2 px-3 py-2 text-sm ${addMode === 'new' ? 'border-zinc-900 font-medium text-zinc-900' : 'border-transparent text-zinc-500'}`} onClick={() => setAddMode('new')}>Nouveau chantier</button>
						</div>
						{associationError && <p className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{associationError}</p>}
						{addMode === 'existing' ? (
							<div className="space-y-4">
								{availableWorkOrdersLoading ? <p className="text-sm text-zinc-600">Chargement des chantiers...</p> : (
									<select className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm" value={selectedWorkOrderId} onChange={(event) => setSelectedWorkOrderId(event.target.value)}>
										<option value="">-- Sélectionner un chantier --</option>
										{availableWorkOrders.map((workOrder) => <option key={workOrder.id} value={workOrder.id}>{workOrder.reference} - {workOrder.title}</option>)}
									</select>
								)}
								<button type="button" disabled={!selectedWorkOrderId || associating} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" onClick={() => void associateWorkOrder(selectedWorkOrderId)}>
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
					<div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 className="text-lg font-semibold text-zinc-900">Nouvelle fiche de suivi: {workOrderForNewLog.title}</h4>
							<button type="button" className="rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100" onClick={() => setWorkOrderForNewLog(null)}>Fermer</button>
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
		</div>
	);
}
