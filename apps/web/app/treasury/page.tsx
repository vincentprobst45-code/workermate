'use client';

import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { ProtectedRoute } from '../protected-route';
import { useApiClient } from '../api-client';
import AddBankAccountForm, { type PaymentAccount } from '../components/AddBankAccountForm';
import AddBankTransactionForm, { type BankTransaction } from '../components/AddBankTransactionForm';
import AddCompanyExpenseForm, { type CompanyExpense } from '../components/AddCompanyExpenseForm';
import BankAccountDetails from '../components/BankAccountDetails';
import BankAccountsList from '../components/BankAccountsList';
import ForecastBudgetGraph, { type ForecastPoint } from '../components/ForecastBudgetGraph';

interface TreasuryAlert { code: string; title: string; message: string; }
interface Reconciliation { id: string; paymentAccountId: string; calculatedBalance: number | string; actualBalance: number | string; difference: number | string; reconciledAt: string; previousReconciliationDate?: string | null; paymentAccount?: { name: string; currency: string }; }
interface Transfer { id: string; amount: number | string; currency: string; transferDate: string; fromAccount?: { name: string }; toAccount?: { name: string }; }
type PaymentTiming = 'GENERATION' | 'DUE_DATE' | 'ARBITRARY_DAYS';

function formatMoney(value: number | string, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

export default function TreasuryPage() {
  const api = useApiClient();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [alerts, setAlerts] = useState<TreasuryAlert[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<'account' | 'expense' | 'transaction' | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | undefined>();
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'CREDIT' | 'DEBIT'>('all');
  const [showReconciliation, setShowReconciliation] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [reconciliationAccountId, setReconciliationAccountId] = useState('');
  const [actualBalance, setActualBalance] = useState('');
  const [transferForm, setTransferForm] = useState({ fromAccountId: '', toAccountId: '', amount: '' });
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);
  const [forecastHorizon, setForecastHorizon] = useState('90');
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('DUE_DATE');
  const [paymentDelayDays, setPaymentDelayDays] = useState('0');
  const [forecastReason, setForecastReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const responses = await Promise.all([
          api.get('/payment-accounts'), api.get('/company-expenses'), api.get('/bank-transactions'),
          api.get('/treasury/alerts'), api.get('/treasury/reconciliations'), api.get('/treasury/transfers'),
          api.get(`/treasury/forecast?horizonDays=${forecastHorizon}&paymentTiming=${paymentTiming}&paymentDelayDays=${paymentDelayDays}`),
        ]);
        if (responses.slice(0, 3).some((response) => !response.ok)) throw new Error('load');
        if (!cancelled) {
          setAccounts(await responses[0].json());
          setExpenses(await responses[1].json());
          setTransactions(await responses[2].json());
          if (responses[3].ok) setAlerts(await responses[3].json());
          if (responses[4].ok) setReconciliations(await responses[4].json());
          if (responses[5].ok) setTransfers(await responses[5].json());
          if (responses[6].ok) {
            const forecast = await responses[6].json();
            setForecastPoints(forecast.points || []);
            setForecastReason(forecast.diagnostics?.message || '');
          } else {
            const responseBody = await responses[6].json().catch(() => null) as { message?: string | string[] } | null;
            const message = Array.isArray(responseBody?.message) ? responseBody.message.join(' ') : responseBody?.message;
            setForecastPoints([]);
            setForecastReason(message || `Le serveur a refusé la projection (${responses[6].status}).`);
          }
        }
      } catch { if (!cancelled) setError('Impossible de charger les données de trésorerie.'); }
      finally { if (!cancelled) setLoading(false); }
    }
    void load();
    return () => { cancelled = true; };
  }, [api, forecastHorizon, paymentTiming, paymentDelayDays]);

  const activeAccounts = accounts.filter((account) => !account.archivedAt);
  const accountBalances = activeAccounts.map((account) => {
    const openingDate = account.openingBalanceDate ? new Date(account.openingBalanceDate).getTime() : Number.NEGATIVE_INFINITY;
    const movement = transactions.filter((transaction) => transaction.paymentAccountId === account.id && new Date(transaction.transactionDate).getTime() >= openingDate).reduce((total, transaction) => total + (transaction.direction === 'DEBIT' ? -1 : 1) * Number(transaction.amount || 0), 0);
    return { ...account, balance: Number(account.openingBalance || 0) + movement };
  });
  const balancesByCurrency = accountBalances.reduce<Record<string, number>>((totals, account) => ({ ...totals, [account.currency]: (totals[account.currency] || 0) + account.balance }), {});
  const dueExpenses = expenses.filter((expense) => !expense.paidAt).reduce((total, expense) => total + Number(expense.taxInclusiveAmount || 0), 0);
  const filteredTransactions = transactions.filter((transaction) => {
    const text = `${transaction.label || ''} ${transaction.reference || ''} ${transaction.externalId || ''}`.toLowerCase();
    return (accountFilter === 'all' || transaction.paymentAccountId === accountFilter) && (directionFilter === 'all' || transaction.direction === directionFilter) && (!search.trim() || text.includes(search.trim().toLowerCase()));
  });

  async function deleteAccount(account: PaymentAccount) {
    const response = await api.delete(`/payment-accounts/${account.id}`);
    if (!response.ok) throw new Error('delete');
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, archivedAt: new Date().toISOString() } : item));
  }

  function exportTransactions() {
    const header = ['Date', 'Compte', 'Libelle', 'Direction', 'Montant', 'Devise', 'Reference', 'Rapprochement'];
    const rows = filteredTransactions.map((transaction) => [transaction.transactionDate, transaction.paymentAccount?.name || '', transaction.label || '', transaction.direction, transaction.amount, transaction.currency, transaction.reference || '', transaction.reconciliationId ? 'Oui' : 'Non']);
    const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'transactions-tresorerie.csv'; link.click(); URL.revokeObjectURL(url);
  }

  async function submitReconciliation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await api.post('/treasury/reconciliations', { paymentAccountId: reconciliationAccountId, actualBalance: Number(actualBalance) });
    if (!response.ok) { setError('Impossible d’enregistrer le rapprochement.'); return; }
    const reconciliation = await response.json() as Reconciliation;
    setReconciliations((current) => [reconciliation, ...current]);
    setShowReconciliation(false); setActualBalance('');
  }

  async function submitTransfer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const account = activeAccounts.find((item) => item.id === transferForm.fromAccountId);
    const response = await api.post('/treasury/transfers', { ...transferForm, amount: Number(transferForm.amount), currency: account?.currency });
    if (!response.ok) { setError('Impossible d’enregistrer le virement.'); return; }
    const transfer = await response.json() as Transfer;
    setTransfers((current) => [transfer, ...current]);
    setShowTransfer(false);
  }

  return <ProtectedRoute><main className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Pilotage financier</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Trésorerie</h1><p className="mt-1 text-sm text-slate-500">Soldes, mouvements, rapprochements et prévisions.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setEditingAccount(undefined); setForm(form === 'account' ? null : 'account'); }} className="rounded-lg border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-700">Ajouter un compte</button><button type="button" onClick={() => setForm(form === 'expense' ? null : 'expense')} className="rounded-lg border border-amber-600 px-3 py-2 text-sm font-semibold text-amber-700">Ajouter une dépense</button><button type="button" onClick={() => setForm(form === 'transaction' ? null : 'transaction')} className="rounded-lg bg-sky-700 px-3 py-2 text-sm font-semibold text-white">Ajouter une transaction</button><button type="button" onClick={() => setShowTransfer((value) => !value)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-700">Virement interne</button><button type="button" onClick={() => setShowReconciliation((value) => !value)} className="rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700">Rapprocher</button></div></header>
    {form === 'account' && <div className="mb-6"><AddBankAccountForm initialAccount={editingAccount} onCancel={() => setForm(null)} onCreated={(account) => { setAccounts((current) => [...current, account]); setForm(null); }} onUpdated={(account) => { setAccounts((current) => current.map((item) => item.id === account.id ? account : item)); setForm(null); }} /></div>}
    {form === 'expense' && <div className="mb-6"><AddCompanyExpenseForm paymentAccounts={activeAccounts} onCancel={() => setForm(null)} onCreated={(expense) => { setExpenses((current) => [expense, ...current]); setForm(null); }} /></div>}
    {form === 'transaction' && <div className="mb-6"><AddBankTransactionForm paymentAccounts={activeAccounts} onCancel={() => setForm(null)} onCreated={(transaction) => { setTransactions((current) => [transaction, ...current]); setForm(null); }} /></div>}
    {showReconciliation && <form onSubmit={submitReconciliation} className="mb-6 grid gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:grid-cols-3"><label className="text-sm font-medium">Compte<select required className="mt-1 w-full rounded-lg border px-3 py-2" value={reconciliationAccountId} onChange={(event) => setReconciliationAccountId(event.target.value)}><option value="">Choisir</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="text-sm font-medium">Solde réel<input required type="number" step="0.01" className="mt-1 w-full rounded-lg border px-3 py-2" value={actualBalance} onChange={(event) => setActualBalance(event.target.value)} /></label><button className="self-end rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Enregistrer</button></form>}
    {showTransfer && <form onSubmit={submitTransfer} className="mb-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-4"><label className="text-sm font-medium">Depuis<select required className="mt-1 w-full rounded-lg border px-3 py-2" value={transferForm.fromAccountId} onChange={(event) => setTransferForm({ ...transferForm, fromAccountId: event.target.value })}><option value="">Choisir</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="text-sm font-medium">Vers<select required className="mt-1 w-full rounded-lg border px-3 py-2" value={transferForm.toAccountId} onChange={(event) => setTransferForm({ ...transferForm, toAccountId: event.target.value })}><option value="">Choisir</option>{activeAccounts.filter((account) => account.id !== transferForm.fromAccountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label className="text-sm font-medium">Montant<input required type="number" min="0.01" step="0.01" className="mt-1 w-full rounded-lg border px-3 py-2" value={transferForm.amount} onChange={(event) => setTransferForm({ ...transferForm, amount: event.target.value })} /></label><button className="self-end rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">Enregistrer</button></form>}
    {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
    {loading ? <div className="h-64 animate-pulse rounded-2xl bg-slate-100" /> : <>
      {alerts.length > 0 && <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5"><h2 className="font-bold text-red-900">Alertes trésorerie</h2><div className="mt-3 grid gap-3 md:grid-cols-2">{alerts.map((alert) => <div key={alert.code} className="rounded-xl bg-white p-3"><p className="font-semibold">{alert.title}</p><p className="text-sm text-slate-600">{alert.message}</p></div>)}</div></section>}
      <section className="mb-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Comptes actifs</p><p className="mt-2 text-2xl font-bold">{activeAccounts.length}</p></div><div className="rounded-2xl border border-sky-200 bg-sky-50 p-5"><p className="text-sm text-sky-700">Soldes bancaires</p>{Object.entries(balancesByCurrency).map(([currency, value]) => <p key={currency} className="mt-2 text-2xl font-bold text-sky-900">{formatMoney(value, currency)}</p>)}</div><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-sm text-amber-700">Dépenses à payer</p><p className="mt-2 text-2xl font-bold text-amber-900">{formatMoney(dueExpenses)}</p></div></section>
      <div className="mb-8"><BankAccountsList accounts={activeAccounts} onOpen={setSelectedAccount} onDelete={deleteAccount} /></div>
      <section className="mb-8 rounded-2xl border border-sky-200 bg-sky-50/50 p-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-slate-900">Hypothèses de prévision</h2><p className="text-sm text-slate-500">Les sources sont dédupliquées par type, identifiant et date.</p></div><div className="grid gap-2 sm:grid-cols-3"><label className="text-xs font-semibold text-slate-600">Horizon<select className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm" value={forecastHorizon} onChange={(event) => setForecastHorizon(event.target.value)}><option value="30">30 jours</option><option value="90">90 jours</option><option value="180">180 jours</option><option value="365">12 mois</option></select></label><label className="text-xs font-semibold text-slate-600">Paiement<select className="mt-1 rounded-lg border bg-white px-3 py-2 text-sm" value={paymentTiming} onChange={(event) => setPaymentTiming(event.target.value as PaymentTiming)}><option value="GENERATION">À la génération</option><option value="DUE_DATE">À l’échéance</option><option value="ARBITRARY_DAYS">Délai arbitraire</option></select></label>{paymentTiming === 'ARBITRARY_DAYS' && <label className="text-xs font-semibold text-slate-600">Délai<input type="number" min="0" className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm" value={paymentDelayDays} onChange={(event) => setPaymentDelayDays(event.target.value)} /></label>}</div></div></section>
      <div className="mb-8"><ForecastBudgetGraph points={forecastPoints} emptyReason={forecastReason} /></div>
      <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Transactions</h2><p className="text-sm text-slate-500">{filteredTransactions.length} mouvement(s)</p></div><button type="button" onClick={exportTransactions} className="rounded-lg border px-3 py-2 text-sm font-semibold">Exporter CSV</button></div><div className="grid gap-3 md:grid-cols-3"><input aria-label="Rechercher une transaction" placeholder="Libellé, référence..." className="rounded-lg border px-3 py-2 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} /><select aria-label="Filtrer par compte" className="rounded-lg border px-3 py-2 text-sm" value={accountFilter} onChange={(event) => setAccountFilter(event.target.value)}><option value="all">Tous les comptes</option>{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select><select aria-label="Filtrer par direction" className="rounded-lg border px-3 py-2 text-sm" value={directionFilter} onChange={(event) => setDirectionFilter(event.target.value as 'all' | 'CREDIT' | 'DEBIT')}><option value="all">Tous les mouvements</option><option value="CREDIT">Entrées</option><option value="DEBIT">Sorties</option></select></div><div className="mt-4 divide-y">{filteredTransactions.slice(0, 20).map((transaction) => <div key={transaction.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{transaction.label || 'Transaction bancaire'}</p><p className="text-xs text-slate-500">{transaction.paymentAccount?.name || 'Compte'} · {formatDate(transaction.transactionDate)} · {transaction.reconciliationId ? 'Rapprochée' : 'À rapprocher'}</p></div><p className={transaction.direction === 'DEBIT' ? 'font-semibold text-red-700' : 'font-semibold text-emerald-700'}>{transaction.direction === 'DEBIT' ? '-' : '+'}{formatMoney(transaction.amount, transaction.currency)}</p></div>)}</div></section>
      <section className="grid gap-8 lg:grid-cols-2"><div><h2 className="mb-3 text-lg font-bold">Historique des rapprochements</h2><div className="rounded-2xl border bg-white p-4 shadow-sm">{reconciliations.length === 0 ? <p className="text-sm text-slate-500">Aucun rapprochement enregistré.</p> : reconciliations.slice(0, 5).map((item) => <div key={item.id} className="border-b py-3 last:border-0"><div className="flex justify-between gap-3"><p className="font-medium">{item.paymentAccount?.name || 'Compte'}</p><p className="text-sm text-slate-500">{formatDate(item.reconciledAt)}</p></div><p className="text-sm text-slate-600">Calculé {formatMoney(item.calculatedBalance, item.paymentAccount?.currency)} · Réel {formatMoney(item.actualBalance, item.paymentAccount?.currency)} · Écart {formatMoney(item.difference, item.paymentAccount?.currency)}</p><p className="text-xs text-slate-400">Précédent : {formatDate(item.previousReconciliationDate)}</p></div>)}</div></div><div><h2 className="mb-3 text-lg font-bold">Virements internes</h2><div className="rounded-2xl border bg-white p-4 shadow-sm">{transfers.length === 0 ? <p className="text-sm text-slate-500">Aucun virement interne.</p> : transfers.slice(0, 5).map((transfer) => <div key={transfer.id} className="border-b py-3 last:border-0"><p className="font-medium">{transfer.fromAccount?.name} → {transfer.toAccount?.name}</p><p className="text-sm text-slate-600">{formatMoney(transfer.amount, transfer.currency)} · {formatDate(transfer.transferDate)}</p></div>)}</div></div></section>
    </>}
    {selectedAccount && <BankAccountDetails account={selectedAccount} onClose={() => setSelectedAccount(null)} onEdit={(account) => { setSelectedAccount(null); setEditingAccount(account); setForm('account'); }} />}
  </main></ProtectedRoute>;
}
