'use client';

import { type FormEvent, useId, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import styles from './facture.module.css';

const DUE = 1200;
const methods = ['Virement', 'Carte', 'Espèces', 'Chèque', 'Autre'] as const;

type Payment = { id: number; amount: number; method: string; cancelled: boolean; reason?: string };

const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export default function PaymentMeter() {
  const ids = { amount: useId(), method: useId(), reason: useId() };
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState('400');
  const [method, setMethod] = useState<string>(methods[0]);
  const [nextId, setNextId] = useState(1);
  const [error, setError] = useState('');
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const received = round(payments.filter((payment) => !payment.cancelled).reduce((sum, payment) => sum + payment.amount, 0));
  const remaining = round(Math.max(DUE - received, 0));
  const status = received <= 0 ? 'Non payée' : received >= DUE ? 'Payée' : 'Partiellement payée';
  const percent = Math.min((received / DUE) * 100, 100);

  function addPayment(event: FormEvent) {
    event.preventDefault();
    const value = Number.parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setError('Le montant doit être supérieur à 0.');
      return;
    }
    setError('');
    setPayments((current) => [{ id: nextId, amount: round(value), method, cancelled: false }, ...current]);
    setNextId((current) => current + 1);
  }

  function confirmCancel(event: FormEvent) {
    event.preventDefault();
    if (!reason.trim()) return;
    setPayments((current) => current.map((payment) => (payment.id === cancelingId ? { ...payment, cancelled: true, reason: reason.trim() } : payment)));
    setCancelingId(null);
    setReason('');
  }

  function reset() {
    setPayments([]);
    setAmount('400');
    setMethod(methods[0]);
    setError('');
    setCancelingId(null);
    setReason('');
  }

  return (
    <div className={`${styles.glass} p-5 sm:p-7`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={styles.eyebrow}>Essayez</p>
          <p className={`${styles.serif} mt-1 text-2xl font-semibold text-[#0b2545]`}>Facture de {eur.format(DUE)}</p>
        </div>
        <button type="button" onClick={reset} className={`${styles.btn} h-11 w-11 shrink-0 !rounded-full p-0`} aria-label="Repartir de zéro" title="Repartir de zéro">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className={`${styles.well} mt-5 p-4`} aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className={`${styles.serif} text-2xl font-semibold text-[#0b2545]`}>{status}</p>
          <p className="num text-[0.9375rem] text-[#223d5c]">
            Reçu {eur.format(received)} · reste {eur.format(remaining)}
          </p>
        </div>
        <div className={`${styles.gauge} mt-3`} role="img" aria-label={`${Math.round(percent)} % du net à payer reçu`}>
          <div className={styles.gaugeFill} style={{ width: `${percent}%` }} />
        </div>
      </div>

      <form onSubmit={addPayment} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
        <div>
          <label htmlFor={ids.amount} className="text-[0.9375rem] font-semibold text-[#0b2545]">Montant *</label>
          <div className={`${styles.field} mt-1.5`}>
            <input id={ids.amount} type="number" inputMode="decimal" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${ids.amount}-err` : undefined} />
            <span className="text-[#465f80]" aria-hidden="true">€</span>
          </div>
        </div>
        <div>
          <label htmlFor={ids.method} className="text-[0.9375rem] font-semibold text-[#0b2545]">Méthode</label>
          <div className={`${styles.field} mt-1.5`}>
            <select id={ids.method} value={method} onChange={(event) => setMethod(event.target.value)}>
              {methods.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <p id={`${ids.amount}-err`} role="alert" className="text-sm font-semibold text-[#a12b2b] sm:col-span-2">{error}</p>
        )}
        <div className="sm:col-span-2">
          <button type="submit" className={`${styles.btn} ${styles.btnPrimary} w-full px-5 py-3 sm:w-auto`}>Enregistrer le paiement</button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-[0.9375rem] font-semibold text-[#0b2545]">Paiements enregistrés</p>
        {payments.length === 0 ? (
          <p className="mt-2 text-[0.9375rem] text-[#465f80]">Aucun paiement enregistré.</p>
        ) : (
          <ul className="mt-2 divide-y divide-[#9fb8d8]/50">
            {payments.map((payment) => (
              <li key={payment.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="num min-w-0 text-[0.9375rem]">
                    <p className={payment.cancelled ? 'text-[#5a7394] line-through' : 'font-semibold text-[#0b2545]'}>{eur.format(payment.amount)}</p>
                    <p className="text-[0.8125rem] text-[#465f80]">
                      {payment.method}
                      {payment.cancelled ? ` · Annulé : ${payment.reason}` : ''}
                    </p>
                  </div>
                  {!payment.cancelled && cancelingId !== payment.id && (
                    <button type="button" className={`${styles.btn} px-3.5 py-2 text-[0.875rem]`} onClick={() => { setCancelingId(payment.id); setReason(''); }}>
                      Annuler le paiement
                    </button>
                  )}
                </div>
                {cancelingId === payment.id && (
                  <form onSubmit={confirmCancel} className="mt-3 grid gap-3">
                    <p className="text-[0.9375rem] text-[#223d5c]">Un paiement d’une facture émise ne se supprime pas : il est marqué comme annulé.</p>
                    <label htmlFor={ids.reason} className="text-[0.9375rem] font-semibold text-[#0b2545]">Raison de l’annulation *</label>
                    <div className={styles.field}>
                      <input id={ids.reason} required value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Indiquez pourquoi ce paiement est annulé" autoFocus />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button type="submit" disabled={!reason.trim()} className={`${styles.btn} ${styles.btnPrimary} px-4 py-2.5`}>Annuler le paiement</button>
                      <button type="button" className={`${styles.btn} px-4 py-2.5`} onClick={() => setCancelingId(null)}>Fermer</button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
