import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  Check,
  DatabaseBackup,
  Eye,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sécurité et protection des données | Workermate',
  description: 'Découvrez comment Workermate structure la protection des données, les accès par rôle, les sauvegardes et le monitoring de la plateforme.',
};

const accessRows = [
  { role: 'Administrateur', project: 'Complet', billing: 'Complet', team: 'Gérer', tone: 'bg-emerald-400' },
  { role: 'Conducteur', project: 'Éditer', billing: 'Voir', team: 'Voir', tone: 'bg-sky-400' },
  { role: 'Intervenant', project: 'Voir', billing: '—', team: '—', tone: 'bg-amber-400' },
];

const telemetry = [
  { time: '14:32:08', label: 'Accès vérifié', detail: 'Espace entreprise · Paris', color: 'text-emerald-300' },
  { time: '14:31:42', label: 'Sauvegarde validée', detail: 'Base de données · lot #8472', color: 'text-sky-300' },
  { time: '14:30:16', label: 'Session renouvelée', detail: 'Compte administrateur', color: 'text-amber-300' },
  { time: '14:29:54', label: 'Service disponible', detail: 'API Workermate · 248 ms', color: 'text-emerald-300' },
];

function RaisedSurface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[1.75rem] border border-white/10 bg-[#202a31] shadow-[10px_12px_24px_rgba(7,12,16,0.45),-8px_-8px_22px_rgba(86,104,113,0.1)] ${className}`}>{children}</div>;
}

