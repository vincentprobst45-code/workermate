import type { Project } from '../AddProjectForm';

type ProjectDetailsMainViewProps = {
	project: Project;
};

function statusLabel(status: Project['status']): string {
	const labels: Record<Project['status'], string> = {
		OPEN: 'Ouvert',
		IN_PROGRESS: 'En cours',
		COMPLETED: 'Terminé',
		CANCELLED: 'Annulé',
	};

	return labels[status];
}

export default function ProjectDetailsMainView({ project }: ProjectDetailsMainViewProps) {
	return (
		<div className="space-y-5">
			<div>
				<p className="text-sm text-zinc-500">{project.reference}</p>
				<h3 className="text-xl font-semibold text-zinc-900">{project.title}</h3>
				<p className="mt-2 text-sm text-zinc-600">{project.description || 'Aucune description.'}</p>
			</div>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div className="border border-zinc-200 bg-zinc-50 p-3 text-sm"><strong>Statut</strong><p className="mt-1 text-zinc-600">{statusLabel(project.status)}</p></div>
				<div className="border border-zinc-200 bg-zinc-50 p-3 text-sm"><strong>Clients</strong><p className="mt-1 text-zinc-600">{project.customers.length}</p></div>
				<div className="border border-zinc-200 bg-zinc-50 p-3 text-sm"><strong>Chantiers</strong><p className="mt-1 text-zinc-600">{project._count?.workOrders ?? 0}</p></div>
				<div className="border border-zinc-200 bg-zinc-50 p-3 text-sm"><strong>Documents</strong><p className="mt-1 text-zinc-600">{(project._count?.quotes ?? 0) + (project._count?.invoices ?? 0)}</p></div>
			</div>
			<div className="border border-zinc-200 p-4 text-sm">
				<h4 className="font-medium text-zinc-900">Notes</h4>
				<p className="mt-2 whitespace-pre-wrap text-zinc-600">{project.notes || 'Aucune note.'}</p>
			</div>
		</div>
	);
}
