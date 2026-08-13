import type { Project } from '../AddProjectForm';

type ProjectDetailsBudgetProps = {
	project: Project;
};

export default function ProjectDetailsBudget({ project }: ProjectDetailsBudgetProps) {
	return (
		<div className="space-y-3">
			<h3 className="text-lg font-semibold text-zinc-900">Budget</h3>
			<p className="text-sm text-zinc-600">Le suivi budgétaire sera calculé à partir des {project._count?.quotes ?? 0} devis et {project._count?.invoices ?? 0} factures associés.</p>
		</div>
	);
}
