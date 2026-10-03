'use client';

import type { ReactNode } from 'react';
import { onAnchorClick } from './scroll';

export default function AnchorLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  return (
    <a href={`#${to}`} onClick={(event) => onAnchorClick(event, to)} className={className}>
      {children}
    </a>
  );
}
