import type { Project } from '../AddProjectForm';

type ProjectDetailsWorkOrdersProps = {
	project: Project;
};

export default function ProjectDetailsWorkOrders({ project }: ProjectDetailsWorkOrdersProps) {
	return (
		<div className="space-y-3">
			<h3 className="text-lg font-semibold text-zinc-900">Chantiers</h3>
			<p className="text-sm text-zinc-600">{project._count?.workOrders ?? 0} chantier(s) associé(s) à ce projet.</p>
		</div>
	);
}
