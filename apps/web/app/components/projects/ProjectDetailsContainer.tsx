'use client';

import { useState } from 'react';
import type { Project } from '../AddProjectForm';
import ProjectDetailsBudget from './ProjectDetailsBudget';
import ProjectDetailsClients from './ProjectDetailsClients';
import ProjectDetailsDocuments from './ProjectDetailsDocuments';
import ProjectDetailsMainView from './ProjectDetailsMainView';
import ProjectDetailsPlanning from './ProjectDetailsPlanning';
import ProjectDetailsWorkOrders from './ProjectDetailsWorkOrders';

type ProjectDetailsTab = 'overview' | 'planning' | 'clients' | 'documents' | 'workOrders' | 'budget';

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
		overview: <ProjectDetailsMainView project={project} />,
		planning: <ProjectDetailsPlanning project={project} />,
		clients: <ProjectDetailsClients project={project} />,
		documents: <ProjectDetailsDocuments project={project} />,
		workOrders: <ProjectDetailsWorkOrders project={project} />,
		budget: <ProjectDetailsBudget project={project} />,
	}[activeTab];

	return (
		<div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-lg bg-white shadow-lg" onClick={(event) => event.stopPropagation()}>
			<div className="flex items-center gap-3 border-b border-zinc-200 px-5 py-4">
				<div className="min-w-0">
					<p className="text-sm text-zinc-500">{project.reference}</p>
					<h2 className="truncate text-xl font-semibold text-zinc-900">{project.title}</h2>
				</div>
				<button type="button" className="ml-auto rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100" onClick={onClose}>Fermer</button>
			</div>
			<div className="flex overflow-x-auto border-b border-zinc-200 px-3" role="tablist" aria-label="Détails du projet">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						type="button"
						role="tab"
						aria-selected={activeTab === tab.id}
						className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium ${activeTab === tab.id ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-900'}`}
						onClick={() => setActiveTab(tab.id)}
					>
						{tab.label}
					</button>
				))}
			</div>
			<div className="overflow-y-auto p-5" role="tabpanel">{content}</div>
		</div>
	);
}
