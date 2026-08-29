'use client';

import { useEffect, useState } from 'react';
import type { WorkOrderStatus } from '@prisma/client';
import { useApiClient } from '../../api-client';
import type { Project } from '../AddProjectForm';
import type { ProjectDetailsTab } from './ProjectDetailsContainer';
import { CardHeader, ProjectStatusBadge, WorkOrderStatusBadge, alertError, cardClass } from './theme';

type ProjectDetailsMainViewProps = {
	project: Project;
	onNavigate: (tab: ProjectDetailsTab) => void;
};

type OverviewCustomer = {
	customerId: string;
	isPrimary: boolean;
	customer: {
		id: string;
		firstName?: string | null;
		lastName?: string | null;
		company?: string | null;
		email?: string | null;
		phone?: string | null;
	};
};

type OverviewWorkOrder = {
	id: string;
	reference: string;
	title: string;
	status: WorkOrderStatus;
	plannedStartDate?: string | null;
	plannedEndDate?: string | null;
};

type ProjectOverviewData = {
	customers: OverviewCustomer[];
	workOrders: OverviewWorkOrder[];
	quotes: unknown[];
	invoices: unknown[];
};

type ProjectCalendarEvent = {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	color?: string | null;
};

function customerLabel(customer: OverviewCustomer['customer']): string {
	return (
		[customer.firstName, customer.lastName]
			.filter((value): value is string => Boolean(value?.trim()))
			.map((value) => value.trim())
			.join(' ') ||
		customer.company?.trim() ||
		'Client'
	);
}

function initialsFor(customer: OverviewCustomer['customer']): string {
	return (customer.firstName?.trim().charAt(0) || customer.company?.trim().charAt(0) || '?').toUpperCase();
}

