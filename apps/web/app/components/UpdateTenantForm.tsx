'use client';

import { FormEvent, useState } from 'react';
import { useApiClient } from '../api-client';
import SelectExistingAddress from './SelectExistingAddress';
import AddressForm, { type AddAddressFormData, createEmptyAddress } from './AddressForm';
import AddBankAccountForm, { type PaymentAccount } from './AddBankAccountForm';
import type { TenantProfile } from './TenantDetails';

type VatLiabilityRegime = 'FRANCHISE_BASE' | 'LIABLE';
type VatReturnFrequency = 'MONTHLY' | 'QUARTERLY';
type AddressMode = 'new' | 'existing';

type TenantFormData = {
  name: string; logoFileId: string; addressId: string; phoneNumber: string; email: string;
  siretNumber: string; vatNumber: string; defaultPaymentAccountId: string;
  defaultPaymentTerms: string; defaultLegalMentions: string; defaultInvoiceNotes: string;
  emailRemindersEnabled: boolean; emailReminderDelayDays: number; emailReminderRepeatDays: number; emailReminderMaxAttempts: number;
  defaultCurrency: string; VatLiabilityRegime: VatLiabilityRegime; vatReturnFrequency: VatReturnFrequency;
};

type UpdateTenantFormProps = {
  tenant: TenantProfile;
  onCancel: () => void;
  onSaved: (tenant: TenantProfile) => void;
};

const CURRENCY_OPTIONS = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'Dollar américain', symbol: '$' },
  { code: 'GBP', label: 'Livre sterling', symbol: '£' },
  { code: 'CHF', label: 'Franc suisse', symbol: 'CHF' },
  { code: 'CAD', label: 'Dollar canadien', symbol: 'CA$' },
  { code: 'AUD', label: 'Dollar australien', symbol: 'AU$' },
];

function mapTenantToForm(tenant: TenantProfile): TenantFormData {
  return {
    name: tenant.name || '', logoFileId: tenant.logoFileId || '', addressId: tenant.addressId || '',
    phoneNumber: tenant.phoneNumber || '', email: tenant.email || '', siretNumber: tenant.siretNumber || '',
    vatNumber: tenant.vatNumber || '', defaultPaymentAccountId: tenant.defaultPaymentAccountId || '',
    defaultPaymentTerms: tenant.defaultPaymentTerms || '', defaultLegalMentions: tenant.defaultLegalMentions || '',
    defaultInvoiceNotes: tenant.defaultInvoiceNotes || '', defaultCurrency: tenant.defaultCurrency || 'EUR',
    emailRemindersEnabled: tenant.emailRemindersEnabled ?? false,
    emailReminderDelayDays: tenant.emailReminderDelayDays ?? 3,
    emailReminderRepeatDays: tenant.emailReminderRepeatDays ?? 7,
    emailReminderMaxAttempts: tenant.emailReminderMaxAttempts ?? 3,
    VatLiabilityRegime: tenant.VatLiabilityRegime || 'LIABLE', vatReturnFrequency: tenant.vatReturnFrequency || 'MONTHLY',
  };
}

