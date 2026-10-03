'use client';

import { type FormEvent, useId, useMemo, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import styles from './facture.module.css';
import { goToAnchor, onAnchorClick } from './scroll';
import { tasks } from './sections';

const POPULAR_COUNT = 4;
const MAX_RESULTS = 5;

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function TaskFinder() {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const matches = useMemo(() => {
    if (!trimmed) return tasks.slice(0, POPULAR_COUNT);
    const terms = normalize(trimmed).split(/\s+/);
    return tasks.filter((task) => {
      const haystack = normalize(`${task.label} ${task.keywords} ${task.path.join(' ')}`);
      return terms.every((term) => haystack.includes(term));
    });
  }, [trimmed]);

  const visible = matches.slice(0, MAX_RESULTS);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (visible[0]) goToAnchor(visible[0].target);
  }

  return (
    <form onSubmit={handleSubmit} role="search" aria-label="Retrouver une action" className="w-full">
      <label htmlFor={inputId} className={`${styles.eyebrow} block`}>
        Que voulez-vous faire ?
      </label>
      <div className={`${styles.field} mt-3`}>
        <Search className="h-5 w-5 shrink-0 text-[#1d56c0]" aria-hidden="true" />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex. : acompte, avoir, relance…"
          autoComplete="off"
          enterKeyHint="go"
        />
        {query && (
          <button type="button" className={`${styles.btn} h-9 w-9 shrink-0 !rounded-full p-0`} onClick={() => setQuery('')} aria-label="Effacer la recherche">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {trimmed ? `${matches.length} résultat${matches.length > 1 ? 's' : ''}` : 'Suggestions affichées'}
      </p>

      <p className="mt-4 text-sm font-semibold text-[#465f80]">{trimmed ? `Résultats pour « ${trimmed} »` : 'Les plus demandés'}</p>
      {visible.length > 0 ? (
        <ul className="mt-2 grid gap-2">
          {visible.map((task) => (
            <li key={task.label}>
              <a
                href={`#${task.target}`}
                onClick={(event) => onAnchorClick(event, task.target)}
                className={`${styles.btn} w-full !justify-between px-4 py-2.5 text-left`}
              >
                <span className="min-w-0">
                  <span className="block truncate">{task.label}</span>
                  <span className="hidden truncate text-[0.8125rem] font-medium text-[#465f80] sm:block">{task.path.join(' › ')}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#1d56c0]" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`${styles.well} mt-2 px-4 py-3 text-[0.9375rem]`}>
          Aucun résultat. Essayez « paiement », « avoir » ou « relance », ou parcourez le sommaire.
        </p>
      )}
      {matches.length > MAX_RESULTS && <p className="mt-2 text-sm text-[#465f80]">{matches.length - MAX_RESULTS} autres résultats : précisez votre recherche.</p>}
    </form>
  );
}
