'use client';

import { useState } from 'react';
import { WorkOrderItemType, WorkOrderStatus } from '@prisma/client';
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
	status: WorkOrderStatus;
	items: WorkOrderItem[];
	customerId?: string;
	addressId?: string;
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
	const now = new Date();

	const filteredWorkOrders = workOrders.filter((workOrder) => {
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
	});

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


	return (
		<>
			<div className="mb-4 flex flex-wrap justify-end items-center gap-2">
				<label htmlFor="workOrders-sort" className="text-sm text-slate-700">
					Trier
				</label>
				<select
					id="workOrders-sort"
					className="border px-2 py-1 rounded bg-white"
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

				<label htmlFor="workOrders-status" className="text-sm text-slate-700">
					Statut
				</label>
				<select
					id="workOrders-status"
					className="border px-2 py-1 rounded bg-white"
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

				<label htmlFor="future-only" className="text-sm text-slate-700">
					Chantiers futurs
				</label>
				<input
					id="future-only"
					type="checkbox"
					checked={futureOnly}
					onChange={(e) => {
						setFutureOnly(e.target.checked);
						setCurrentPage(1);
					}}
					className="h-4 w-4"
				/>

				<label htmlFor="workOrders-per-page" className="text-sm text-slate-700">
					Projets par page
				</label>
				<select
					id="workOrders-per-page"
					className="border px-2 py-1 rounded bg-white"
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
			</div>

			<div className="grid gap-4">
				{currentWorkOrders.map((workOrder) => (
					<div
						key={workOrder.id}
						className="hover:bg-gray-100 active:bg-gray-400 p-4 bg-white rounded-lg shadow flex justify-between items-center border-2 border-gray-700"
						onClick={() => {
              				if(handleSelectedWorkOrder){
              				    void handleSelectedWorkOrder(workOrder);
              				} else {
              				  setShowWorkOrderDetails(true);
              				  setSelectedWorkOrder(workOrder);
              				}
						}}
					>
						<div>
							<p className="font-semibold">{workOrder.title}</p>
							{workOrder.description && <p className="text-sm text-slate-600">{workOrder.description}</p>}
						</div>
                        {onDelete &&
						<button
							onClick={(e) => {
								e.stopPropagation();
								onDelete?.(workOrder.id);
							}}
							className="text-red-600 hover:text-red-800"
						>
							Supprimer
						</button>
                        }
					</div>
				))}
			</div>

			{sortedWorkOrders.length === 0 && (
				<p className="mt-4 text-sm text-slate-600">Aucun chantier à afficher.</p>
			)}

			{sortedWorkOrders.length > 0 && (
				<div className="mt-5 flex flex-wrap items-center justify-center gap-2">
					<button
						className="border px-3 py-1 rounded disabled:opacity-50"
						onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
						disabled={effectiveCurrentPage === 1}
					>
						Précédent
					</button>

					{pageNumbers.map((pageNumber) => (
						<button
							key={pageNumber}
							className={`border px-3 py-1 rounded ${pageNumber === effectiveCurrentPage ? 'bg-slate-900 text-white' : 'bg-white'}`}
							onClick={() => setCurrentPage(pageNumber)}
							aria-current={pageNumber === effectiveCurrentPage ? 'page' : undefined}
						>
							{pageNumber}
						</button>
					))}

					<button
						className="border px-3 py-1 rounded disabled:opacity-50"
						onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
						disabled={effectiveCurrentPage === totalPages}
					>
						Suivant
					</button>
				</div>
			)}

			{showWorkOrderDetails && selectedWorkOrder && (
				<div
					className="fixed inset-0 bg-black/40 flex items-center justify-center z-9"
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
