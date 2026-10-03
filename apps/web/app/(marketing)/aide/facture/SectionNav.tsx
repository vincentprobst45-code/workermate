'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { ChevronUp, ListTree } from 'lucide-react';
import styles from './facture.module.css';
import { onAnchorClick } from './scroll';
import { sections } from './sections';

export default function SectionNav() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = ['debut', ...sections.map(({ id }) => id)];
    const targets = ids.map((id) => document.getElementById(id)).filter((node): node is HTMLElement => node !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id === 'debut' ? null : entry.target.id);
        });
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    targets.forEach((node) => observer.observe(node));

    const end = document.getElementById('fin');
    const endObserver = new IntersectionObserver(([entry]) => setAtEnd(entry.isIntersecting));
    if (end) endObserver.observe(end);

    return () => {
      observer.disconnect();
      endObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false);
    }
    function onPointer(event: PointerEvent) {
      if (dockRef.current && !dockRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, [menuOpen]);

  const activeIndex = sections.findIndex(({ id }) => id === activeId);
  const current = activeIndex >= 0 ? sections[activeIndex] : null;
  const dockVisible = current !== null && !atEnd;

  return (
    <>
      <aside className="hidden lg:block" aria-label="Sommaire de la page">
        <nav className="sticky top-28">
          <p className={styles.eyebrow}>Sur cette page</p>
          <div className={`${styles.rail} mt-4`} style={{ '--i': Math.max(activeIndex, 0) } as CSSProperties}>
            <span className={styles.railTrack} aria-hidden="true" />
            <span className={styles.railThumb} aria-hidden="true" />
            <ol>
              {sections.map(({ id, label }) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={(event) => onAnchorClick(event, id)} className={styles.railLink} aria-current={id === activeId ? 'location' : undefined}>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>
      </aside>

      <div ref={dockRef} className={`${styles.dock} ${dockVisible ? '' : styles.dockHidden} lg:hidden`} inert={!dockVisible}>
        {menuOpen && (
          <nav id="sommaire-mobile" aria-label="Sommaire de la page" className={`${styles.glass} ${styles.glassDense} ${styles.sheetMenu} mb-3 p-2`}>
            <ol className="grid gap-1">
              {sections.map(({ id, label }, index) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    onClick={(event) => onAnchorClick(event, id, () => setMenuOpen(false))}
                    aria-current={id === activeId ? 'location' : undefined}
                    className={`${styles.railLink} !h-12 gap-3 text-base aria-[current=location]:bg-white/70`}
                  >
                    <span className={`${styles.serif} w-6 text-[#1d56c0]`}>{index + 1}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className={`${styles.glass} ${styles.glassDense} flex items-center justify-between gap-3 !rounded-[1.25rem] p-2 pl-4`}>
          <p className="min-w-0 truncate text-[0.9375rem] font-semibold text-[#0b2545]">
            <span className="text-[#465f80]">{activeIndex + 1}/{sections.length}</span> · {current?.label}
          </p>
          <button
            type="button"
            className={`${styles.btn} shrink-0 px-4 py-2.5`}
            aria-expanded={menuOpen}
            aria-controls="sommaire-mobile"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ListTree className="h-4 w-4" aria-hidden="true" />}
            Sommaire
          </button>
        </div>
      </div>
    </>
  );
}
