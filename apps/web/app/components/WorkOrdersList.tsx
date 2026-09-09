'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { LineItemType as WorkOrderItemType, WorkOrderStatus } from '@prisma/client';
import { Search, X } from 'lucide-react';
import AddWorkOrderForm, { type WorkOrderEditInput } from './AddWorkOrderForm';
import WorkOrderDetails from './WorkOrderDetails';

export interface WorkOrderItem {
	id: string;
	position: number;
	type: WorkOrderItemType;
	title: string;
	description?: string;
	quantity: number;
	unitCost?: number;
	purchaseVatRate?: number;
	unit?: string;
	sellerItemIdentifier?: string;
	unitCode: string;
	unitLabel?: string;
	subtotal: number;
	vatCategory: string;
	unitPrice: number;
	vatRate: number;
}

export interface WorkOrder {
	id: string;
	title: string;
	description?: string;
	reference: string;
	startDate?: string;
	endDate?: string;
	plannedStartDate?: string;
	plannedEndDate?: string;
	status: WorkOrderStatus;
	items: WorkOrderItem[];
	customerId?: string;
	addressId?: string;
	customer?: {
		firstName?: string | null;
		lastName?: string | null;
		company?: string | null;
	} | null;
	address?: {
		street1: string;
		street2?: string | null;
		postalCode: string;
		city: string;
	} | null;
	createdById?: string;
	createdAt?: string;
}

interface WorkOrdersListProps {
	workOrders: WorkOrder[];
	onDelete: ((id: string) => void | Promise<void>) | null ;
	handleSelectedWorkOrder?: ((workOrder: WorkOrder) => void | Promise<void>) | null ;
}

