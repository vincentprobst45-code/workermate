import type { Project } from '../AddProjectForm';

type ProjectDetailsClientsProps = {
	project: Project;
};

function customerLabel(customer: Project['customers'][number]['customer']): string {
	return [customer.firstName, customer.lastName, customer.company]
		.filter((value): value is string => Boolean(value?.trim()))
		.map((value) => value.trim())
		.join(' ') || customer.id;
}

export default function ProjectDetailsClients({ project }: ProjectDetailsClientsProps) {
	return (
		<div className="space-y-3">
			<h3 className="text-lg font-semibold text-zinc-900">Clients</h3>
			{project.customers.length ? (
				<ul className="divide-y divide-zinc-200 border border-zinc-200">
					{project.customers.map((link) => (
						<li key={link.customerId} className="flex items-center justify-between gap-3 p-3 text-sm">
							<span>{customerLabel(link.customer)}</span>
							{link.isPrimary && <span className="text-zinc-500">Principal</span>}
						</li>
					))}
				</ul>
			) : <p className="text-sm text-zinc-600">Aucun client associé à ce projet.</p>}
		</div>
	);
}
