import type { Project } from '../AddProjectForm';
import { CardHeader, cardClass } from './theme';

type ProjectDetailsClientsProps = {
	project: Project;
};

function customerLabel(customer: Project['customers'][number]['customer']): string {
	return [customer.firstName, customer.lastName, customer.company]
		.filter((value): value is string => Boolean(value?.trim()))
		.map((value) => value.trim())
		.join(' ') || customer.id;
}

function initialsFor(customer: Project['customers'][number]['customer']): string {
	return (customer.firstName?.trim().charAt(0) || customer.company?.trim().charAt(0) || '?').toUpperCase();
}

export default function ProjectDetailsClients({ project }: ProjectDetailsClientsProps) {
	return (
		<div className={cardClass}>
			<CardHeader title={`Clients (${project.customers.length})`} />
			{project.customers.length ? (
				<ul className="divide-y divide-slate-100">
					{project.customers.map((link) => (
						<li key={link.customerId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
							<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
								{initialsFor(link.customer)}
							</span>
							<span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-900">{customerLabel(link.customer)}</span>
							{link.isPrimary && (
								<span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">Principal</span>
							)}
						</li>
					))}
				</ul>
			) : (
				<p className="text-sm text-slate-500">Aucun client associé à ce projet.</p>
			)}
		</div>
	);
}
