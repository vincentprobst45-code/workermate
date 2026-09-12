'use client';

import { useState } from 'react';
import type { PaymentAccount } from './AddBankAccountForm';

interface BankAccountsListProps {
  accounts: PaymentAccount[];
  onOpen: (account: PaymentAccount) => void;
  onDelete?: (account: PaymentAccount) => Promise<void> | void;
}

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value || 0));
}

export default function BankAccountsList({ accounts, onOpen, onDelete }: BankAccountsListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [accountToDelete, setAccountToDelete] = useState<PaymentAccount | null>(null);

  async function confirmDelete() {
    if (!accountToDelete || !onDelete) return;
    setDeletingId(accountToDelete.id);
    try {
      await onDelete(accountToDelete);
      setAccountToDelete(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section aria-labelledby="bank-accounts-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="bank-accounts-title" className="text-lg font-bold text-slate-900">Comptes bancaires</h2>
        <span className="text-sm text-slate-500">{accounts.length}</span>
      </div>
      {accounts.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">Aucun compte bancaire actif.</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-3">Compte</th><th className="px-4 py-3">IBAN</th><th className="px-4 py-3">Solde initial</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map((account) => <tr key={account.id}>
                  <td className="px-4 py-4"><p className="font-semibold text-slate-900">{account.name}</p><p className="text-xs text-slate-500">{account.bankName || 'Banque non renseignée'} · {account.currency}</p></td>
                  <td className="px-4 py-4 text-slate-600">{account.iban}</td>
                  <td className="px-4 py-4 font-medium text-slate-900">{formatMoney(account.openingBalance, account.currency)}</td>
                  <td className="px-4 py-4"><div className="flex justify-end gap-2"><button type="button" onClick={() => onOpen(account)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700" aria-label={`Ouvrir le compte ${account.name}`}>Ouvrir</button>{onDelete && <button type="button" onClick={() => setAccountToDelete(account)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700" aria-label={`Supprimer le compte ${account.name}`}>Supprimer</button>}</div></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">{accounts.map((account) => <article key={account.id} className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">{account.name}</h3><p className="text-xs text-slate-500">{account.bankName || 'Banque non renseignée'} · {account.currency}</p></div><p className="font-semibold text-slate-900">{formatMoney(account.openingBalance, account.currency)}</p></div><p className="mt-2 text-sm text-slate-600">{account.iban}</p><div className="mt-3 flex gap-2"><button type="button" onClick={() => onOpen(account)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white" aria-label={`Ouvrir le compte ${account.name}`}>Ouvrir</button>{onDelete && <button type="button" onClick={() => setAccountToDelete(account)} className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white" aria-label={`Supprimer le compte ${account.name}`}>Supprimer</button>}</div></article>)}</div>
        </div>
      )}
      {accountToDelete && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onClick={() => setAccountToDelete(null)}><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="delete-bank-account-title" onClick={(event) => event.stopPropagation()}><h2 id="delete-bank-account-title" className="text-lg font-bold text-slate-900">Supprimer ce compte ?</h2><p className="mt-2 text-sm text-slate-600">Le compte {accountToDelete.name} sera archivé. Les transactions existantes seront conservées.</p><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setAccountToDelete(null)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700">Annuler</button><button type="button" onClick={() => void confirmDelete()} disabled={Boolean(deletingId)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{deletingId ? 'Suppression...' : 'Supprimer'}</button></div></div></div>}
    </section>
  );
}
