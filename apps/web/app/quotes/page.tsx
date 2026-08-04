'use client';

import { useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import AddQuoteForm from '../components/AddQuoteForm';
import QuotesList, { type Quote } from '../components/QuotesList';
import { ProtectedRoute } from '../protected-route';

export default function QuotesPage() {
	const api = useApiClient();
	const [quotes, setQuotes] = useState<Quote[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showAddQuoteForm, setShowAddQuoteForm] = useState(false);
	const [quoteFormWasOpened, setQuoteFormWasOpened] = useState(false);

	async function handleDelete(id: string) {
		if (!confirm('Confirmer la suppression?')) {
			return;
		}

		try {
			const res = await api.delete(`/quotes/${id}`);
			if (!res.ok) {
				throw new Error('Erreur');
			}

			setQuotes((currentQuotes) => currentQuotes.filter((quote) => quote.id !== id));
			setError('');
			setSuccess('Devis supprime avec succes');
		} catch {
			setError('Erreur lors de la suppression');
		}
	}

	useEffect(() => {
		let cancelled = false;

		const loadQuotes = async () => {
			try {
				const res = await api.get('/quotes');
				if (!res.ok) {
					throw new Error('Erreur');
				}

				const data = await res.json();
				if (!cancelled) {
					setQuotes(data);
				}
			} catch {
				if (!cancelled) {
					setError('Erreur lors de la recuperation des devis');
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		};

		void loadQuotes();

		return () => {
			cancelled = true;
		};
	}, [api]);

	return (
		<ProtectedRoute>
			<main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
				<h2 className="mb-6 text-2xl font-semibold">Gestion des Devis</h2>

				{error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
				{success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

				<button
					className="mx-4 my-2 rounded-sm border-2 border-double border-gray-700 bg-blue-400 px-3 py-2 text-xl text-white shadow-md hover:bg-blue-600 active:bg-blue-900"
					onClick={() => {
						setShowAddQuoteForm(!showAddQuoteForm);
						setQuoteFormWasOpened(true);
					}}
				>
					{showAddQuoteForm
						? 'Fermer'
						: quoteFormWasOpened
							? 'Ouvrir'
							: 'Ajouter un devis'}
				</button>

				{quoteFormWasOpened && (
					<button
						className="float-right mx-4 my-2 rounded-sm border-2 border-double border-gray-700 bg-red-400 px-3 py-2 text-xl text-white shadow-md hover:bg-red-600 active:bg-red-900"
						onClick={() => {
							setShowAddQuoteForm(false);
							setQuoteFormWasOpened(false);
						}}
					>
						Effacer le formulaire
					</button>
				)}

				{quoteFormWasOpened && (
					<div>
						{!showAddQuoteForm && (
							<button
								onClick={() => setShowAddQuoteForm(true)}
								className="pointer border-2 p-2 text-center"
							>
								Formulaire en pause...
							</button>
						)}

						<AddQuoteForm
							show={showAddQuoteForm}
							onCreated={(data) => {
								setQuotes((currentQuotes) => [data, ...currentQuotes]);
								setError('');
								setSuccess('Devis ajoute avec succes');
							}}
						/>
					</div>
				)}

				{loading ? (
					<p>Chargement...</p>
				) : (
					<QuotesList quotes={quotes} onDelete={handleDelete} />
				)}
			</main>
		</ProtectedRoute>
	);
}
