'use client';

import { useState } from 'react';
import type { Project } from '../AddProjectForm';
import ProjectDetailsBudget from './ProjectDetailsBudget';
import ProjectDetailsClients from './ProjectDetailsClients';
import ProjectDetailsDocuments from './ProjectDetailsDocuments';
import ProjectDetailsMainView from './ProjectDetailsMainView';
import ProjectDetailsPlanning from './ProjectDetailsPlanning';
import ProjectDetailsWorkOrders from './ProjectDetailsWorkOrders';
import { ProjectStatusBadge } from './theme';

type ProjectDetailsTab = 'overview' | 'planning' | 'clients' | 'documents' | 'workOrders' | 'budget';
export type { ProjectDetailsTab };

type ProjectDetailsContainerProps = {
	project: Project;
	onClose: () => void;
};

const tabs: Array<{ id: ProjectDetailsTab; label: string }> = [
	{ id: 'overview', label: 'Vue d’ensemble' },
	{ id: 'planning', label: 'Planning' },
	{ id: 'clients', label: 'Clients' },
	{ id: 'documents', label: 'Documents' },
	{ id: 'workOrders', label: 'Chantiers' },
	{ id: 'budget', label: 'Budget' },
];

export default function ProjectDetailsContainer({ project, onClose }: ProjectDetailsContainerProps) {
	const [activeTab, setActiveTab] = useState<ProjectDetailsTab>('overview');

	const content = {
		overview: <ProjectDetailsMainView project={project} onNavigate={setActiveTab} />,
		planning: <ProjectDetailsPlanning project={project} />,
		clients: <ProjectDetailsClients project={project} />,
		documents: <ProjectDetailsDocuments project={project} />,
		workOrders: <ProjectDetailsWorkOrders project={project} />,
		budget: <ProjectDetailsBudget project={project} />,
	}[activeTab];

	return (
		<div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
			<div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
				<div className="min-w-0">
					<div className="flex flex-wrap items-center gap-2">
						<p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-700">{project.reference}</p>
						<ProjectStatusBadge status={project.status} />
					</div>
					<h2 className="mt-1 truncate text-xl font-bold text-slate-900">{project.title}</h2>
				</div>
				<button
					type="button"
					className="ml-auto shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
					onClick={onClose}
				>
					Fermer
				</button>
			</div>
			<div className="flex overflow-x-auto border-b border-slate-200 px-3" role="tablist" aria-label="Détails du projet">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${activeTab === tab.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className="overflow-y-auto bg-slate-50 p-5 sm:p-6" role="tabpanel">{content}</div>
		</div>
	);
}