export default function UpdateTenantForm({ tenant, onCancel, onSaved }: UpdateTenantFormProps) {
  const api = useApiClient();
  const [form, setForm] = useState(() => mapTenantToForm(tenant));
  const [addressMode, setAddressMode] = useState<AddressMode>(tenant.addressId ? 'existing' : 'new');
  const [newAddress, setNewAddress] = useState<AddAddressFormData>(createEmptyAddress());
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>(tenant.paymentAccounts || []);
  const [showBankModal, setShowBankModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await api.put('/tenants/current', {
        name: form.name,
        logoFileId: form.logoFileId,
        addressId: addressMode === 'existing' ? form.addressId : undefined,
        address: addressMode === 'new' ? newAddress : undefined,
        phoneNumber: form.phoneNumber,
        email: form.email,
        siretNumber: form.siretNumber,
        vatNumber: form.vatNumber,
        defaultPaymentAccountId: form.defaultPaymentAccountId || undefined,
        defaultPaymentTerms: form.defaultPaymentTerms,
        defaultLegalMentions: form.defaultLegalMentions,
        defaultInvoiceNotes: form.defaultInvoiceNotes,
        emailRemindersEnabled: form.emailRemindersEnabled,
        emailReminderDelayDays: Number(form.emailReminderDelayDays),
        emailReminderRepeatDays: Number(form.emailReminderRepeatDays),
        emailReminderMaxAttempts: Number(form.emailReminderMaxAttempts),
        defaultCurrency: form.defaultCurrency,
        VatLiabilityRegime: form.VatLiabilityRegime,
        vatReturnFrequency: form.VatLiabilityRegime === 'LIABLE' ? form.vatReturnFrequency : undefined,
      });
      if (!response.ok) throw new Error('La mise à jour a échoué.');
      onSaved(await response.json() as TenantProfile);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'La mise à jour a échoué.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Configuration</p><h2 id="update-tenant-title" className="mt-1 text-xl font-semibold text-slate-900">Modifier l&apos;entreprise</h2><p className="mt-1 text-sm text-slate-500">Les changements s&apos;appliqueront aux nouveaux documents.</p></div>
          <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">Fermer</button>
        </div>
        {error && <div className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-slate-900">Profil de l&apos;entreprise</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">Nom<input required className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="sm:col-span-2 text-sm font-medium text-slate-700">Identifiant du logo principal<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.logoFileId} onChange={(e) => setForm({ ...form, logoFileId: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Téléphone<input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">Email<input type="email" className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">SIRET<span className="mt-1 block text-xs font-normal text-slate-500">14 chiffres, sans espaces.</span><input inputMode="numeric" className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.siretNumber} onChange={(e) => setForm({ ...form, siretNumber: e.target.value })} /></label>
            <label className="text-sm font-medium text-slate-700">TVA intracommunautaire<span className="mt-1 block text-xs font-normal text-slate-500">Exemple : FRXX123456789.</span><input className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 uppercase" value={form.vatNumber} onChange={(e) => setForm({ ...form, vatNumber: e.target.value.toUpperCase() })} /></label>
            <div className="sm:col-span-2"><p className="text-sm font-medium text-slate-700">Adresse de facturation</p><p className="mt-1 text-xs text-slate-500">Cette adresse sera affichée sur vos factures et devis. « Aucune adresse » la désassocie des prochains documents.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" className={`rounded border px-3 py-2 text-sm ${addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => setAddressMode('new')}>Nouvelle adresse</button><button type="button" className={`rounded border px-3 py-2 text-sm ${addressMode === 'existing' && form.addressId ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`} onClick={() => setAddressMode('existing')}>Adresse existante</button><button type="button" className={`rounded border px-3 py-2 text-sm ${addressMode === 'existing' && !form.addressId ? 'border-red-300 bg-red-50 text-red-700' : 'bg-white text-slate-900'}`} onClick={() => { setAddressMode('existing'); setForm({ ...form, addressId: '' }); }}>Aucune adresse</button></div>{addressMode === 'existing' ? <SelectExistingAddress selectedAddressId={form.addressId} onAddressChange={(addressId) => setForm({ ...form, addressId })} required={false} /> : <div className="mt-3"><AddressForm address={newAddress} onChange={setNewAddress} /></div>}</div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">Facturation</h3><p className="mt-1 text-sm text-slate-600">Valeurs par défaut des nouveaux documents.</p><div className="mt-4 grid gap-4"><label className="text-sm font-medium text-slate-700">Conditions de règlement<textarea rows={3} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.defaultPaymentTerms} onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Mentions légales par défaut<textarea rows={3} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.defaultLegalMentions} onChange={(e) => setForm({ ...form, defaultLegalMentions: e.target.value })} /></label><label className="text-sm font-medium text-slate-700">Note de bas de document<textarea rows={3} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.defaultInvoiceNotes} onChange={(e) => setForm({ ...form, defaultInvoiceNotes: e.target.value })} /></label><label className="max-w-sm text-sm font-medium text-slate-700">Devise par défaut<select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}>{CURRENCY_OPTIONS.map((currency) => <option key={currency.code} value={currency.code}>{currency.code} - {currency.label} ({currency.symbol})</option>)}</select><span className="mt-1 block text-xs font-normal text-slate-500">Par défaut : EUR - Euro (€).</span></label></div></section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">Relances email</h3><p className="mt-1 text-sm text-slate-600">Les relances concernent uniquement les factures émises, échues et non réglées.</p><label className="mt-4 flex items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.emailRemindersEnabled} onChange={(e) => setForm({ ...form, emailRemindersEnabled: e.target.checked })} />Activer les relances automatiques</label><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium text-slate-700">Première relance (jours après échéance)<input type="number" min={0} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.emailReminderDelayDays} onChange={(e) => setForm({ ...form, emailReminderDelayDays: Number(e.target.value) })} /></label><label className="text-sm font-medium text-slate-700">Répétition (jours)<input type="number" min={1} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.emailReminderRepeatDays} onChange={(e) => setForm({ ...form, emailReminderRepeatDays: Number(e.target.value) })} /></label><label className="text-sm font-medium text-slate-700">Nombre maximum<input type="number" min={1} className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.emailReminderMaxAttempts} onChange={(e) => setForm({ ...form, emailReminderMaxAttempts: Number(e.target.value) })} /></label></div></section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-semibold text-slate-900">TVA</h3><p className="mt-1 text-sm text-slate-600">Le régime choisi influence les mentions et le calcul de TVA.</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700">Régime de TVA<select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.VatLiabilityRegime} onChange={(e) => setForm({ ...form, VatLiabilityRegime: e.target.value as VatLiabilityRegime })}><option value="FRANCHISE_BASE">Franchise en base</option><option value="LIABLE">Assujetti à la TVA</option></select></label>{form.VatLiabilityRegime === 'LIABLE' && <label className="text-sm font-medium text-slate-700">Fréquence de déclaration<select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={form.vatReturnFrequency} onChange={(e) => setForm({ ...form, vatReturnFrequency: e.target.value as VatReturnFrequency })}><option value="MONTHLY">Mensuelle</option><option value="QUARTERLY">Trimestrielle</option></select></label>}</div></section>

        <section className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-slate-900">Comptes bancaires</h3><p className="mt-1 text-sm text-slate-600">Un seul compte peut être défini par défaut.</p></div><button type="button" onClick={() => setShowBankModal(true)} className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">Ajouter un compte bancaire</button></div><div className="mt-4 space-y-2">{paymentAccounts.length ? paymentAccounts.map((account) => <label key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-slate-200 bg-white p-3 text-sm"><span><strong className="block text-slate-900">{account.name}</strong><span className="text-slate-500">{account.bankName || 'Banque non renseignée'} · {account.iban}</span></span><span className="flex items-center gap-2 text-slate-700"><input type="radio" name="default-payment-account" checked={form.defaultPaymentAccountId === account.id} onChange={() => setForm({ ...form, defaultPaymentAccountId: account.id })} />Compte par défaut</span></label>) : <p className="rounded border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">Aucun compte bancaire enregistré.</p>}</div></section>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4"><button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2.5 text-sm text-slate-700">Annuler</button><button type="submit" disabled={saving} className="rounded bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</button></div>
      </form>

      {showBankModal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onClick={() => setShowBankModal(false)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="tenant-bank-account-title" onClick={(event) => event.stopPropagation()}><div className="border-b border-slate-200 px-5 py-4"><h2 id="tenant-bank-account-title" className="text-lg font-semibold text-slate-900">Ajouter un compte bancaire</h2><p className="mt-1 text-sm text-slate-500">Ce compte pourra être utilisé sur vos factures et devis.</p></div><AddBankAccountForm onCancel={() => setShowBankModal(false)} onCreated={(account) => { setPaymentAccounts((current) => [...current, account]); setShowBankModal(false); if (!form.defaultPaymentAccountId) setForm((current) => ({ ...current, defaultPaymentAccountId: account.id })); }} /></div></div>}
    </>
  );
}
