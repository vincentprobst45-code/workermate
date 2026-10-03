'use client';

import { useId, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import styles from './facture.module.css';

const lines = [
  { label: 'Dépose de la baignoire', detail: '1 forfait × 280,00 €', ht: 280, rate: 10 },
  { label: 'Pose du carrelage mural', detail: '12 m² × 55,00 €', ht: 660, rate: 10 },
  { label: 'Mitigeur thermostatique', detail: '1 u × 189,00 €', ht: 189, rate: 20 },
] as const;

type Rate = 10 | 20;

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const toAmount = (raw: string) => {
  const value = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(value) && value > 0 ? value : 0;
};

const INITIAL = { allowance: '50', allowanceRate: 10 as Rate, deposit: '300' };

export default function TotalsSimulator() {
  const ids = { allowance: useId(), deposit: useId() };
  const [allowance, setAllowance] = useState(INITIAL.allowance);
  const [allowanceRate, setAllowanceRate] = useState<Rate>(INITIAL.allowanceRate);
  const [deposit, setDeposit] = useState(INITIAL.deposit);

  const bases: Record<Rate, number> = { 10: 0, 20: 0 };
  lines.forEach((line) => {
    bases[line.rate] += line.ht;
  });
  const subtotal = round(bases[10] + bases[20]);
  const allowanceValue = Math.min(toAmount(allowance), bases[allowanceRate]);
  const taxable: Record<Rate, number> = { ...bases, [allowanceRate]: round(bases[allowanceRate] - allowanceValue) };
  const vat: Record<Rate, number> = { 10: round(taxable[10] * 0.1), 20: round(taxable[20] * 0.2) };
  const totalHt = round(taxable[10] + taxable[20]);
  const totalVat = round(vat[10] + vat[20]);
  const totalTtc = round(totalHt + totalVat);
  const depositValue = toAmount(deposit);
  const net = round(Math.max(totalTtc - depositValue, 0));

  function reset() {
    setAllowance(INITIAL.allowance);
    setAllowanceRate(INITIAL.allowanceRate);
    setDeposit(INITIAL.deposit);
  }

  return (
    <div className={`${styles.glass} p-5 sm:p-7`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={styles.eyebrow}>Simulateur</p>
          <p className={`${styles.serif} mt-1 text-2xl font-semibold text-[#0b2545]`}>Faites varier le calcul</p>
        </div>
        <button type="button" onClick={reset} className={`${styles.btn} h-11 w-11 shrink-0 !rounded-full p-0`} aria-label="Remettre les valeurs de l’exemple" title="Remettre les valeurs de l’exemple">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.allowance} className="text-[0.9375rem] font-semibold text-[#0b2545]">
            Remise sur la facture (HT)
          </label>
          <div className={`${styles.field} mt-1.5`}>
            <input id={ids.allowance} type="number" inputMode="decimal" min="0" step="0.01" value={allowance} onChange={(event) => setAllowance(event.target.value)} />
            <span className="text-[#465f80]" aria-hidden="true">€</span>
          </div>
          <p className="mt-1.5 text-sm text-[#465f80]">Plafonnée à {eur.format(bases[allowanceRate])} (base à {allowanceRate} %).</p>
        </div>

        <div>
          <label htmlFor={ids.deposit} className="text-[0.9375rem] font-semibold text-[#0b2545]">
            Acompte déjà versé
          </label>
          <div className={`${styles.field} mt-1.5`}>
            <input id={ids.deposit} type="number" inputMode="decimal" min="0" step="0.01" value={deposit} onChange={(event) => setDeposit(event.target.value)} />
            <span className="text-[#465f80]" aria-hidden="true">€</span>
          </div>
        </div>

        <fieldset className="sm:col-span-2">
          <legend className="text-[0.9375rem] font-semibold text-[#0b2545]">Taux de TVA de la remise</legend>
          <div className="mt-1.5 flex gap-3">
            {([10, 20] as const).map((rate) => (
              <button key={rate} type="button" aria-pressed={allowanceRate === rate} onClick={() => setAllowanceRate(rate)} className={`${styles.btn} min-w-24 px-5 py-2.5`}>
                {rate} %
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className={`${styles.well} mt-6 p-4 sm:p-5`} role="group" aria-label="Détail du calcul">
        <ul className="num divide-y divide-[#9fb8d8]/40 text-[0.9375rem] text-[#223d5c]">
          {lines.map((line) => (
            <li key={line.label} className="flex items-baseline justify-between gap-4 py-1.5">
              <span className="min-w-0">
                {line.label}
                <span className="block text-[0.8125rem] text-[#465f80]">{line.detail} · TVA {line.rate} %</span>
              </span>
              <span className="shrink-0">{eur.format(line.ht)}</span>
            </li>
          ))}
        </ul>

        <dl className="num mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 border-t border-[#9fb8d8]/60 pt-3 text-[0.9375rem] text-[#223d5c]">
          <dt>Sous-total lignes</dt>
          <dd className="text-right">{eur.format(subtotal)}</dd>
          <dt>Remises globales</dt>
          <dd className="text-right">− {eur.format(allowanceValue)}</dd>
          <dt className="font-semibold text-[#0b2545]">Total HT</dt>
          <dd className="text-right font-semibold text-[#0b2545]">{eur.format(totalHt)}</dd>
          <dt>TVA 10 % (base {eur.format(taxable[10])})</dt>
          <dd className="text-right">{eur.format(vat[10])}</dd>
          <dt>TVA 20 % (base {eur.format(taxable[20])})</dt>
          <dd className="text-right">{eur.format(vat[20])}</dd>
          <dt className="font-semibold text-[#0b2545]">Total TTC</dt>
          <dd className="text-right font-semibold text-[#0b2545]">{eur.format(totalTtc)}</dd>
          <dt>Acompte déjà versé</dt>
          <dd className="text-right">− {eur.format(depositValue)}</dd>
        </dl>
      </div>

      <div className={`${styles.plaque} mt-4 flex items-baseline justify-between gap-4 px-5 py-4`} aria-live="polite">
        <span className="font-semibold">Net à payer</span>
        <span className={`${styles.serif} num text-3xl font-semibold`}>{eur.format(net)}</span>
      </div>
    </div>
  );
}
