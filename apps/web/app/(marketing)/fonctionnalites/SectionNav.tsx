'use client';

import { useEffect, useState } from 'react';

export interface FeatureSection {
  id: string;
  label: string;
}

export default function SectionNav({ sections }: { sections: FeatureSection[] }) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => Boolean(element));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          setActiveId(mostVisible.target.id);
        }
      },
      { rootMargin: '-35% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections]);

  const activeIndex = sections.findIndex((section) => section.id === activeId);

  const scrollToSection = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="Sections de la page" className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block">
      <ol className="relative flex flex-col items-end gap-5">
        <span className="absolute right-[5px] top-1 bottom-1 w-px bg-blue-200" aria-hidden="true" />
        {sections.map((section, index) => {
          const distance = Math.abs(index - activeIndex);
          const isActive = distance === 0;
          const isNear = distance === 1;
          const glowOpacity = isActive ? 0.6 : isNear ? 0.25 : 0;

          return (
            <li key={section.id} className="relative">
              <a
                href={`#${section.id}`}
                onClick={scrollToSection(section.id)}
                aria-current={isActive ? 'true' : undefined}
                className="group flex items-center gap-3"
              >
                <span
                  className={`text-xs font-medium uppercase tracking-wide transition-colors duration-300 ${
                    isActive ? 'text-blue-700' : isNear ? 'text-blue-400' : 'text-slate-400 group-hover:text-blue-500'
                  }`}
                >
                  {section.label}
                </span>
                <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                  {/* radiating glow, strongest on the active section and faded on its neighbors */}
                  <span
                    className="absolute h-9 w-9 rounded-full bg-blue-500 blur-md transition-opacity duration-500"
                    style={{ opacity: glowOpacity }}
                    aria-hidden="true"
                  />
                  <span
                    className={`relative h-2.5 w-2.5 rounded-full border transition-all duration-300 ${
                      isActive ? 'scale-125 border-blue-600 bg-blue-600' : 'border-blue-300 bg-white group-hover:border-blue-500'
                    }`}
                  />
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
