"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useApiClient } from "../api-client";

export interface BankTransaction {
  id: string;
  amount: number | string;
  direction: "CREDIT" | "DEBIT";
  currency: string;
  transactionType?:
    "STANDARD" | "TRANSFER" | "FEE" | "INTEREST" | "REFUND" | "CASH_WITHDRAWAL";
  reconciliationId?: string | null;
  importBatchId?: string | null;
  transactionDate: string;
  label?: string | null;
  reference?: string | null;
  externalId?: string | null;
  paymentAccountId: string;
  paymentAccount?: { id: string; name: string };
  payments?: Array<{ id: string; invoice?: { number?: string | null } | null }>;
}

interface ImportedRow {
  amount: number;
  direction: "CREDIT" | "DEBIT";
  currency: string;
  transactionDate: string;
  label?: string;
  reference?: string;
}

interface CsvSource {
  headers: string[];
  rows: string[][];
}

interface CsvMapping {
  date: string;
  amount: string;
  debit: string;
  credit: string;
  currency: string;
  label: string;
  reference: string;
}

interface HistoricalImportRow {
  index: number;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  currency: string;
  transactionDate: string;
  label?: string;
  reference?: string;
}

interface HistoricalImportReview {
  code: "HISTORICAL_TRANSACTIONS_REQUIRE_REVIEW";
  message: string;
  reconciliation: { id: string; reconciledAt: string; status: string };
  rows: HistoricalImportRow[];
}

