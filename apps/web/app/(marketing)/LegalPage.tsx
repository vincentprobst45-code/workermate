import type { ReactNode } from 'react';

export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <article className="bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-16 sm:px-6 sm:py-24">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{intro}</p>
          <p className="mt-6 text-sm text-slate-500">Dernière mise à jour : {updatedAt}</p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">
        <div className="mb-10 border-l-4 border-amber-400 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
          <strong>Document à finaliser :</strong> les informations d’identification de l’éditeur et certains éléments contractuels doivent être complétés et validés avant l’ouverture commerciale du service.
        </div>
        <div className="space-y-10 text-[1.02rem] leading-8 text-slate-700 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:leading-7 [&_h2]:text-slate-950 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-slate-950 [&_li]:pl-2 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
          {children}
        </div>
      </div>
    </article>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
