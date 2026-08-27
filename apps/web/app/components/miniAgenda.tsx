'use client';

import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react';
import { useMemo, useState } from 'react';

export type MiniAgendaCalendarEvent = {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	color?: string | null;
	description?: string | null;
};

type MiniAgendaProps = {
	calendarEvents: MiniAgendaCalendarEvent[];
	title?: string;
	pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 5;

function formatEventDate(value: string): string {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return 'Date inconnue';
	}

	return date.toLocaleString('fr-FR', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	});
}

function getTime(value: string): number {
	const time = new Date(value).getTime();
	return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export default function MiniAgenda({
	calendarEvents,
	title = 'Prochains événements',
	pageSize = DEFAULT_PAGE_SIZE,
}: MiniAgendaProps) {
	const [currentPage, setCurrentPage] = useState(0);
	const safePageSize = Math.max(1, pageSize);

	const upcomingEvents = useMemo(
		() => [...calendarEvents].sort((first, second) => getTime(first.startDate) - getTime(second.startDate)),
		[calendarEvents],
	);
	const pageCount = Math.ceil(upcomingEvents.length / safePageSize);
	const visiblePage = Math.min(currentPage, Math.max(pageCount - 1, 0));
	const visibleEvents = upcomingEvents.slice(
		visiblePage * safePageSize,
		(visiblePage + 1) * safePageSize,
	);

	return (
		<section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby="mini-agenda-title">
			<div className="mb-4 flex items-center justify-between gap-3">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Agenda</p>
					<h2 id="mini-agenda-title" className="mt-1 text-lg font-semibold text-zinc-950">
						{title}
					</h2>
				</div>
				<div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-700" aria-hidden="true">
					<Clock3 size={17} />
				</div>
			</div>

			{visibleEvents.length === 0 ? (
				<div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
					Aucun événement à venir.
				</div>
			) : (
				<div className="space-y-2">
					{visibleEvents.map((event) => (
						<article key={event.id} className="flex gap-3 rounded-lg border border-zinc-200 px-3 py-3">
							<div
								className="mt-1 h-10 w-1 shrink-0 rounded-full"
								style={{ backgroundColor: event.color || '#18181b' }}
								aria-hidden="true"
							/>
							<div className="min-w-0">
								<h3 className="truncate text-sm font-semibold text-zinc-950">{event.title}</h3>
								<p className="mt-1 text-xs font-medium capitalize text-zinc-600">
									{formatEventDate(event.startDate)}
									{event.endDate && ` - ${formatEventDate(event.endDate)}`}
								</p>
								{event.description && (
									<p className="mt-1 truncate text-xs text-zinc-500">{event.description}</p>
								)}
							</div>
						</article>
					))}
				</div>
			)}

			{pageCount > 1 && (
				<nav className="mt-4 flex items-center justify-between border-t border-zinc-200 pt-3" aria-label="Pagination de l'agenda">
					<button
						type="button"
						className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={() => setCurrentPage((page) => Math.max(page - 1, 0))}
						disabled={visiblePage === 0}
						aria-label="Page précédente"
					>
						<ChevronLeft size={15} />
						Précédent
					</button>
					<span className="text-xs tabular-nums text-zinc-500">
						Page {visiblePage + 1} / {pageCount}
					</span>
					<button
						type="button"
						className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
						onClick={() => setCurrentPage((page) => Math.min(page + 1, pageCount - 1))}
						disabled={visiblePage === pageCount - 1}
						aria-label="Page suivante"
					>
						Suivant
						<ChevronRight size={15} />
					</button>
				</nav>
			)}
		</section>
	);
}