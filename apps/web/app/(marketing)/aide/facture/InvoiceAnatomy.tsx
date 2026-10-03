'use client';

import { type ReactNode, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './facture.module.css';
import { onAnchorClick } from './scroll';

const pins = [
  {
    id: 'numero',
    title: 'Numéro et dates',
    text: 'Le numéro est attribué automatiquement à l’enregistrement : préfixe, année et compteur sur quatre chiffres. Le compteur repart à 0001 chaque année. La date d’émission est obligatoire ; l’échéance sert aussi aux relances.',
    link: 'preparer',
  },
  {
    id: 'client',
    title: 'Client',
    text: 'Remplissez la facture depuis un client existant ou créez-le sans quitter le formulaire. Son adresse est reprise sur le document ; son email sert à l’envoi.',
    link: 'creer',
  },
  {
    id: 'chantier',
    title: 'Chantier',
    text: 'Rattachez la facture à un chantier existant ou créez-le à la volée. La référence, le titre et l’adresse du chantier figurent sur le document.',
    link: 'sources',
  },
  {
    id: 'lignes',
    title: 'Lignes de facture',
    text: 'Ajoutez des lignes depuis le catalogue, le devis ou le chantier, ou saisissez une ligne libre. Une ligne se déplace avec ses flèches ou en la glissant.',
    link: 'lignes',
  },
  {
    id: 'tva',
    title: 'TVA par taux',
    text: 'La TVA est ventilée par taux. Les remises et les frais, sur une ligne ou sur toute la facture, ont chacun leur catégorie et leur taux de TVA.',
    link: 'calcul',
  },
  {
    id: 'net',
    title: 'Net à payer',
    text: 'C’est le total TTC moins l’acompte déjà versé : le montant que votre client doit réellement régler.',
    link: 'acompte',
  },
] as const;

type PinId = (typeof pins)[number]['id'];

function Pin({ index, active, onSelect }: { index: number; active: boolean; onSelect: () => void }) {
  const pin = pins[index];
  return (
    <button
      type="button"
      className={`${styles.btn} ${styles.pin}`}
      aria-pressed={active}
      aria-controls="repere"
      aria-label={`Repère ${index + 1} : ${pin.title}`}
      onClick={onSelect}
    >
      {index + 1}
    </button>
  );
}

function Row({ index, active, onSelect, children }: { index: number; active: PinId; onSelect: (id: PinId) => void; children: ReactNode }) {
  const pin = pins[index];
  const on = active === pin.id;
  return (
    <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-start gap-2.5 sm:gap-3.5">
      <Pin index={index} active={on} onSelect={() => onSelect(pin.id)} />
      <div className={`${styles.zone} ${on ? styles.zoneOn : ''}`}>{children}</div>
    </div>
  );
}

export default function InvoiceAnatomy() {
  const [active, setActive] = useState<PinId>('lignes');
  const activeIndex = pins.findIndex((pin) => pin.id === active);
  const pin = pins[activeIndex];

  function step(delta: number) {
    setActive(pins[(activeIndex + delta + pins.length) % pins.length].id);
  }

  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgba(120,174,236,0.65),transparent)] sm:h-96 sm:w-96" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 -left-12 h-64 w-64 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.95),transparent)]" />

      <div className={`${styles.glass} ${styles.sheet} relative p-4 pb-14 sm:p-6 sm:pb-16`} role="group" aria-label="Exemple de facture annotée">
        <div className="mb-4 flex items-center justify-between gap-3 pl-[3.25rem] sm:pl-[3.75rem]">
          <p className={styles.zoneLabel}>Exemple illustratif</p>
          <p className={`${styles.serif} text-xl font-semibold tracking-wide text-[#0b2545]`}>FACTURE</p>
        </div>

        <div className="space-y-3">
          <Row index={0} active={active} onSelect={setActive}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="num font-bold text-[#0b2545]">N° FAC-2026-0042</p>
              <p className="num text-[0.9375rem] text-[#223d5c]">Émise le 02/10/2026 · échéance le 01/11/2026</p>
            </div>
          </Row>

          <Row index={1} active={active} onSelect={setActive}>
            <p className={styles.zoneLabel}>Client</p>
            <p className="font-semibold text-[#0b2545]">Claire Fontaine</p>
            <p className="text-[0.9375rem] text-[#223d5c]">8 rue des Lilas, 45000 Orléans</p>
          </Row>

          <Row index={2} active={active} onSelect={setActive}>
            <p className={styles.zoneLabel}>Infos chantier</p>
            <p className="font-semibold text-[#0b2545]">Rénovation salle de bain</p>
            <p className="text-[0.9375rem] text-[#223d5c]">Réf. CH-0014 · 45000 Orléans</p>
          </Row>

          <Row index={3} active={active} onSelect={setActive}>
            <table className="w-full text-[0.9375rem]">
              <caption className="sr-only">Lignes de la facture</caption>
              <thead>
                <tr className={`${styles.zoneLabel} text-left`}>
                  <th scope="col" className="pb-1.5 pr-2 font-bold">Désignation</th>
                  <th scope="col" className="hidden pb-1.5 pr-2 text-right font-bold sm:table-cell">Qté</th>
                  <th scope="col" className="hidden pb-1.5 pr-2 text-right font-bold sm:table-cell">PU HT</th>
                  <th scope="col" className="hidden pb-1.5 pr-2 text-right font-bold sm:table-cell">TVA</th>
                  <th scope="col" className="pb-1.5 text-right font-bold whitespace-nowrap">Total HT</th>
                </tr>
              </thead>
              <tbody className="num divide-y divide-[#9fb8d8]/40 text-[#0b2545]">
                {[
                  ['Dépose de la baignoire', '1 forfait', '280,00', '10 %', '280,00'],
                  ['Pose du carrelage mural', '12 m²', '55,00', '10 %', '660,00'],
                  ['Mitigeur thermostatique', '1 u', '189,00', '20 %', '189,00'],
                ].map(([label, qty, unit, vat, total]) => (
                  <tr key={label}>
                    <td className="py-1.5 pr-2 align-top">
                      {label}
                      <span className="block text-[0.8125rem] text-[#465f80] sm:hidden">{qty} × {unit} € · TVA {vat}</span>
                    </td>
                    <td className="hidden py-1.5 pr-2 text-right align-top sm:table-cell">{qty}</td>
                    <td className="hidden py-1.5 pr-2 text-right align-top sm:table-cell">{unit}</td>
                    <td className="hidden py-1.5 pr-2 text-right align-top sm:table-cell">{vat}</td>
                    <td className="py-1.5 text-right align-top font-semibold whitespace-nowrap">{total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Row>

          <Row index={4} active={active} onSelect={setActive}>
            <dl className="num grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 text-[0.9375rem] text-[#223d5c]">
              <dt>Sous-total lignes</dt>
              <dd className="text-right">1 129,00 €</dd>
              <dt>Total HT</dt>
              <dd className="text-right font-semibold text-[#0b2545]">1 129,00 €</dd>
              <dt>TVA 10 % (base 940,00 €)</dt>
              <dd className="text-right">94,00 €</dd>
              <dt>TVA 20 % (base 189,00 €)</dt>
              <dd className="text-right">37,80 €</dd>
              <dt className="font-semibold text-[#0b2545]">Total TTC</dt>
              <dd className="text-right font-semibold text-[#0b2545]">1 260,80 €</dd>
            </dl>
          </Row>

          <Row index={5} active={active} onSelect={setActive}>
            <div className="num flex items-baseline justify-between gap-4 text-[0.9375rem] text-[#223d5c]">
              <span>Acompte déjà versé</span>
              <span>− 300,00 €</span>
            </div>
            <div className={`${styles.plaque} mt-2 flex items-baseline justify-between gap-4 px-4 py-2.5`}>
              <span className="text-[0.9375rem] font-semibold">Net à payer</span>
              <span className={`${styles.serif} num text-2xl font-semibold`}>960,80 €</span>
            </div>
          </Row>
        </div>
      </div>

      <div id="repere" aria-live="polite" className={`${styles.glass} ${styles.glassDense} relative -mt-9 ml-4 mr-0 p-5 sm:ml-10 sm:p-6`}>
        <div key={pin.id} className={styles.rise}>
          <p className={styles.eyebrow}>Repère {activeIndex + 1} sur {pins.length}</p>
          <p className={`${styles.serif} mt-1 text-2xl font-semibold leading-tight text-[#0b2545]`}>{pin.title}</p>
          <p className="mt-2 text-[1rem] leading-relaxed text-[#223d5c]">{pin.text}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <a href={`#${pin.link}`} onClick={(event) => onAnchorClick(event, pin.link)} className={`${styles.btn} px-4 py-2.5`}>
            Voir le détail <ArrowRight className="h-4 w-4 text-[#1d56c0]" aria-hidden="true" />
          </a>
          <div className="flex gap-2">
            <button type="button" className={`${styles.btn} h-11 w-11 !rounded-full p-0`} onClick={() => step(-1)} aria-label="Repère précédent">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" className={`${styles.btn} h-11 w-11 !rounded-full p-0`} onClick={() => step(1)} aria-label="Repère suivant">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
