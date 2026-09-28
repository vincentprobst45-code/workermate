'use client';

import { useState } from 'react';
import Header from './Header';
import VerticalHeader from './VerticalHeader';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <>
      <Header onOpenMenu={() => setMobileNavOpen(true)} />
      <div className="flex min-h-[calc(100vh)] items-stretch">
        <VerticalHeader mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </>
  );
}
