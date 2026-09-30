import Link from 'next/link';
import { Mail, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-700">Contact</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">Parlons de votre activité</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">Une question sur Workermate, sur les tarifs, ou besoin d’aide pour démarrer ? Notre équipe vous répond rapidement.</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <a href="mailto:contact@workermate.fr" className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Mail className="h-5 w-5" aria-hidden="true" /></span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">Par email</h2>
          <p className="mt-2 text-sm text-slate-600">contact@workermate.fr</p>
          <span className="mt-4 text-sm font-semibold text-indigo-700 group-hover:underline">Envoyer un message →</span>
        </a>
        <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><MessageCircle className="h-5 w-5" aria-hidden="true" /></span>
          <h2 className="mt-4 text-base font-semibold text-slate-900">Déjà client ?</h2>
          <p className="mt-2 text-sm text-slate-600">Connectez-vous à votre espace pour accéder directement à votre tableau de bord.</p>
          <Link href="/login" className="mt-4 text-sm font-semibold text-indigo-700 hover:underline">Se connecter →</Link>
        </div>
      </div>

      <div className="mt-16 rounded-3xl bg-slate-50 p-8 text-center sm:p-12">
        <h2 className="text-2xl font-bold text-slate-900">Pas encore de compte ?</h2>
        <p className="mt-2 text-slate-600">Créez votre espace en quelques minutes et découvrez Workermate gratuitement.</p>
        <Link href="/register" className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700">Essayer gratuitement</Link>
      </div>
    </section>
  );
}
