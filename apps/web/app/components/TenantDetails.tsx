'use client';

import type { PaymentAccount } from './AddBankAccountForm';

export interface TenantAddress {
  id: string;
  street1?: string | null;
  street2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryCode?: string | null;
}

export interface TenantProfile {
  id: string;
  name: string;
  addressId?: string | null;
  address?: TenantAddress | null;
  email?: string | null;
  phoneNumber?: string | null;
  siretNumber?: string | null;
  vatNumber?: string | null;
  logoFileId?: string | null;
  defaultCurrency: string;
  defaultPaymentTerms?: string | null;
  defaultLegalMentions?: string | null;
  defaultInvoiceNotes?: string | null;
  emailRemindersEnabled: boolean;
  emailReminderDelayDays: number;
  emailReminderRepeatDays: number;
  emailReminderMaxAttempts: number;
  defaultPaymentAccountId?: string | null;
  VatLiabilityRegime?: 'FRANCHISE_BASE' | 'LIABLE' | null;
  vatReturnFrequency?: 'MONTHLY' | 'QUARTERLY' | null;
  paymentAccounts?: PaymentAccount[];
}

type TenantDetailsProps = {
  tenant: TenantProfile;
  onEdit: () => void;
};

function formatAddress(address?: TenantAddress | null) {
  if (!address) return 'Aucune adresse renseignée';
  const lines = [
    [address.street1, address.street2].filter(Boolean).join(' '),
    [address.postalCode, address.city].filter(Boolean).join(' '),
    address.countryCode,
  ].filter(Boolean);
  return lines.length ? lines.join(', ') : 'Aucune adresse renseignée';
}

function getCurrencyLabel(currency: string) {
  const labels: Record<string, string> = {
    EUR: 'Euro (€)',
    USD: 'Dollar américain ($)',
    GBP: 'Livre sterling (£)',
    CHF: 'Franc suisse (CHF)',
    CAD: 'Dollar canadien (CA$)',
    AUD: 'Dollar australien (AU$)',
  };
  return labels[currency] || currency;
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-900">{value || 'Non renseigné'}</dd>
    </div>
  );
}

export default function TenantDetails({ tenant, onEdit }: TenantDetailsProps) {
  const defaultAccount = tenant.paymentAccounts?.find((account) => account.id === tenant.defaultPaymentAccountId);
  const vatRegime = tenant.VatLiabilityRegime === 'FRANCHISE_BASE' ? 'Franchise en base' : 'Assujetti à la TVA';
  const vatFrequency = tenant.vatReturnFrequency === 'QUARTERLY' ? 'Trimestrielle' : 'Mensuelle';

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-2xl font-semibold text-white">
            {tenant.name.slice(0, 1).toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Fiche entreprise</p>
            <h2 className="mt-1 truncate text-2xl font-semibold text-slate-900">{tenant.name}</h2>
            <p className="mt-1 text-sm text-slate-500">Profil utilisé sur vos factures et devis</p>
          </div>
        </div>
        <button type="button" onClick={onEdit} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          Modifier
        </button>
      </div>

      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Identité et contact</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Adresse de facturation" value={formatAddress(tenant.address)} />
            <InfoItem label="Email" value={tenant.email} />
            <InfoItem label="Téléphone" value={tenant.phoneNumber} />
            <InfoItem label="SIRET" value={tenant.siretNumber} />
            <InfoItem label="TVA intracommunautaire" value={tenant.vatNumber} />
            <InfoItem label="Logo" value={tenant.logoFileId ? 'Logo configuré' : 'Non configuré'} />
          </dl>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Paramètres de facturation</h3>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoItem label="Devise par défaut" value={getCurrencyLabel(tenant.defaultCurrency)} />
            <InfoItem label="Compte bancaire par défaut" value={defaultAccount ? `${defaultAccount.name} · ${defaultAccount.iban}` : 'Aucun compte sélectionné'} />
            <InfoItem label="Régime de TVA" value={vatRegime} />
            {tenant.VatLiabilityRegime === 'LIABLE' && <InfoItem label="Déclaration de TVA" value={vatFrequency} />}
            <InfoItem label="Comptes bancaires" value={`${tenant.paymentAccounts?.length || 0} compte${tenant.paymentAccounts?.length === 1 ? '' : 's'}`} />
          </dl>
        </div>
      </div>

      <div className="border-t border-slate-200 px-5 py-4 sm:px-7">
        <p className="text-xs text-slate-500">Les paramètres de facturation s&apos;appliquent aux nouveaux documents. Les documents déjà créés restent inchangés.</p>
      </div>
    </section>
  );
}
