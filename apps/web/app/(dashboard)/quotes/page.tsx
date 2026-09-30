'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth.context';
import { useApiClient } from '../../api-client';
import AddQuoteForm from '../../components/AddQuoteForm';
import QuotesList, { type Quote } from '../../components/QuotesList';
import QuotesRequiringDeposit, { type DepositQuote } from '../../components/QuotesRequiringDeposit';
import AddDepositForm from '../../components/AddDepositForm';
import { ProtectedRoute } from '../../protected-route';

export default function QuotesPage() {
	const searchParams = useSearchParams();
	const { activeTenant } = useAuth();
	const api = useApiClient();
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showAddQuoteForm, setShowAddQuoteForm] = useState(false);
	const [quoteFormWasOpened, setQuoteFormWasOpened] = useState(false);
	const [showDepositQuotes, setShowDepositQuotes] = useState(false);
	const [depositQuote, setDepositQuote] = useState<DepositQuote | null>(null);
	const queryClient = useQueryClient();
	const quotesQueryKey = ['quotes', activeTenant?.tenantId];
	const dashboardQueryKey = ['dashboard', activeTenant?.tenantId];
	const invoicesQueryKey = ['invoices', activeTenant?.tenantId];
	const quotesQuery = useQuery({
		queryKey: quotesQueryKey,
		enabled: Boolean(activeTenant?.tenantId),
		queryFn: async () => {
			const response = await api.get('/quotes');
			if (!response.ok) throw new Error('Erreur lors de la rÃ©cupÃ©ration des devis');
			return await response.json() as Quote[];
		},
	});
	const quotes = quotesQuery.data ?? [];
	const loading = quotesQuery.isPending;
	const deleteQuoteMutation = useMutation({
		mutationFn: async (id: string) => {
			const response = await api.delete(`/quotes/${id}`);
			if (!response.ok) throw new Error('La suppression du devis a Ã©chouÃ©.');
			return id;
		},
		onSuccess: (id) => {
			queryClient.setQueryData<Quote[]>(quotesQueryKey, (currentQuotes) => currentQuotes?.filter((quote) => quote.id !== id));
			void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
			setError('');
			setSuccess('Devis supprimÃ© avec succÃ¨s');
		},
		onError: () => setError('La suppression du devis a Ã©chouÃ©. VÃ©rifiez votre connexion et rÃ©essayez.'),
	});

	function updateCreateUrl(open: boolean, replace = false) {
		const url = new URL(window.location.href);
		if (open) url.searchParams.set('create', 'quote');
		else url.searchParams.delete('create');
		window.history[replace ? 'replaceState' : 'pushState']({}, '', url.toString());
	}

	useEffect(() => {
		function syncCreateForm() {
			const open = new URLSearchParams(window.location.search).get('create') === 'quote';
			setShowAddQuoteForm(open);
			setQuoteFormWasOpened(open);
		}
		syncCreateForm();
		window.addEventListener('popstate', syncCreateForm);
		return () => window.removeEventListener('popstate', syncCreateForm);
	}, []);

	async function handleDelete(id: string) {
		await deleteQuoteMutation.mutateAsync(id);
	}

	async function handleSendEmail(id: string) {
		setError('');
		setSuccess('');
		try {
			const response = await api.post(`/quotes/${id}/send-email`);
			if (!response.ok) throw new Error('Erreur lors de lâ€™envoi du devis.');
			setSuccess('Devis envoyÃ© par email.');
		} catch {
			setError('Impossible dâ€™envoyer le devis. VÃ©rifiez lâ€™email du client et la configuration Resend.');
		}
	}

	return (
		<ProtectedRoute>
				<main className="mx-auto w-full max-w-[1600px] px-5 py-8 sm:px-6">
				<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Ventes</p>
						<h2 className="mt-1 text-2xl font-bold text-slate-900">Gestion des devis</h2>
						<p className="mt-1 text-sm text-slate-500">{quotes.length} devis au total</p>
					</div>
					<div className="flex flex-wrap gap-2">
						<button type="button" className="rounded-lg border border-indigo-200 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50" onClick={() => setShowDepositQuotes(true)}>Enregistrer un acompte reÃ§u</button>
						<button type="button" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" onClick={() => { setShowAddQuoteForm(!showAddQuoteForm); setQuoteFormWasOpened(true); updateCreateUrl(!showAddQuoteForm); }}>
							{showAddQuoteForm ? 'Fermer le formulaire' : quoteFormWasOpened ? 'Reprendre le formulaire' : 'Nouveau devis'}
						</button>
					</div>
				</div>

				{(error || quotesQuery.isError) && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error || 'Erreur lors de la rÃ©cupÃ©ration des devis'}</div>}
				{success && <div role="status" className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{success}</div>}

				{showDepositQuotes && <QuotesRequiringDeposit onClose={() => setShowDepositQuotes(false)} onSelect={(quote) => { setDepositQuote(quote); setShowDepositQuotes(false); }} />}
				{depositQuote && <AddDepositForm quote={depositQuote} onClose={() => setDepositQuote(null)} onSaved={() => { void Promise.all([queryClient.invalidateQueries({ queryKey: quotesQueryKey }), queryClient.invalidateQueries({ queryKey: invoicesQueryKey }), queryClient.invalidateQueries({ queryKey: dashboardQueryKey })]); setDepositQuote(null); setSuccess('Acompte enregistrÃ© et paiement associÃ© Ã  la facture dâ€™acompte.'); }} />}

				{quoteFormWasOpened && (
					<button
						type="button"
						className="mb-4 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
						onClick={() => {
							setShowAddQuoteForm(false);
							setQuoteFormWasOpened(false);
							updateCreateUrl(false, true);
						}}
					>
						RÃ©initialiser le formulaire
					</button>
				)}

				{quoteFormWasOpened && (
					<div>
						{!showAddQuoteForm && (
							<button
								type="button"
								onClick={() => setShowAddQuoteForm(true)}
								className="mb-4 rounded-lg border border-dashed border-indigo-300 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
							>
								Formulaire en pause. Reprendre
							</button>
						)}

						<AddQuoteForm
							show={showAddQuoteForm}
							onCreated={(data) => {
								queryClient.setQueryData<Quote[]>(quotesQueryKey, (currentQuotes) => [data, ...(currentQuotes ?? [])]);
								void queryClient.invalidateQueries({ queryKey: dashboardQueryKey });
								setError('');
								setSuccess('Devis ajoute avec succes');
								updateCreateUrl(false, true);
							}}
						/>
					</div>
				)}

				{loading ? (
					<div className="space-y-3" aria-label="Chargement des devis" role="status">
						<div className="h-10 animate-pulse rounded-lg bg-slate-100" />
						<div className="h-56 animate-pulse rounded-xl bg-slate-100" />
						<p className="text-sm text-slate-500">Chargement des devis...</p>
					</div>
				) : (
										<QuotesList quotes={quotes} onDelete={handleDelete} onSendEmail={handleSendEmail} initialQuoteId={searchParams.get('quote') || undefined} initialQuoteMode={searchParams.get('edit') === '1' ? 'edit' : 'view'} syncUrl />
				)}
			</main>
		</ProtectedRoute>
	);
}