interface AddBankTransactionFormProps {
  paymentAccounts: Array<{ id: string; name: string; currency?: string }>;
  onCreated: (transaction: BankTransaction) => void;
  onCancel: () => void;
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string, separator: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      cell += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

function readCsv(content: string): CsvSource {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2)
    throw new Error(
      "Le fichier CSV doit contenir une ligne d’en-tête et au moins une transaction.",
    );
  const separator =
    (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length
      ? ";"
      : ",";
  return {
    headers: parseCsvLine(lines[0], separator),
    rows: lines.slice(1).map((line) => parseCsvLine(line, separator)),
  };
}

function parseAmount(value: string) {
  const normalized = value
    .replace(/\u00a0/g, " ")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const amount = Number(normalized.replace(/[^\d.+-]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function parseDate(value: string) {
  const trimmed = value.trim();
  const parts = trimmed.split(/[\/-]/).map(Number);
  if (parts.length === 3 && parts.every(Number.isFinite)) {
    const [first, second, third] = parts;
    const date =
      first > 31
        ? new Date(Date.UTC(first, second - 1, third))
        : new Date(Date.UTC(third, second - 1, first));
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function xmlValue(element: Element, name: string) {
  const child = Array.from(element.getElementsByTagName("*")).find(
    (candidate) => candidate.localName === name,
  );
  return child?.textContent?.trim() || "";
}

function parseCamt053(content: string, defaultCurrency: string): ImportedRow[] {
  const document = new DOMParser().parseFromString(content, "application/xml");
  if (document.getElementsByTagName("parsererror").length > 0)
    throw new Error("Le fichier CAMT.053 est XML invalide.");
  const entries = Array.from(document.getElementsByTagName("*")).filter(
    (element) => element.localName === "Ntry",
  );
  if (entries.length === 0)
    throw new Error(
      "Aucune écriture bancaire trouvée dans ce fichier CAMT.053.",
    );
  return entries.flatMap((entry, rowIndex) => {
    const amountElement = Array.from(entry.getElementsByTagName("*")).find(
      (element) => element.localName === "Amt",
    );
    const amount = parseAmount(amountElement?.textContent || "");
    const dateValue = xmlValue(entry, "Dt") || xmlValue(entry, "DtTm");
    const date = parseDate(dateValue);
    if (!date)
      throw new Error(`Date CAMT.053 invalide à l’écriture ${rowIndex + 1}.`);
    if (amount === null || amount <= 0)
      throw new Error(
        `Montant CAMT.053 invalide à l’écriture ${rowIndex + 1}.`,
      );
    const direction =
      xmlValue(entry, "CdtDbtInd").toUpperCase() === "DBIT"
        ? "DEBIT"
        : "CREDIT";
    const label =
      xmlValue(entry, "Ustrd") || xmlValue(entry, "AddtlNtryInf") || undefined;
    const reference =
      xmlValue(entry, "NtryRef") || xmlValue(entry, "TxId") || undefined;
    return [
      {
        amount,
        direction,
        currency: amountElement?.getAttribute("Ccy") || defaultCurrency,
        transactionDate: date,
        label,
        reference,
      },
    ];
  });
}

function ofxTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([^<\\r\\n]*)`, "i"));
  return match?.[1]?.trim() || "";
}

function parseOfxDate(value: string) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (!match) return null;
  const [, year, month, day, hour = "00", minute = "00", second = "00"] = match;
  const date = new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    ),
  );
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseOfx(content: string, defaultCurrency: string): ImportedRow[] {
  const blocks = Array.from(
    content.matchAll(/<STMTTRN\b[\s\S]*?(?=<STMTTRN\b|<\/BANKTRANLIST>|$)/gi),
    (match) => match[0],
  );
  if (blocks.length === 0)
    throw new Error("Aucune transaction trouvée dans ce fichier OFX.");
  const fileCurrency = ofxTag(content, "CURDEF") || defaultCurrency;
  return blocks.map((block, rowIndex) => {
    const amount = parseAmount(ofxTag(block, "TRNAMT") || "");
    const date = parseOfxDate(
      ofxTag(block, "DTPOSTED") || ofxTag(block, "DTUSER"),
    );
    if (!date)
      throw new Error(`Date OFX invalide à la transaction ${rowIndex + 1}.`);
    if (amount === null || amount === 0)
      throw new Error(`Montant OFX invalide à la transaction ${rowIndex + 1}.`);
    const rawAmount = amount;
    return {
      amount: Math.abs(rawAmount),
      direction:
        rawAmount < 0 || ofxTag(block, "TRNTYPE").toUpperCase() === "DEBIT"
          ? "DEBIT"
          : "CREDIT",
      currency: ofxTag(block, "CURDEF") || fileCurrency,
      transactionDate: date,
      label: ofxTag(block, "NAME") || ofxTag(block, "MEMO") || undefined,
      reference:
        ofxTag(block, "FITID") || ofxTag(block, "CHECKNUM") || undefined,
    };
  });
}

function findColumn(headers: string[], names: string[]) {
  return headers.findIndex((header) => names.includes(normalizeHeader(header)));
}

function autoMapping(headers: string[]): CsvMapping {
  const find = (names: string[]) => {
    const index = findColumn(headers, names);
    return index >= 0 ? String(index) : "";
  };
  return {
    date: find([
      "date",
      "datedoperation",
      "dateoperation",
      "bookedat",
      "valuedate",
    ]),
    amount: find(["montant", "amount", "value"]),
    debit: find(["debit", "sortie", "withdrawal"]),
    credit: find(["credit", "entree", "deposit"]),
    currency: find(["devise", "currency"]),
    label: find(["libelle", "description", "label", "communication", "name"]),
    reference: find([
      "reference",
      "ref",
      "numero",
      "transactionid",
      "externalid",
    ]),
  };
}

function parseRows(
  source: CsvSource,
  mapping: CsvMapping,
  defaultCurrency: string,
): ImportedRow[] {
  const dateIndex = Number(mapping.date);
  const amountIndex = mapping.amount === "" ? -1 : Number(mapping.amount);
  const debitIndex = mapping.debit === "" ? -1 : Number(mapping.debit);
  const creditIndex = mapping.credit === "" ? -1 : Number(mapping.credit);
  const currencyIndex = mapping.currency === "" ? -1 : Number(mapping.currency);
  const labelIndex = mapping.label === "" ? -1 : Number(mapping.label);
  const referenceIndex =
    mapping.reference === "" ? -1 : Number(mapping.reference);
  if (
    !Number.isInteger(dateIndex) ||
    dateIndex < 0 ||
    (amountIndex < 0 && debitIndex < 0 && creditIndex < 0)
  ) {
    throw new Error(
      "Sélectionnez une colonne de date et une colonne de montant, ou les colonnes débit et crédit.",
    );
  }

  return source.rows.map((values, rowIndex) => {
    const date = parseDate(values[dateIndex] || "");
    if (!date) throw new Error(`Date invalide à la ligne ${rowIndex + 2}.`);
    const credit =
      creditIndex >= 0 ? parseAmount(values[creditIndex] || "") : null;
    const debit =
      debitIndex >= 0 ? parseAmount(values[debitIndex] || "") : null;
    const rawAmount =
      amountIndex >= 0 ? parseAmount(values[amountIndex] || "") : null;
    const isDebit =
      debit !== null && debit !== 0 && (credit === null || credit === 0);
    const amount =
      debit !== null || credit !== null
        ? Math.abs(isDebit ? debit : credit || 0)
        : Math.abs(rawAmount || 0);
    if (amount <= 0)
      throw new Error(`Montant invalide à la ligne ${rowIndex + 2}.`);
    const direction =
      debit !== null || credit !== null
        ? isDebit
          ? "DEBIT"
          : "CREDIT"
        : rawAmount !== null && rawAmount < 0
          ? "DEBIT"
          : "CREDIT";
    return {
      amount,
      direction,
      currency:
        (currencyIndex >= 0 ? values[currencyIndex] : "") || defaultCurrency,
      transactionDate: date,
      label: labelIndex >= 0 ? values[labelIndex] || undefined : undefined,
      reference:
        referenceIndex >= 0 ? values[referenceIndex] || undefined : undefined,
    };
  });
}

function MappingField({
  label,
  value,
  headers,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  headers: string[];
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      {required && <span className="text-red-600"> *</span>}
      <select
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Non utilisée</option>
        {headers.map((header, index) => (
          <option key={`${header}-${index}`} value={index}>
            {header || `Colonne ${index + 1}`}
          </option>
        ))}
      </select>
    </label>
  );
}

function HistoricalReviewPanel({
  review,
  saving,
  onCancel,
  onImportNew,
  onImportAll,
}: {
  review: HistoricalImportReview;
  saving: boolean;
  onCancel: () => void;
  onImportNew: () => void;
  onImportAll: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
      <h3 className="font-semibold">
        Cet import contient des lignes historiques
      </h3>
      <p className="mt-1">
        Ces lignes sont antérieures ou égales à la réconciliation du{" "}
        {new Date(review.reconciliation.reconciledAt).toLocaleDateString(
          "fr-FR",
        )}
        . Elles ne seront pas ajoutées silencieusement.
      </p>
      <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-amber-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-amber-200 bg-amber-100/60">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Libellé</th>
              <th className="px-3 py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100">
            {review.rows.map((row) => (
              <tr key={`${row.index}-${row.transactionDate}`}>
                <td className="px-3 py-2 whitespace-nowrap">
                  {new Date(row.transactionDate).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-3 py-2">
                  {row.label || row.reference || "Sans libellé"}
                </td>
                <td
                  className={`px-3 py-2 text-right font-semibold ${row.direction === "DEBIT" ? "text-red-700" : "text-emerald-700"}`}
                >
                  {row.direction === "DEBIT" ? "-" : "+"}
                  {row.amount.toFixed(2)} {row.currency}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-amber-800">
        Importer uniquement les nouvelles lignes est recommandé. L’import
        historique modifiera le solde courant, mais pas les valeurs déjà
        enregistrées dans la réconciliation.
      </p>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold text-amber-900 disabled:opacity-60"
        >
          Annuler l’import
        </button>
        <button
          type="button"
          onClick={onImportNew}
          disabled={saving}
          className="rounded-lg bg-amber-700 px-3 py-2 font-semibold text-white disabled:opacity-60"
        >
          Importer uniquement les nouvelles
        </button>
        <button
          type="button"
          onClick={onImportAll}
          disabled={saving}
          className="rounded-lg border border-amber-700 px-3 py-2 font-semibold text-amber-800 disabled:opacity-60"
        >
          Importer malgré l’impact historique
        </button>
      </div>
    </div>
  );
}

export default function AddBankTransactionForm({
  paymentAccounts,
  onCreated,
  onCancel,
}: AddBankTransactionFormProps) {
  const api = useApiClient();
  const [mode, setMode] = useState<"manual" | "csv">("manual");
  const [form, setForm] = useState({
    paymentAccountId: paymentAccounts[0]?.id ?? "",
    amount: "",
    direction: "CREDIT" as "CREDIT" | "DEBIT",
    currency: paymentAccounts[0]?.currency || "EUR",
    transactionDate: new Date().toISOString().slice(0, 10),
    label: "",
    reference: "",
    externalId: "",
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvSource, setCsvSource] = useState<CsvSource | null>(null);
  const [csvRows, setCsvRows] = useState<ImportedRow[]>([]);
  const [mapping, setMapping] = useState<CsvMapping>({
    date: "",
    amount: "",
    debit: "",
    credit: "",
    currency: "",
    label: "",
    reference: "",
  });
  const [manualMappingOpen, setManualMappingOpen] = useState(false);
  const [historicalReview, setHistoricalReview] =
    useState<HistoricalImportReview | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedAccount = paymentAccounts.find(
    (account) => account.id === form.paymentAccountId,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await api.post("/bank-transactions", {
        ...form,
        amount: Number(form.amount),
        externalId: form.externalId.trim() || undefined,
      });
      if (!response.ok) throw new Error("Erreur");
      onCreated((await response.json()) as BankTransaction);
    } catch {
      setError("Impossible d’enregistrer la transaction bancaire.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setCsvFile(file || null);
    setCsvSource(null);
    setCsvRows([]);
    setManualMappingOpen(false);
    setHistoricalReview(null);
    setError("");
    if (!file) return;
    try {
      const content = await file.text();
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".ofx") || /<OFX[\s>]/i.test(content)) {
        setCsvRows(parseOfx(content, selectedAccount?.currency || "EUR"));
        return;
      }
      if (
        fileName.endsWith(".xml") ||
        /<(?:Document|BkToCstmrStmt|Stmt|Ntry)[\s>]/i.test(content)
      ) {
        setCsvRows(parseCamt053(content, selectedAccount?.currency || "EUR"));
        return;
      }
      const source = readCsv(content);
      const detectedMapping = autoMapping(source.headers);
      setCsvFile(file);
      setCsvSource(source);
      setMapping(detectedMapping);
      setCsvRows(
        parseRows(source, detectedMapping, selectedAccount?.currency || "EUR"),
      );
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Impossible de lire ce fichier CSV.",
      );
      try {
        const source = readCsv(await file.text());
        setCsvFile(file);
        setCsvSource(source);
        setMapping(autoMapping(source.headers));
      } catch {
        /* The original parsing error is already displayed. */
      }
    }
  }

  function openManualMapping() {
    setManualMappingOpen(true);
    setError("");
  }

  function applyManualMapping() {
    if (!csvSource) return;
    try {
      setCsvRows(
        parseRows(csvSource, mapping, selectedAccount?.currency || "EUR"),
      );
      setManualMappingOpen(false);
      setError("");
    } catch (mappingError) {
      setCsvRows([]);
      setError(
        mappingError instanceof Error
          ? mappingError.message
          : "Le mapping des colonnes est invalide.",
      );
    }
  }

  async function submitCsvRows(rows: ImportedRow[], allowHistorical: boolean) {
    if (!csvFile || rows.length === 0) {
      setError("Aucune transaction sélectionnée pour l’import.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await api.post("/bank-transactions/import", {
        paymentAccountId: form.paymentAccountId,
        fileName: csvFile.name,
        sourceFormat: csvFile.name.toLowerCase().endsWith(".ofx")
          ? "OFX"
          : csvFile.name.toLowerCase().endsWith(".xml")
            ? "CAMT.053"
            : "CSV",
        transactions: rows,
        allowHistorical,
      });
      if (!response.ok) {
        let payload: { message?: HistoricalImportReview | string } | null =
          null;
        try {
          payload = (await response.json()) as {
            message?: HistoricalImportReview | string;
          };
        } catch {
          payload = null;
        }
        if (
          response.status === 409 &&
          payload?.message &&
          typeof payload.message !== "string" &&
          payload.message.code === "HISTORICAL_TRANSACTIONS_REQUIRE_REVIEW"
        ) {
          setHistoricalReview(payload.message);
          setError(payload.message.message);
          return;
        }
        throw new Error("Le serveur a refusé l’import.");
      }
      const result = (await response.json()) as {
        importedCount: number;
        duplicateCount: number;
        transactions: BankTransaction[];
      };
      result.transactions.forEach(onCreated);
      setError(
        `${result.importedCount} transaction(s) importée(s)${result.duplicateCount ? `, ${result.duplicateCount} doublon(s) ignoré(s)` : ""}.`,
      );
      setCsvFile(null);
      setCsvSource(null);
      setCsvRows([]);
      setManualMappingOpen(false);
      setHistoricalReview(null);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Impossible d’importer ce fichier CSV.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCsvSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (historicalReview) {
      setError("Choisissez une option pour les lignes historiques.");
      return;
    }
    await submitCsvRows(csvRows, false);
  }

  function importOnlyNewRows() {
    if (!historicalReview) return;
    const historicalIndexes = new Set(
      historicalReview.rows.map((row) => row.index),
    );
    void submitCsvRows(
      csvRows.filter((_, index) => !historicalIndexes.has(index)),
      false,
    );
  }

  function importIncludingHistoricalRows() {
    void submitCsvRows(csvRows, true);
  }

  const accountSelect = (
    <label className="text-sm font-medium text-slate-700">
      Compte bancaire
      <select
        required
        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
        value={form.paymentAccountId}
        onChange={(event) =>
          setForm({ ...form, paymentAccountId: event.target.value })
        }
      >
        {paymentAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name}
          </option>
        ))}
      </select>
    </label>
  );
  const manualMapping =
    manualMappingOpen && csvSource ? (
      <div className="mt-4 rounded-xl border border-sky-300 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">
              Sélectionner les colonnes manuellement
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Associez chaque donnée du relevé à une colonne CSV.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setManualMappingOpen(false)}
            className="text-sm text-slate-500"
          >
            Fermer
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <MappingField
            label="Date"
            value={mapping.date}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, date: value })}
            required
          />
          <MappingField
            label="Montant"
            value={mapping.amount}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, amount: value })}
          />
          <MappingField
            label="Débit"
            value={mapping.debit}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, debit: value })}
          />
          <MappingField
            label="Crédit"
            value={mapping.credit}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, credit: value })}
          />
          <MappingField
            label="Devise"
            value={mapping.currency}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, currency: value })}
          />
          <MappingField
            label="Libellé"
            value={mapping.label}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, label: value })}
          />
          <MappingField
            label="Référence"
            value={mapping.reference}
            headers={csvSource.headers}
            onChange={(value) => setMapping({ ...mapping, reference: value })}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={applyManualMapping}
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Prévisualiser les transactions
          </button>
        </div>
      </div>
    ) : null;
  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Transactions bancaires
          </h2>
          <p className="text-sm text-slate-500">
            Ajoutez un mouvement ou importez un relevé CSV, CAMT.053 ou OFX.
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-300 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              setError("");
            }}
            className={`rounded-md px-3 py-1.5 font-semibold ${mode === "manual" ? "bg-sky-700 text-white" : "text-slate-600"}`}
          >
            Saisie manuelle
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("csv");
              setError("");
            }}
            className={`rounded-md px-3 py-1.5 font-semibold ${mode === "csv" ? "bg-sky-700 text-white" : "text-slate-600"}`}
          >
            Importer un relevé
          </button>
        </div>
      </div>
      {mode === "manual" ? (
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {accountSelect}
            <label className="text-sm font-medium text-slate-700">
              Montant
              <input
                required
                min="0"
                step="0.01"
                type="number"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={form.amount}
                onChange={(event) =>
                  setForm({ ...form, amount: event.target.value })
                }
                placeholder="Montant positif"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Type
              <select
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={form.direction}
                onChange={(event) =>
                  setForm({
                    ...form,
                    direction: event.target.value as "CREDIT" | "DEBIT",
                  })
                }
              >
                <option value="CREDIT">Entrée</option>
                <option value="DEBIT">Sortie</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              Devise
              <input
                required
                maxLength={3}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 uppercase"
                value={form.currency}
                onChange={(event) =>
                  setForm({
                    ...form,
                    currency: event.target.value.toUpperCase(),
                  })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Date
              <input
                required
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={form.transactionDate}
                onChange={(event) =>
                  setForm({ ...form, transactionDate: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Libellé
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={form.label}
                onChange={(event) =>
                  setForm({ ...form, label: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Référence
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={form.reference}
                onChange={(event) =>
                  setForm({ ...form, reference: event.target.value })
                }
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Identifiant bancaire
              <input
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                value={form.externalId}
                onChange={(event) =>
                  setForm({ ...form, externalId: event.target.value })
                }
              />
            </label>
          </div>
          <Actions saving={saving} onCancel={onCancel} />
        </form>
      ) : (
        <form onSubmit={handleCsvSubmit}>
          {accountSelect}
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Fichier de relevé
            <input
              required
              type="file"
              accept=".csv,.xml,.ofx,text/csv,application/xml,application/x-ofx"
              className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              onChange={handleCsvChange}
            />
          </label>
          {manualMapping}
          {historicalReview && (
            <HistoricalReviewPanel
              review={historicalReview}
              saving={saving}
              onCancel={() => {
                setHistoricalReview(null);
                setError("");
              }}
              onImportNew={importOnlyNewRows}
              onImportAll={importIncludingHistoricalRows}
            />
          )}
          {csvRows.length > 0 && (
            <div className="mt-4 rounded-lg border border-sky-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold">
                Aperçu détecté : {csvRows.length} transaction(s)
              </p>
              <p className="mt-1 text-slate-500">
                Les colonnes détectées peuvent être corrigées manuellement si
                nécessaire.
              </p>
              <div className="mt-3 max-h-40 overflow-auto divide-y">
                {csvRows.slice(0, 5).map((row, index) => (
                  <div
                    key={`${row.transactionDate}-${index}`}
                    className="flex justify-between gap-3 py-2"
                  >
                    <span>
                      {new Date(row.transactionDate).toLocaleDateString(
                        "fr-FR",
                      )}{" "}
                      · {row.label || "Sans libellé"}
                    </span>
                    <strong
                      className={
                        row.direction === "DEBIT"
                          ? "text-red-700"
                          : "text-emerald-700"
                      }
                    >
                      {row.direction === "DEBIT" ? "-" : "+"}
                      {row.amount.toFixed(2)} {row.currency}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!historicalReview && (
            <Actions
              saving={saving}
              onCancel={onCancel}
              submitLabel="Importer"
            />
          )}
        </form>
      )}
      {error && (
        <div
          className={`mt-3 rounded-lg p-3 text-sm ${error.includes("importée") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
        >
          <p>{error}</p>
          {mode === "csv" &&
            csvSource &&
            !manualMappingOpen &&
            !error.includes("importée") && (
              <button
                type="button"
                onClick={openManualMapping}
                className="mt-2 font-semibold text-sky-700 underline"
              >
                Sélectionner les colonnes manuellement
              </button>
            )}
        </div>
      )}
    </section>
  );
}

function Actions({
  saving,
  onCancel,
  submitLabel = "Enregistrer",
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <div className="mt-5 flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700"
      >
        Annuler
      </button>
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Traitement..." : submitLabel}
      </button>
    </div>
  );
}