function formatDate(value?: string | null): string {
	if (!value) return '-';
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatEventRange(event: ProjectCalendarEvent): string {
	const start = new Date(event.startDate);
	const end = new Date(event.endDate);
	if (Number.isNaN(start.getTime())) return '-';
	const sameDay = !Number.isNaN(end.getTime()) && start.toDateString() === end.toDateString();
	const dateLabel = start.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
	const timeLabel = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
	if (sameDay) {
		return `${dateLabel} · ${timeLabel}`;
	}
	return `${dateLabel} → ${end.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`;
}

export default function ProjectDetailsMainView({ project, onNavigate }: ProjectDetailsMainViewProps) {
	const api = useApiClient();
	const [overview, setOverview] = useState<ProjectOverviewData | null>(null);
	const [overviewError, setOverviewError] = useState('');
	const [events, setEvents] = useState<ProjectCalendarEvent[]>([]);
	const [eventsLoading, setEventsLoading] = useState(true);
	const [eventsError, setEventsError] = useState('');

	useEffect(() => {
		let cancelled = false;

		async function loadOverview() {
			try {
				const response = await api.get(`/projects/${project.id}`);
				if (!response.ok) throw new Error('Erreur');
				const data: ProjectOverviewData = await response.json();
				if (!cancelled) {
					setOverview(data);
					setOverviewError('');
				}
			} catch {
				if (!cancelled) {
					setOverviewError('Erreur lors de la récupération des informations du projet.');
				}
			}
		}

		void loadOverview();

		return () => {
			cancelled = true;
		};
	}, [api, project.id]);

	useEffect(() => {
		let cancelled = false;

		async function loadEvents() {
			setEventsLoading(true);
			try {
				const response = await api.get(`/calendarevents?projectId=${encodeURIComponent(project.id)}`);
				if (!response.ok) throw new Error('Erreur');
				const data: ProjectCalendarEvent[] = await response.json();
				if (!cancelled) {
					setEvents(data);
					setEventsError('');
				}
			} catch {
				if (!cancelled) {
					setEvents([]);
					setEventsError('Erreur lors de la récupération du planning.');
				}
			} finally {
				if (!cancelled) {
					setEventsLoading(false);
				}
			}
		}

		void loadEvents();

		return () => {
			cancelled = true;
		};
	}, [api, project.id]);

	// Prefer the richer, freshly-fetched customer list (with email/phone) once available.
	const customers = overview?.customers ?? project.customers;
	const primaryLink = customers.find((link) => link.isPrimary) ?? customers[0] ?? null;
	const otherCustomersCount = Math.max(0, customers.length - (primaryLink ? 1 : 0));

	const workOrders = overview?.workOrders ?? [];
	const featuredWorkOrder =
		workOrders.find((workOrder) => workOrder.status === 'IN_PROGRESS') ??
		workOrders.find((workOrder) => workOrder.status === 'PLANNED') ??
		workOrders[0] ??
		null;
	const otherWorkOrdersCount = Math.max(0, workOrders.length - (featuredWorkOrder ? 1 : 0));

	const now = Date.now();
	const upcomingEvents = [...events]
		.filter((event) => new Date(event.endDate).getTime() >= now)
		.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
		.slice(0, 3);

	const quotesCount = project._count?.quotes ?? overview?.quotes.length ?? 0;
	const invoicesCount = project._count?.invoices ?? overview?.invoices.length ?? 0;

	return (
		<div className="space-y-4">
			<div className={cardClass}>
				<div className="flex flex-wrap items-center gap-2">
					<ProjectStatusBadge status={project.status} />
				</div>
				<p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
					{project.description || 'Aucune description pour ce projet.'}
				</p>
			</div>

			{overviewError && <div className={alertError}>{overviewError}</div>}

			<div className="grid gap-4 lg:grid-cols-2">
				<div className={cardClass}>
					<CardHeader title="Client principal" actionLabel="Voir les clients" onAction={() => onNavigate('clients')} />
					{primaryLink ? (
						<>
							<div className="flex items-center gap-3">
								<span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
									{initialsFor(primaryLink.customer)}
								</span>
								<div className="min-w-0">
									<p className="truncate font-semibold text-slate-900">{customerLabel(primaryLink.customer)}</p>
									{primaryLink.customer.company && (
										<p className="truncate text-xs text-slate-500">{primaryLink.customer.company}</p>
									)}
								</div>
							</div>
							<div className="mt-3 space-y-1 text-sm text-slate-600">
								{primaryLink.customer.email && <p className="truncate">{primaryLink.customer.email}</p>}
								{primaryLink.customer.phone && <p>{primaryLink.customer.phone}</p>}
								{!primaryLink.customer.email && !primaryLink.customer.phone && (
									<p className="text-slate-400">Aucune coordonnée renseignée.</p>
								)}
							</div>
							{otherCustomersCount > 0 && (
								<p className="mt-3 text-xs text-slate-400">
									+{otherCustomersCount} autre{otherCustomersCount > 1 ? 's' : ''} client{otherCustomersCount > 1 ? 's' : ''} associé{otherCustomersCount > 1 ? 's' : ''}
								</p>
							)}
						</>
					) : (
						<p className="text-sm text-slate-500">Aucun client associé à ce projet.</p>
					)}
				</div>

				<div className={cardClass}>
					<CardHeader title="Chantier principal" actionLabel="Voir les chantiers" onAction={() => onNavigate('workOrders')} />
					{featuredWorkOrder ? (
						<>
							<div className="flex items-start justify-between gap-2">
								<div className="min-w-0">
									<p className="text-xs text-slate-500">{featuredWorkOrder.reference}</p>
									<p className="truncate font-semibold text-slate-900">{featuredWorkOrder.title}</p>
								</div>
								<WorkOrderStatusBadge status={featuredWorkOrder.status} />
							</div>
							<p className="mt-3 text-sm text-slate-600">
								{formatDate(featuredWorkOrder.plannedStartDate)} → {formatDate(featuredWorkOrder.plannedEndDate)}
							</p>
							{otherWorkOrdersCount > 0 && (
								<p className="mt-3 text-xs text-slate-400">
									+{otherWorkOrdersCount} autre{otherWorkOrdersCount > 1 ? 's' : ''} chantier{otherWorkOrdersCount > 1 ? 's' : ''}
								</p>
							)}
						</>
					) : (
						<p className="text-sm text-slate-500">Aucun chantier associé à ce projet.</p>
					)}
				</div>
			</div>

			<div className={cardClass}>
				<CardHeader title="Planning" actionLabel="Voir tout le planning" onAction={() => onNavigate('planning')} />
				{eventsLoading && <p className="text-sm text-slate-500">Chargement...</p>}
				{eventsError && <div className={alertError}>{eventsError}</div>}
				{!eventsLoading && !eventsError && upcomingEvents.length === 0 && (
					<p className="text-sm text-slate-500">Aucun évènement à venir pour ce projet.</p>
				)}
				{!eventsLoading && upcomingEvents.length > 0 && (
					<ul className="divide-y divide-slate-100">
						{upcomingEvents.map((event) => (
							<li key={event.id} className="flex items-center gap-3 py-2 text-sm first:pt-0 last:pb-0">
								<span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: event.color || '#4f46e5' }} />
								<span className="min-w-0 flex-1 truncate font-medium text-slate-900">{event.title}</span>
								<span className="shrink-0 text-xs text-slate-500">{formatEventRange(event)}</span>
							</li>
						))}
					</ul>
				)}
			</div>

			<div className="grid gap-4 sm:grid-cols-2">
				<div className={cardClass}>
					<CardHeader title="Documents" actionLabel="Voir les documents" onAction={() => onNavigate('documents')} />
					<div className="flex gap-6 text-sm">
						<span><span className="text-lg font-bold text-slate-900">{quotesCount}</span> <span className="text-slate-500">devis</span></span>
						<span><span className="text-lg font-bold text-slate-900">{invoicesCount}</span> <span className="text-slate-500">factures</span></span>
					</div>
				</div>
				<div className={cardClass}>
					<CardHeader title="Budget" actionLabel="Voir le budget" onAction={() => onNavigate('budget')} />
					<p className="text-sm text-slate-500">Consultez la répartition prévue / réalisée du projet.</p>
				</div>
			</div>

			<div className={cardClass}>
				<CardHeader title="Notes internes" />
				<p className="whitespace-pre-wrap text-sm text-slate-600">{project.notes || 'Aucune note.'}</p>
			</div>
		</div>
	);
}
