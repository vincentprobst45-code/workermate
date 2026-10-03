"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { BankImportBatchSummary } from "./BankImportBatchesList";

interface BankImportTransaction {
  id: string;
  amount: number | string;
  direction: "CREDIT" | "DEBIT";
  currency: string;
  transactionDate: string;
  label?: string | null;
  reconciliationId?: string | null;
  transferId?: string | null;
  payments: unknown[];
  companyExpenses: unknown[];
  purchases: unknown[];
}

export interface BankImportBatchDetailsData extends BankImportBatchSummary {
  transactions: BankImportTransaction[];
}

interface BankImportBatchDetailsProps {
  batch: BankImportBatchDetailsData;
  onClose: () => void;
  onRollback: () => Promise<void>;
  rollingBack: boolean;
}

function money(value: number | string, currency: string) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    Number(value || 0),
  );
}

function date(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? "-"
    : parsed.toLocaleDateString("fr-FR");
}

function isBlocked(transaction: BankImportTransaction) {
  return Boolean(
    transaction.reconciliationId ||
    transaction.transferId ||
    transaction.payments.length ||
    transaction.companyExpenses.length ||
    transaction.purchases.length,
  );
}

export default function BankImportBatchDetails({
  batch,
  onClose,
  onRollback,
  rollingBack,
}: BankImportBatchDetailsProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const blockedCount = batch.transactions.filter(isBlocked).length;
  const canRollback = batch.status !== "ROLLED_BACK" && blockedCount === 0;

  useEffect(() => {
    closeButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-import-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 bg-slate-900 px-5 py-4 text-white sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-300">
              Import bancaire · {batch.sourceFormat}
            </p>
            <h2
              id="bank-import-details-title"
              className="mt-1 text-lg font-semibold"
            >
              {batch.fileName}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {batch.paymentAccount?.name || "Compte"} · importé le{" "}
              {date(batch.importedAt)}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-200 hover:bg-slate-800"
            aria-label="Fermer le détail de l’import"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div className="grid gap-3 border-b border-slate-200 px-5 py-4 text-sm sm:grid-cols-3 sm:px-6">
          <div>
            <p className="text-slate-500">Lignes du fichier</p>
            <p className="font-semibold text-slate-900">{batch.rowCount}</p>
          </div>
          <div>
            <p className="text-slate-500">Importées</p>
            <p className="font-semibold text-slate-900">
              {batch.importedCount}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Doublons ignorés</p>
            <p className="font-semibold text-slate-900">
              {batch.duplicateCount}
            </p>
          </div>
        </div>
        <div className="px-5 py-5 sm:px-6">
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Libellé</th>
                  <th className="px-3 py-3 text-right">Montant</th>
                  <th className="px-3 py-3">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batch.transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="whitespace-nowrap px-3 py-3">
                      {date(transaction.transactionDate)}
                    </td>
                    <td className="px-3 py-3">
                      {transaction.label || "Transaction bancaire"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-3 text-right font-semibold ${transaction.direction === "DEBIT" ? "text-red-700" : "text-emerald-700"}`}
                    >
                      {transaction.direction === "DEBIT" ? "-" : "+"}
                      {money(transaction.amount, transaction.currency)}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      {isBlocked(transaction)
                        ? "Utilisée ou rapprochée"
                        : "Annulable"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {blockedCount > 0 && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {blockedCount} transaction(s) sont déjà utilisées ou rapprochées.
              Cet import ne peut pas être annulé automatiquement.
            </p>
          )}
        </div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Fermer
          </button>
          <button
            type="button"
            disabled={!canRollback || rollingBack}
            onClick={() => {
              if (
                window.confirm(
                  "Annuler cet import supprimera les transactions importées qui ne sont pas utilisées. Continuer ?",
                )
              )
                void onRollback();
            }}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {rollingBack ? "Annulation..." : "Annuler l’import"}
          </button>
        </footer>
      </div>
    </div>
  );
}
