'use client';

import { type KeyboardEvent, type ReactNode, useId, useRef, useState } from 'react';
import styles from './facture.module.css';

export type TabItem = { id: string; label: string; hint?: string; panel: ReactNode };

type Props = {
  tabs: TabItem[];
  label: string;
  layout?: 'side' | 'segmented';
};

export default function Tabs({ tabs, label, layout = 'side' }: Props) {
  const base = useId();
  const [index, setIndex] = useState(0);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const side = layout === 'side';

  function select(next: number) {
    const clamped = (next + tabs.length) % tabs.length;
    setIndex(clamped);
    refs.current[clamped]?.focus();
  }

  function onKeyDown(event: KeyboardEvent) {
    const keys: Record<string, number | undefined> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = keys[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  }

  return (
    <div className={side ? 'grid gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-8' : 'grid gap-6'}>
      <div
        role="tablist"
        aria-label={label}
        aria-orientation={side ? 'vertical' : 'horizontal'}
        onKeyDown={onKeyDown}
        className={side ? 'grid grid-cols-2 gap-3 lg:grid-cols-1 lg:content-start' : 'grid gap-3 sm:grid-cols-2'}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[i] = node;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${tab.id}`}
            aria-selected={i === index}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={i === index ? 0 : -1}
            onClick={() => setIndex(i)}
            className={`${styles.btn} !flex-col !items-start !gap-0.5 px-4 py-3 text-left`}
          >
            <span>{tab.label}</span>
            {tab.hint && <span className="text-[0.8125rem] font-medium text-[#465f80]">{tab.hint}</span>}
          </button>
        ))}
      </div>

      {tabs.map((tab, i) => (
        <div
          key={tab.id}
          role="tabpanel"
          id={`${base}-panel-${tab.id}`}
          aria-labelledby={`${base}-tab-${tab.id}`}
          hidden={i !== index}
          tabIndex={0}
          className={`${styles.glass} ${styles.glassDense} ${styles.rise} min-w-0 p-5 sm:p-8 ${side ? 'lg:col-start-2 lg:row-start-1 lg:self-start' : ''}`}
        >
          {tab.panel}
        </div>
      ))}
    </div>
  );
}