function PressedSurface({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-black/20 bg-[#182127] shadow-[inset_5px_6px_12px_rgba(5,10,13,0.65),inset_-5px_-5px_12px_rgba(76,96,105,0.08)] ${className}`}>{children}</div>;
}

export default function SecurityPage() {
  return (
    <div className="overflow-hidden bg-[#11191f] text-slate-100">
      <section className="relative border-b border-white/10 bg-[#172229]">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '32px 32px' }} aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 sm:px-6 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-teal-300">
              <span className="h-2 w-2 rounded-full bg-teal-300 shadow-[0_0_14px_#5eead4]" />
              Sécurité, sans théâtre
            </div>
            <h1 className="mt-6 max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl">Vos données méritent mieux qu’une promesse.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Workermate rend la protection visible : qui entre, ce qui change, ce qui est sauvegardé et ce qui se passe maintenant.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-5 py-3 text-sm font-bold text-[#102126] shadow-[4px_5px_0_#0b6665] transition hover:translate-y-0.5 hover:shadow-[2px_3px_0_#0b6665]">Commencer sereinement <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <a href="#controle" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10">Voir le contrôle en détail</a>
            </div>
          </div>

          <RaisedSurface className="relative p-4 sm:p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-300 text-[#102126] shadow-[inset_2px_2px_4px_rgba(255,255,255,.45),3px_4px_8px_rgba(0,0,0,.3)]"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-sm font-bold text-white">Centre de confiance</p><p className="text-xs text-slate-400">Vue de démonstration</p></div></div>
              <span className="flex items-center gap-2 text-xs font-bold text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-300" />Stable</span>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.1fr]">
              <PressedSurface className="p-4">
                <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-widest text-slate-500">Indice de contrôle</span><Eye className="h-4 w-4 text-teal-300" aria-hidden="true" /></div>
                <div className="mt-4 flex items-end gap-2"><span className="text-5xl font-black text-white">98</span><span className="mb-2 text-sm text-slate-500">/100</span></div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full w-[98%] rounded-full bg-gradient-to-r from-teal-400 to-emerald-300" /></div>
                <p className="mt-3 text-xs text-slate-400">Contrôles suivis en continu</p>
              </PressedSurface>
              <div className="space-y-2">
                {['Accès contrôlés', 'Données isolées', 'Sauvegardes suivies', 'Alertes configurées'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-slate-300"><span className="grid h-6 w-6 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span>{item}</div>)}
              </div>
            </div>
            <p className="mt-5 text-[11px] leading-5 text-slate-500">Les indicateurs affichés ici illustrent le type de contrôle suivi par la plateforme. Ils ne constituent pas une certification.</p>
          </RaisedSurface>
        </div>
      </section>

      <section id="controle" className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-teal-300">Une sécurité qui se lit</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Pas une vitrine. Un tableau de bord.</h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">Les sujets sensibles ne sont pas rangés dans une succession de promesses. Ils forment un système : identité, périmètre, sauvegarde, signaux.</p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <RaisedSurface className="overflow-hidden p-6 sm:p-8">
            <div className="flex items-start justify-between gap-5"><div><span className="text-xs font-bold uppercase tracking-widest text-sky-300">01 / Périmètre</span><h3 className="mt-3 text-2xl font-black text-white">Chaque entreprise garde son espace.</h3></div><Network className="h-8 w-8 text-sky-300" aria-hidden="true" /></div>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">Les données sont rattachées à l’entreprise active et les opérations sont filtrées par ce périmètre. Une séparation compréhensible, au cœur du fonctionnement.</p>
            <div className="mt-8 flex items-center justify-center gap-2 sm:gap-5"><div className="grid h-20 w-20 place-items-center rounded-full border border-sky-300/30 bg-sky-300/10 text-center text-[11px] font-bold text-sky-200 shadow-[0_0_30px_rgba(125,211,252,.12)]">Entreprise<br />A</div><div className="h-px w-8 bg-sky-300/50 sm:w-16" /><div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#172229] text-center text-[10px] font-bold text-slate-400 shadow-[inset_3px_3px_8px_rgba(0,0,0,.6)]"><LockKeyhole className="mx-auto mb-1 h-4 w-4 text-teal-300" aria-hidden="true" />isolé</div><div className="h-px w-8 bg-sky-300/50 sm:w-16" /><div className="grid h-20 w-20 place-items-center rounded-full border border-sky-300/30 bg-sky-300/10 text-center text-[11px] font-bold text-sky-200 shadow-[0_0_30px_rgba(125,211,252,.12)]">Entreprise<br />B</div></div>
          </RaisedSurface>

          <RaisedSurface className="p-6 sm:p-8"><div className="flex items-start justify-between gap-5"><div><span className="text-xs font-bold uppercase tracking-widest text-amber-300">02 / Identité</span><h3 className="mt-3 text-2xl font-black text-white">Les rôles sont des clés, pas des décorations.</h3></div><KeyRound className="h-8 w-8 text-amber-300" aria-hidden="true" /></div><p className="mt-4 text-sm leading-6 text-slate-400">Chaque rôle ouvre le bon tiroir, avec le minimum nécessaire pour travailler efficacement.</p><div className="mt-7 overflow-hidden rounded-xl border border-white/10"><div className="grid grid-cols-4 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500"><span className="col-span-1">Rôle</span><span>Projets</span><span>Factures</span><span>Équipe</span></div>{accessRows.map((row) => <div key={row.role} className="grid grid-cols-4 items-center border-t border-white/5 px-3 py-3 text-xs"><span className="col-span-1 flex min-w-0 items-center gap-2 font-semibold text-slate-200"><span className={`h-2 w-2 rounded-full ${row.tone}`} />{row.role}</span><span className="text-slate-400">{row.project}</span><span className="text-slate-400">{row.billing}</span><span className="text-slate-400">{row.team}</span></div>)}</div></RaisedSurface>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#dfe6e2] py-20 text-[#17252a] sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-teal-700">03 / Continuité</p><h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Une sauvegarde doit rassurer avant de servir.</h2><p className="mt-5 max-w-lg text-lg leading-8 text-slate-600">Le bon réflexe n’est pas de croiser les doigts. C’est de savoir quand la dernière copie a été prise, contrôlée et mise à l’abri.</p><div className="mt-7 flex items-center gap-3 text-sm font-bold text-teal-800"><DatabaseBackup className="h-5 w-5" aria-hidden="true" />Suivi de sauvegarde à rendre vérifiable</div></div>
            <PressedSurface className="p-5 text-slate-200 sm:p-7"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-slate-500">Chaîne de sauvegarde</p><p className="mt-1 text-lg font-black text-white">Aujourd’hui</p></div><RefreshCw className="h-5 w-5 text-teal-300" aria-hidden="true" /></div><div className="mt-8 space-y-5">{['Données préparées', 'Copie chiffrée créée', 'Intégrité contrôlée', 'Point de restauration disponible'].map((label, index) => <div key={label} className="flex items-center gap-4"><div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal-300 text-[#102126] shadow-[3px_4px_0_#0a5555]"><Check className="h-4 w-4" aria-hidden="true" />{index < 3 && <span className="absolute left-1/2 top-9 h-5 w-px bg-teal-300/40" />}</div><div className="flex-1 border-b border-white/10 pb-4"><div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold text-white">{label}</span><span className="font-mono text-xs text-slate-500">{['14:31', '14:32', '14:32', '14:33'][index]}</span></div></div></div>)}</div><p className="mt-7 text-xs leading-5 text-slate-500">La politique exacte de rétention et de restauration doit être confirmée selon l’environnement de production déployé.</p></PressedSurface>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-6 sm:py-28"><div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-300">04 / Vigilance</p><h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">Quand tout va bien, on le voit.</h2></div><div className="flex items-center gap-2 text-sm text-slate-400"><BellRing className="h-4 w-4 text-rose-300" aria-hidden="true" />Signaux de démonstration</div></div>
        <RaisedSurface className="mt-12 overflow-hidden p-4 sm:p-7"><div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]"><div className="min-w-0"><div className="mb-5 flex items-center justify-between"><span className="font-mono text-xs uppercase tracking-widest text-slate-500">Flux de supervision</span><span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">LIVE · exemple</span></div><div className="space-y-1 font-mono">{telemetry.map((entry) => <div key={entry.time} className="grid grid-cols-[auto_1fr] gap-3 border-b border-white/5 py-3 text-xs sm:grid-cols-[5.5rem_1fr_auto] sm:items-center"><span className="text-slate-600">{entry.time}</span><span className={`font-bold ${entry.color}`}>{entry.label}</span><span className="col-start-2 text-slate-500 sm:col-start-auto">{entry.detail}</span></div>)}</div></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2"><PressedSurface className="p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Disponibilité</p><p className="mt-2 text-2xl font-black text-emerald-300">99,9<span className="text-sm">%</span></p><div className="mt-3 h-1.5 rounded-full bg-black/40"><div className="h-full w-[93%] rounded-full bg-emerald-300" /></div></PressedSurface><PressedSurface className="p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Alertes ouvertes</p><p className="mt-2 text-2xl font-black text-white">00</p><p className="mt-3 text-xs text-slate-500">à traiter</p></PressedSurface><PressedSurface className="p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Latence API</p><p className="mt-2 text-2xl font-black text-sky-300">248<span className="text-sm">ms</span></p><p className="mt-3 text-xs text-slate-500">fenêtre actuelle</p></PressedSurface><PressedSurface className="p-4"><p className="text-[10px] uppercase tracking-widest text-slate-500">Région</p><p className="mt-2 text-2xl font-black text-amber-300">EU</p><p className="mt-3 text-xs text-slate-500">configuration cible</p></PressedSurface></div></div></RaisedSurface>
      </section>

      <section className="border-t border-white/10 bg-[#172229] py-20 sm:py-24"><div className="mx-auto max-w-5xl px-5 text-center sm:px-6"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-teal-300 text-[#102126] shadow-[5px_6px_0_#0b6665]"><Fingerprint className="h-7 w-7" aria-hidden="true" /></span><h2 className="mt-6 text-3xl font-black text-white sm:text-4xl">La confiance se construit dans les détails.</h2><p className="mx-auto mt-4 max-w-2xl text-slate-400">Découvrez Workermate avec une base claire : des espaces séparés, des rôles lisibles et une activité observable.</p><div className="mt-8 flex flex-wrap justify-center gap-3"><Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-teal-300 px-6 py-3 text-sm font-bold text-[#102126] shadow-[4px_5px_0_#0b6665] transition hover:translate-y-0.5">Créer mon espace <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/contact" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"><SlidersHorizontal className="h-4 w-4" aria-hidden="true" />Parler à l’équipe</Link></div><div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs text-slate-500"><span className="inline-flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-teal-300" aria-hidden="true" />Accès par rôle</span><span className="inline-flex items-center gap-2"><UsersRound className="h-4 w-4 text-teal-300" aria-hidden="true" />Espace entreprise</span><span className="inline-flex items-center gap-2"><DatabaseBackup className="h-4 w-4 text-teal-300" aria-hidden="true" />Sauvegardes suivies</span></div></div></section>
    </div>
  );
}
