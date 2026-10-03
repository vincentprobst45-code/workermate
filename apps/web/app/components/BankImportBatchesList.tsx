"use client";

export interface BankImportBatchSummary {
  id: string;
  paymentAccountId: string;
  fileName: string;
  sourceFormat: string;
  status: string;
  rowCount: number;
  importedCount: number;
  duplicateCount: number;
  importedAt: string;
  cancelledAt?: string | null;
  paymentAccount?: { name: string; currency: string };
  _count?: { transactions: number };
}

interface BankImportBatchesListProps {
  batches: BankImportBatchSummary[];
  onOpen: (batch: BankImportBatchSummary) => void;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("fr-FR");
}

function statusLabel(status: string) {
  return status === "ROLLED_BACK" ? "Annulé" : "Actif";
}

export default function BankImportBatchesList({
  batches,
  onOpen,
}: BankImportBatchesListProps) {
  return (
    <section aria-labelledby="bank-imports-title">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2
            id="bank-imports-title"
            className="text-lg font-bold text-slate-900"
          >
            Historique des imports bancaires
          </h2>
          <p className="text-sm text-slate-500">
            Chaque lot conserve les lignes importées et les doublons détectés.
          </p>
        </div>
        <span className="text-sm text-slate-500">{batches.length}</span>
      </div>
      {batches.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          Aucun import bancaire.
        </p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fichier</th>
                  <th className="px-4 py-3">Compte</th>
                  <th className="px-4 py-3">Importé le</th>
                  <th className="px-4 py-3">Lignes</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((batch) => (
                  <tr key={batch.id}>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">
                        {batch.fileName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {batch.sourceFormat}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {batch.paymentAccount?.name || "Compte"}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(batch.importedAt)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {batch.importedCount} importée(s) · {batch.duplicateCount}{" "}
                      doublon(s)
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${batch.status === "ROLLED_BACK" ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {statusLabel(batch.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onOpen(batch)}
                        className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Ouvrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-slate-100 md:hidden">
            {batches.map((batch) => (
              <article key={batch.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {batch.fileName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {batch.sourceFormat} ·{" "}
                      {batch.paymentAccount?.name || "Compte"}
                    </p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {statusLabel(batch.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDate(batch.importedAt)} · {batch.importedCount}{" "}
                  importée(s) · {batch.duplicateCount} doublon(s)
                </p>
                <button
                  type="button"
                  onClick={() => onOpen(batch)}
                  className="mt-3 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Ouvrir
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
