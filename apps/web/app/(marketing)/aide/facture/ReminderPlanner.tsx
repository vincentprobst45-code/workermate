'use client';

import { useId, useState } from 'react';
import { BellRing, Flag } from 'lucide-react';
import styles from './facture.module.css';

const MAX_ATTEMPTS_SHOWN = 6;

const clamp = (raw: string, min: number, max: number, fallback: number) => {
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
};

export default function ReminderPlanner() {
  const ids = { delay: useId(), repeat: useId(), max: useId() };
  const [delay, setDelay] = useState('3');
  const [repeat, setRepeat] = useState('7');
  const [max, setMax] = useState('3');

  const delayDays = clamp(delay, 0, 90, 3);
  const repeatDays = clamp(repeat, 1, 90, 7);
  const attempts = clamp(max, 1, MAX_ATTEMPTS_SHOWN, 3);
  const days = Array.from({ length: attempts }, (_, i) => delayDays + i * repeatDays);

  return (
    <div className={`${styles.glass} p-5 sm:p-7`}>
      <p className={styles.eyebrow}>Planificateur</p>
      <p className={`${styles.serif} mt-1 text-2xl font-semibold text-[#0b2545]`}>Quand le client est-il relancé ?</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { id: ids.delay, label: 'Première relance', unit: 'jours après l’échéance', value: delay, set: setDelay, min: 0 },
          { id: ids.repeat, label: 'Répétition', unit: 'jours entre deux relances', value: repeat, set: setRepeat, min: 1 },
          { id: ids.max, label: 'Maximum', unit: `relances (jusqu’à ${MAX_ATTEMPTS_SHOWN} ici)`, value: max, set: setMax, min: 1 },
        ].map((field) => (
          <div key={field.id}>
            <label htmlFor={field.id} className="text-[0.9375rem] font-semibold text-[#0b2545]">{field.label}</label>
            <div className={`${styles.field} mt-1.5`}>
              <input id={field.id} type="number" inputMode="numeric" min={field.min} step="1" value={field.value} onChange={(event) => field.set(event.target.value)} />
            </div>
            <p className="mt-1.5 text-sm text-[#465f80]">{field.unit}</p>
          </div>
        ))}
      </div>

      <ol className={`${styles.well} mt-6 grid gap-0 p-4 sm:p-5`} aria-label="Chronologie des relances" aria-live="polite">
        <li className="flex items-center gap-3 py-1">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/80 text-[#153f93] shadow-[0_2px_6px_rgba(70,110,170,0.25)]"><Flag className="h-4 w-4" aria-hidden="true" /></span>
          <span className="num font-semibold text-[#0b2545]">J 0 · date d’échéance dépassée</span>
        </li>
        {days.map((day, i) => (
          <li key={day} className="relative">
            <span className="ml-[1.0625rem] block h-6 w-0.5" style={{ background: 'repeating-linear-gradient(to bottom, rgba(29,86,192,0.55) 0 4px, transparent 4px 8px)' }} aria-hidden="true" />
            <span className="flex items-center gap-3 py-1">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1f4fb8] text-white shadow-[2px_3px_7px_rgba(31,79,184,0.4)]"><BellRing className="h-4 w-4" aria-hidden="true" /></span>
              <span className="num text-[#0b2545]">
                <span className="font-semibold">Relance {i + 1}</span> · J +{day}
                <span className="text-[#465f80]">{i === 0 ? '' : ` (+${repeatDays} j)`}</span>
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
