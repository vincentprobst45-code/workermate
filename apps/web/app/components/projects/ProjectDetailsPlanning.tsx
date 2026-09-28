'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../../api-client';
import type { Project } from '../AddProjectForm';
import AddCalendarEventForm from '../AddCalendarEventForm';
import { CardHeader, alertError, btnPrimary, btnGhost, cardClass } from './theme';

type ProjectDetailsPlanningProps = {
	project: Project;
};

type ProjectCalendarEvent = {
	id: string;
	title: string;
	startDate: string;
	endDate: string;
	description?: string | null;
	notes?: string | null;
	color?: string | null;
};

function formatDate(value: string): string {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('fr-FR');
}

export default function ProjectDetailsPlanning({ project }: ProjectDetailsPlanningProps) {
	const api = useApiClient();
	const [events, setEvents] = useState<ProjectCalendarEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [showAddEventModal, setShowAddEventModal] = useState(false);
	const [reloadVersion, setReloadVersion] = useState(0);
	const [disassociatingEventId, setDisassociatingEventId] = useState<string | null>(null);

	useEffect(() => {
		if (!showAddEventModal) return;
		function handleKeyDown(event: KeyboardEvent) { if (event.key === 'Escape') setShowAddEventModal(false); }
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [showAddEventModal]);

	useEffect(() => {
		let cancelled = false;

		async function loadProjectEvents() {
			setLoading(true);
			try {
				const response = await api.get(`/calendarevents?projectId=${encodeURIComponent(project.id)}`);
				if (!response.ok) {
					throw new Error('Erreur');
				}

				const data: ProjectCalendarEvent[] = await response.json();
				if (!cancelled) {
					setEvents(data);
					setError('');
				}
			} catch {
				if (!cancelled) {
					setEvents([]);
					setError('Erreur lors de la récupération du planning du projet.');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void loadProjectEvents();

		return () => {
			cancelled = true;
		};
	}, [api, project.id, reloadVersion]);

	async function disassociateEvent(eventId: string) {
		if (!window.confirm('Retirer cet événement du projet ? L’événement ne sera pas supprimé.')) return;
		setDisassociatingEventId(eventId);
		setError('');
		try {
			const response = await api.delete(`/projects/${project.id}/calendar-events/${eventId}`);
			if (!response.ok) throw new Error('Erreur');
			setReloadVersion((current) => current + 1);
		} catch {
			setError('Impossible de désassocier l’événement du projet.');
		} finally {
			setDisassociatingEventId(null);
		}
	}

	return (
		<div className="space-y-4">
			<div className={cardClass}>
				<CardHeader title="Planning" />
				<button
					type="button"
					className={btnPrimary}
					onClick={() => setShowAddEventModal(true)}
				>
					Ajouter un évènement pour ce projet
				</button>
			</div>
			{loading && <p className="text-sm text-slate-500">Chargement du planning...</p>}
			{error && <div className={alertError}>{error}</div>}
			{!loading && !error && events.length === 0 && (
				<p className="text-sm text-slate-500">Aucun événement planifié pour ce projet.</p>
			)}
			{!loading && !error && events.length > 0 && (
				<div className="space-y-3">
					{events.map((event) => (
						<article key={event.id} className={cardClass}>
							<div className="flex items-start gap-3">
								<div className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: event.color || '#4f46e5' }} />
								<div className="min-w-0">
									<h4 className="font-semibold text-slate-900">{event.title}</h4>
									<p className="mt-1 text-sm text-slate-500">Du {formatDate(event.startDate)} au {formatDate(event.endDate)}</p>
									{event.description && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{event.description}</p>}
									{event.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-500">Notes: {event.notes}</p>}
									<button type="button" className={`${btnGhost} mt-3`} disabled={disassociatingEventId === event.id} onClick={() => void disassociateEvent(event.id)}>
										{disassociatingEventId === event.id ? 'Retrait...' : 'Retirer du projet'}
									</button>
								</div>
							</div>
						</article>
					))}
				</div>
			)}

			{showAddEventModal && (
				<div
					className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
					onClick={() => setShowAddEventModal(false)}
				>
					<div
						className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
						role="dialog" aria-modal="true" aria-labelledby="add-event-title"
						onClick={(event) => event.stopPropagation()}
					>
						<div className="mb-4 flex items-center justify-between gap-3">
							<h4 id="add-event-title" className="text-lg font-semibold text-slate-900">Ajouter un évènement pour ce projet</h4>
							<button type="button" className={btnGhost} onClick={() => setShowAddEventModal(false)}>
								Fermer
							</button>
						</div>
						<AddCalendarEventForm
							projectid={project.id}
							onCreated={() => {
								setShowAddEventModal(false);
								setReloadVersion((current) => current + 1);
							}}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
