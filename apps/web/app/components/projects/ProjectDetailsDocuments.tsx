import type { Project } from '../AddProjectForm';

type ProjectDetailsDocumentsProps = {
	project: Project;
};

export default function ProjectDetailsDocuments({ project }: ProjectDetailsDocumentsProps) {
	return (
		<div className="space-y-3">
			<h3 className="text-lg font-semibold text-zinc-900">Documents</h3>
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="border border-zinc-200 bg-zinc-50 p-4 text-sm"><strong>Devis</strong><p className="mt-1 text-zinc-600">{project._count?.quotes ?? 0}</p></div>
				<div className="border border-zinc-200 bg-zinc-50 p-4 text-sm"><strong>Factures</strong><p className="mt-1 text-zinc-600">{project._count?.invoices ?? 0}</p></div>
			</div>
		</div>
	);
}
