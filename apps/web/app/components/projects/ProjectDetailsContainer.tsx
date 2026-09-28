'use client';

import { useEffect, useState } from 'react';
import type { Project } from '../AddProjectForm';
import ProjectDetailsBudget from './ProjectDetailsBudget';
import ProjectDetailsClients from './ProjectDetailsClients';
import ProjectDetailsDocuments from './ProjectDetailsDocuments';
import ProjectDetailsMainView from './ProjectDetailsMainView';
import ProjectDetailsPlanning from './ProjectDetailsPlanning';
import ProjectDetailsWorkOrders from './ProjectDetailsWorkOrders';
import ProjectProfitabilitySynthesis from '../ProjectProfitabilitySynthesis';
import ProjectAssociationModals from './ProjectAssociationModals';
import { ProjectStatusBadge } from './theme';

type ProjectDetailsTab = 'overview' | 'planning' | 'clients' | 'documents' | 'workOrders' | 'budget' | 'profitability';
export type { ProjectDetailsTab };

type ProjectDetailsContainerProps = {
	project: Project;
	onClose?: () => void;
};

const tabs: Array<{ id: ProjectDetailsTab; label: string; count?: (project: Project) => number | undefined }> = [
	{ id: 'overview', label: 'Vue d’ensemble' },
	{ id: 'planning', label: 'Planning', count: (project) => project._count?.calendarEvents },
	{ id: 'clients', label: 'Clients', count: (project) => project.customers.length },
	{ id: 'documents', label: 'Documents', count: (project) => (project._count?.quotes ?? 0) + (project._count?.invoices ?? 0) },
	{ id: 'workOrders', label: 'Chantiers', count: (project) => project._count?.workOrders },
	{ id: 'budget', label: 'Budget' },
	{ id: 'profitability', label: 'Rentabilité' },
];

function tabFromUrl(): ProjectDetailsTab {
	const value = new URLSearchParams(window.location.search).get('tab');
	return tabs.some((tab) => tab.id === value) ? value as ProjectDetailsTab : 'overview';
}

export default function ProjectDetailsContainer({ project, onClose }: ProjectDetailsContainerProps) {
	const [associationModal, setAssociationModal] = useState<{ kind: 'customer' | 'workOrder' | 'quote' | 'invoice'; mode: 'existing' | 'new' } | null>(null);
	const [refreshVersion, setRefreshVersion] = useState(0);
	const [activeTab, setActiveTab] = useState<ProjectDetailsTab>(() => typeof window === 'undefined' ? 'overview' : tabFromUrl());

	useEffect(() => {
		function syncTab() { setActiveTab(tabFromUrl()); }
		window.addEventListener('popstate', syncTab);
		return () => window.removeEventListener('popstate', syncTab);
	}, []);

	function navigateToTab(tab: ProjectDetailsTab) {
		const url = new URL(window.location.href);
		url.searchParams.set('tab', tab);
		window.history.pushState({}, '', `${url.pathname}${url.search}${url.hash}`);
		setActiveTab(tab);
	}

	function openAssociationModal(kind: 'customer' | 'workOrder' | 'quote' | 'invoice', mode: 'existing' | 'new') {
		setAssociationModal({ kind, mode });
	}

	const content = {
		overview: <ProjectDetailsMainView project={project} onNavigate={navigateToTab} onRequestAssociateCustomer={() => openAssociationModal('customer', 'existing')} onRequestCreateCustomer={() => openAssociationModal('customer', 'new')} onRequestAssociateWorkOrder={() => openAssociationModal('workOrder', 'existing')} onRequestCreateWorkOrder={() => openAssociationModal('workOrder', 'new')} onRequestAssociateQuote={() => openAssociationModal('quote', 'existing')} onRequestCreateQuote={() => openAssociationModal('quote', 'new')} onRequestAssociateInvoice={() => openAssociationModal('invoice', 'existing')} onRequestCreateInvoice={() => openAssociationModal('invoice', 'new')} refreshVersion={refreshVersion} />,
		planning: <ProjectDetailsPlanning project={project} />,
		clients: <ProjectDetailsClients key={refreshVersion} project={project} onRequestAssociate={() => openAssociationModal('customer', 'existing')} onRequestCreate={() => openAssociationModal('customer', 'new')} onChanged={() => setRefreshVersion((current) => current + 1)} />,
		documents: <ProjectDetailsDocuments key={refreshVersion} project={project} onRequestAssociateQuote={() => openAssociationModal('quote', 'existing')} onRequestCreateQuote={() => openAssociationModal('quote', 'new')} onRequestAssociateInvoice={() => openAssociationModal('invoice', 'existing')} onRequestCreateInvoice={() => openAssociationModal('invoice', 'new')} onChanged={() => setRefreshVersion((current) => current + 1)} />,
		workOrders: <ProjectDetailsWorkOrders key={refreshVersion} project={project} onRequestAssociate={() => openAssociationModal('workOrder', 'existing')} onRequestCreate={() => openAssociationModal('workOrder', 'new')} onChanged={() => setRefreshVersion((current) => current + 1)} />,
		budget: <ProjectDetailsBudget key={refreshVersion} project={project} />,
		profitability: <ProjectProfitabilitySynthesis projectId={project.id} />,
	}[activeTab];

	return (
		<div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
			<div className="border-b border-slate-200 px-3 py-3 sm:px-6 sm:py-4">
				<div className="flex items-center gap-3">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-700">{project.reference}</p>
						<ProjectStatusBadge status={project.status} />
					</div>
					<h2 className="mt-1 truncate text-xl font-bold text-slate-900">{project.title}</h2>
				</div>
				{onClose && (
					<button
						type="button"
						className="ml-auto shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
						onClick={onClose}
					>
						Fermer
					</button>
				)}
				</div>
			</div>
			<div className="flex overflow-x-auto border-b border-slate-200 px-2 [scrollbar-width:none] sm:px-3 [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Détails du projet">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						id={`project-tab-${tab.id}`}
						aria-selected={activeTab === tab.id}
						aria-controls={`project-panel-${tab.id}`}
						className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
						onClick={() => navigateToTab(tab.id)}
					>
						{tab.label}{tab.count ? <span className="ml-1 text-xs opacity-70">({tab.count(project) ?? 0})</span> : null}
					</button>
				))}
			</div>
			<div id={`project-panel-${activeTab}`} className="bg-slate-50 p-3 sm:p-6" role="tabpanel" aria-labelledby={`project-tab-${activeTab}`}>{content}</div>
			<ProjectAssociationModals
				project={project}
				kind={associationModal?.kind ?? null}
				mode={associationModal?.mode ?? 'existing'}
				onClose={() => setAssociationModal(null)}
				onChanged={() => setRefreshVersion((current) => current + 1)}
			/>
		</div>
	);
}