export default function WorkOrdersList({ workOrders, onDelete, handleSelectedWorkOrder }: WorkOrdersListProps) {
	const [showWorkOrderDetails, setShowWorkOrderDetails] = useState(false);
	const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
	const [showEditWorkOrder, setShowEditWorkOrder] = useState(false);
	const [workOrdersPerPage, setWorkOrdersPerPage] = useState(5);
	const [currentPage, setCurrentPage] = useState(1);
	const [sortBy, setSortBy] = useState<'createdAtDesc' | 'createdAtAsc' | 'titleAsc' | 'titleDesc'>('createdAtDesc');
	const [statusFilter, setStatusFilter] = useState<'ALL' | WorkOrderStatus>('ALL');
	const [futureOnly, setFutureOnly] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');
	const [workOrderToDelete, setWorkOrderToDelete] = useState<WorkOrder | null>(null);
	const [deletingWorkOrderId, setDeletingWorkOrderId] = useState<string | null>(null);
	const [deletionError, setDeletionError] = useState('');
	const deleteCancelRef = useRef<HTMLButtonElement>(null);
	const filteredWorkOrders = useMemo(() => workOrders.filter((workOrder) => {
		const now = new Date();
		const normalizedSearch = searchTerm.trim().toLocaleLowerCase('fr');
		if (normalizedSearch && ![workOrder.title, workOrder.reference, workOrder.description].filter(Boolean).some((value) => value!.toLocaleLowerCase('fr').includes(normalizedSearch))) {
			return false;
		}
		if (statusFilter !== 'ALL' && workOrder.status !== statusFilter) {
			return false;
		}

		if (futureOnly) {
			if (!workOrder.startDate) {
				return false;
			}
			return new Date(workOrder.startDate).getTime() >= now.getTime();
		}

		return true;
	}), [workOrders, searchTerm, statusFilter, futureOnly]);

	const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => {
		if (futureOnly) {
			const aStart = a.startDate ? new Date(a.startDate).getTime() : Number.POSITIVE_INFINITY;
			const bStart = b.startDate ? new Date(b.startDate).getTime() : Number.POSITIVE_INFINITY;
			return aStart - bStart;
		}

		if (sortBy === 'createdAtDesc') {
			const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			return bCreatedAt - aCreatedAt;
		}
		if (sortBy === 'createdAtAsc') {
			const aCreatedAt = a.createdAt ? new Date(a.createdAt).getTime() : 0;
			const bCreatedAt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
			return aCreatedAt - bCreatedAt;
		}
		if (sortBy === 'titleAsc') {
			return a.title.localeCompare(b.title, 'fr', { sensitivity: 'base' });
		}
		return b.title.localeCompare(a.title, 'fr', { sensitivity: 'base' });
	});

	const totalPages = Math.max(1, Math.ceil(sortedWorkOrders.length / workOrdersPerPage));
	const effectiveCurrentPage = Math.min(currentPage, totalPages);
	const firstItemIndex = (effectiveCurrentPage - 1) * workOrdersPerPage;
	const currentWorkOrders = sortedWorkOrders.slice(firstItemIndex, firstItemIndex + workOrdersPerPage);
	const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1);

	useEffect(() => {
		if (!workOrderToDelete) return;
		deleteCancelRef.current?.focus();
		function closeWithEscape(event: KeyboardEvent) {
			if (event.key === 'Escape' && !deletingWorkOrderId) setWorkOrderToDelete(null);
		}
		document.addEventListener('keydown', closeWithEscape);
		return () => document.removeEventListener('keydown', closeWithEscape);
	}, [workOrderToDelete, deletingWorkOrderId]);

	async function confirmDelete() {
		if (!workOrderToDelete || !onDelete) return;
		setDeletingWorkOrderId(workOrderToDelete.id);
		setDeletionError('');
		try {
			await onDelete(workOrderToDelete.id);
			setWorkOrderToDelete(null);
		} catch {
			setDeletionError('La suppression a échoué. Le chantier est toujours présent.');
		} finally {
			setDeletingWorkOrderId(null);
		}
	}

	function openWorkOrder(workOrder: WorkOrder) {
		if (handleSelectedWorkOrder) {
			void handleSelectedWorkOrder(workOrder);
			return;
		}
		setShowWorkOrderDetails(true);
		setSelectedWorkOrder(workOrder);
	}

	const statusLabels: Record<WorkOrderStatus, string> = {
		DRAFT: 'Brouillon',
		PLANNED: 'Planifié',
		IN_PROGRESS: 'En cours',
		COMPLETED: 'Terminé',
		CANCELLED: 'Annulé',
	};

	function formatDate(value?: string) {
		return value ? new Date(value).toLocaleDateString('fr-FR') : 'Non planifié';
	}


	return (
		<>
			<div className="mb-5 space-y-4">
				<div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-end">
					<label className="relative block sm:col-span-4">
						<span className="sr-only">Rechercher un chantier</span>
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
						<input type="search" value={searchTerm} onChange={(event) => { setSearchTerm(event.target.value); setCurrentPage(1); }} placeholder="Rechercher par référence, titre ou description" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none" />
					</label>
				<label htmlFor="workOrders-sort" className="flex flex-col gap-1 text-sm text-slate-500"><span>Trier par</span>
				<select
					id="workOrders-sort"
					className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
					value={sortBy}
					onChange={(e) => {
						setSortBy(e.target.value as 'createdAtDesc' | 'createdAtAsc' | 'titleAsc' | 'titleDesc');
						setCurrentPage(1);
					}}
					disabled={futureOnly}
				>
					<option value="createdAtDesc">Date d&apos;ajout: plus récent</option>
					<option value="createdAtAsc">Date d&apos;ajout: plus ancien</option>
					<option value="titleAsc">Titre: A → Z</option>
					<option value="titleDesc">Titre: Z → A</option>
				</select>
				</label>

				<label htmlFor="workOrders-status" className="flex flex-col gap-1 text-sm text-slate-500"><span>Statut</span>
				<select
					id="workOrders-status"
					className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
					value={statusFilter}
					onChange={(e) => {
						setStatusFilter(e.target.value as 'ALL' | WorkOrderStatus);
						setCurrentPage(1);
					}}
				>
					<option value="ALL">Tous</option>
					<option value="DRAFT">Brouillon</option>
					<option value="PLANNED">Planifié</option>
					<option value="IN_PROGRESS">En cours</option>
					<option value="COMPLETED">Terminé</option>
					<option value="CANCELLED">Annulé</option>
				</select>
				</label>

				<label htmlFor="future-only" className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 sm:self-end">
				<input
					id="future-only"
					type="checkbox"
					checked={futureOnly}
					onChange={(e) => {
						setFutureOnly(e.target.checked);
						setCurrentPage(1);
					}}
					className="h-4 w-4 accent-indigo-600"
				/>
					<span>À venir</span>
				</label>

				<label htmlFor="workOrders-per-page" className="flex flex-col gap-1 text-sm text-slate-500"><span>Chantiers par page</span>
				<select
					id="workOrders-per-page"
					className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
					value={workOrdersPerPage}
					onChange={(e) => {
						setWorkOrdersPerPage(Number(e.target.value));
						setCurrentPage(1);
					}}
				>
					<option value={5}>5</option>
					<option value={10}>10</option>
					<option value={20}>20</option>
					<option value={50}>50</option>
				</select>
				</label>
				</div>
				<div className="flex flex-wrap gap-2" role="status" aria-label="Statistiques des chantiers">
					<span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">{workOrders.length} chantier{workOrders.length !== 1 ? 's' : ''}</span>
					{searchTerm && <button type="button" onClick={() => { setSearchTerm(''); setCurrentPage(1); }} className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Effacer la recherche</button>}
				</div>
			</div>

			{/* Desktop / tablet: dense workorder table */}
			<section className="hidden overflow-hidden border-y border-slate-200 bg-white sm:block">
				<div className="overflow-x-auto">
					<table className="w-full min-w-[760px] text-sm">
						<thead><tr className="border-b border-slate-200 bg-slate-50">
							<th scope="col" className="w-24 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"><span className="sr-only">Ouvrir</span></th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Chantier</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Statut</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Planning</th>
							<th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Étapes</th>
							{onDelete && <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>}
						</tr></thead>
						<tbody className="divide-y divide-slate-100">
							{currentWorkOrders.map((workOrder) => (
								<tr key={workOrder.id} className="transition hover:bg-slate-50">
									<td className="px-4 py-3"><button type="button" onClick={() => openWorkOrder(workOrder)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" aria-label={`Ouvrir le chantier ${workOrder.reference || workOrder.title}`}>Ouvrir</button></td>
									<td className="max-w-[18rem] px-4 py-3"><p className="truncate font-semibold text-slate-900">{workOrder.title}</p><p className="truncate text-sm text-slate-500">{workOrder.reference}</p></td>
									<td className="px-4 py-3"><span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{statusLabels[workOrder.status]}</span></td>
									<td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(workOrder.startDate)}{workOrder.endDate ? ` - ${formatDate(workOrder.endDate)}` : ''}</td>
									<td className="px-4 py-3 text-slate-600">{workOrder.items.length} étape{workOrder.items.length !== 1 ? 's' : ''}</td>
									{onDelete && <td className="px-4 py-3 text-right"><button type="button" onClick={() => setWorkOrderToDelete(workOrder)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2" aria-label={`Supprimer le chantier ${workOrder.reference || workOrder.title}`}>Supprimer</button></td>}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>

			{/* Mobile: stacked cards */}
			<section className="grid gap-3 sm:hidden">
				{currentWorkOrders.map((workOrder) => (
					<article
						key={workOrder.id}
						className="rounded-xl border border-slate-200 bg-white p-4"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0"><p className="truncate font-semibold text-slate-900">{workOrder.title}</p><p className="mt-0.5 truncate text-sm text-slate-600">{workOrder.reference}</p></div>
							<span className="shrink-0 rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">{statusLabels[workOrder.status]}</span>
						</div>
						<div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-sm text-slate-500"><span>{formatDate(workOrder.startDate)}</span><span>{workOrder.items.length} étape{workOrder.items.length !== 1 ? 's' : ''}</span></div>
						<div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => openWorkOrder(workOrder)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">Ouvrir</button>{onDelete && <button type="button" onClick={() => setWorkOrderToDelete(workOrder)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2">Supprimer</button>}</div>
					</article>
				))}
			</section>

			{sortedWorkOrders.length === 0 && (
				<p className="mt-4 text-sm text-slate-600">Aucun chantier à afficher.</p>
			)}

			{sortedWorkOrders.length > 0 && (
				<div className="mt-5 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination des chantiers">
					<button
						className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
						aria-label="Page précédente"
						onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
						disabled={effectiveCurrentPage === 1}
					>
						Précédent
					</button>

					{pageNumbers.map((pageNumber) => (
						<button
							key={pageNumber}
							className={`rounded-lg border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${pageNumber === effectiveCurrentPage ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700'}`}
							onClick={() => setCurrentPage(pageNumber)}
							aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
						>
							{pageNumber}
						</button>
					))}

					<button
						className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50"
						aria-label="Page suivante"
						onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
						disabled={effectiveCurrentPage === totalPages}
					>
						Suivant
					</button>
				</div>
			)}

			{workOrderToDelete && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4" role="presentation">
					<div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-workorder-title" aria-describedby="delete-workorder-description">
						<div className="flex items-start justify-between gap-4">
							<div><h2 id="delete-workorder-title" className="text-lg font-bold text-slate-900">Supprimer ce chantier ?</h2><p id="delete-workorder-description" className="mt-2 text-sm text-slate-600">Le chantier <strong>{workOrderToDelete.reference || workOrderToDelete.title}</strong> sera supprimé. Cette action est irréversible.</p></div>
							<button type="button" onClick={() => setWorkOrderToDelete(null)} aria-label="Fermer la confirmation" disabled={Boolean(deletingWorkOrderId)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"><X className="h-5 w-5" aria-hidden="true" /></button>
						</div>
						{deletionError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{deletionError}</p>}
						<div className="mt-6 flex justify-end gap-3"><button ref={deleteCancelRef} type="button" onClick={() => setWorkOrderToDelete(null)} disabled={Boolean(deletingWorkOrderId)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">Annuler</button><button type="button" onClick={() => void confirmDelete()} disabled={Boolean(deletingWorkOrderId)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:opacity-60">{deletingWorkOrderId ? 'Suppression...' : 'Supprimer définitivement'}</button></div>
					</div>
				</div>
			)}

			{showWorkOrderDetails && selectedWorkOrder && (
				<div
					className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/45 p-4 sm:items-center sm:p-6"
					role="presentation"
					onClick={() => {
						setShowWorkOrderDetails(false);
						setSelectedWorkOrder(null);
					}}
				>
					<WorkOrderDetails
						workOrder={selectedWorkOrder}
						onEdit={() => setShowEditWorkOrder(true)}
						onClose={() => {
							setShowWorkOrderDetails(false);
							setSelectedWorkOrder(null);
						}}
						onSelect={handleSelectedWorkOrder ? () => void handleSelectedWorkOrder(selectedWorkOrder) : undefined}
					/>
				</div>
			)}

			{showEditWorkOrder && selectedWorkOrder && (
				<div
					className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/40 p-4"
					onClick={() => setShowEditWorkOrder(false)}
				>
					<div
						className="w-full max-w-6xl rounded-lg bg-white p-5 shadow-xl"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h3 className="text-xl font-semibold text-zinc-900">Modifier le chantier</h3>
							<button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => setShowEditWorkOrder(false)}>
								Fermer
							</button>
						</div>
						<AddWorkOrderForm
							show={true}
							initialWorkOrder={selectedWorkOrder as WorkOrderEditInput}
							onCreated={() => undefined}
							onUpdated={(updatedWorkOrder) => {
								setSelectedWorkOrder(updatedWorkOrder);
								setShowEditWorkOrder(false);
							}}
						/>
					</div>
				</div>
			)}
		</>
	);
}
