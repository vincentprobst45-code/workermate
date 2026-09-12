'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { PaymentAccount } from './AddBankAccountForm';

interface BankAccountDetailsProps {
  account: PaymentAccount;
  onClose: () => void;
  onEdit?: (account: PaymentAccount) => void;
}

function formatMoney(value: number | string, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('fr-FR');
}

export default function BankAccountDetails({ account, onClose, onEdit }: BankAccountDetailsProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onClick={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="bank-account-details-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-4 bg-slate-900 px-5 py-4 text-white sm:px-6">
          <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-300">Compte bancaire</p><h2 id="bank-account-details-title" className="mt-1 text-lg font-semibold">{account.name}</h2></div>
          <button ref={closeButtonRef} type="button" onClick={onClose} className="rounded-lg border border-slate-600 p-2 text-slate-200 hover:bg-slate-800" aria-label="Fermer la fiche du compte"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>
        <dl className="grid gap-5 px-5 py-6 sm:grid-cols-2 sm:px-6">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Banque</dt><dd className="mt-1 text-sm font-medium text-slate-900">{account.bankName || '-'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Titulaire</dt><dd className="mt-1 text-sm font-medium text-slate-900">{account.accountHolderName}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">IBAN</dt><dd className="mt-1 break-all text-sm font-medium text-slate-900">{account.iban}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">BIC</dt><dd className="mt-1 text-sm font-medium text-slate-900">{account.bic || '-'}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Solde initial</dt><dd className="mt-1 text-sm font-medium text-slate-900">{formatMoney(account.openingBalance, account.currency)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">Solde au</dt><dd className="mt-1 text-sm font-medium text-slate-900">{formatDate(account.openingBalanceDate)}</dd></div>
        </dl>
        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4 sm:px-6"><button type="button" onClick={() => onEdit?.(account)} disabled={!onEdit} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Modifier</button><button type="button" onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Fermer</button></footer>
      </div>
    </div>
  );
}
