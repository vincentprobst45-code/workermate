import type { Project } from '../AddProjectForm';

type ProjectDetailsPlanningProps = {
	project: Project;
};

export default function ProjectDetailsPlanning({ project }: ProjectDetailsPlanningProps) {
	return (
		<div className="space-y-3">
			<h3 className="text-lg font-semibold text-zinc-900">Planning</h3>
			<p className="text-sm text-zinc-600">{project._count?.calendarEvents ?? 0} événement(s) planifié(s) pour ce projet.</p>
		</div>
	);
}
