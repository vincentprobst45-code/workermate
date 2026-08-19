'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '../protected-route';
import { useApiClient } from '../api-client';
import SelectExistingAddress from '../components/SelectExistingAddress';
import AddressForm, {
  type AddAddressFormData,
  createEmptyAddress,
} from '../components/AddressForm';
import AddTenantForm from '../components/AddTenantForm';

interface TenantAddress {
  id: string;
  street1?: string | null;
  street2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  countryCode?: string | null;
}

interface TenantProfile {
  id: string;
  name: string;
  addressId?: string | null;
  address?: TenantAddress | null;
  email?: string | null;
  phoneNumber?: string | null;
  siretNumber?: string | null;
  vatNumber?: string | null;
  iban?: string | null;
  bic?: string | null;
  logoFileId?: string | null;
  defaultCurrency: string;
  defaultPaymentTerms?: string | null;
  defaultLegalMentions?: string | null;
  defaultInvoiceNotes?: string | null;
}

interface TenantFormData {
  name: string;
  logoFileId: string;
  addressId: string;
  phoneNumber: string;
  email: string;
  siretNumber: string;
  vatNumber: string;
  iban: string;
  bic: string;
  defaultPaymentTerms: string;
  defaultLegalMentions: string;
  defaultInvoiceNotes: string;
  defaultCurrency: string;
}

type AddressMode = 'new' | 'existing';

function createEmptyForm(): TenantFormData {
  return {
    name: '',
    logoFileId: '',
    addressId: '',
    phoneNumber: '',
    email: '',
    siretNumber: '',
    vatNumber: '',
    iban: '',
    bic: '',
    defaultPaymentTerms: '',
    defaultLegalMentions: '',
    defaultInvoiceNotes: '',
    defaultCurrency: 'EUR',
  };
}

function mapTenantToForm(tenant: TenantProfile): TenantFormData {
  return {
    name: tenant.name || '',
    logoFileId: tenant.logoFileId || '',
    addressId: tenant.addressId || '',
    phoneNumber: tenant.phoneNumber || '',
    email: tenant.email || '',
    siretNumber: tenant.siretNumber || '',
    vatNumber: tenant.vatNumber || '',
    iban: tenant.iban || '',
    bic: tenant.bic || '',
    defaultPaymentTerms: tenant.defaultPaymentTerms || '',
    defaultLegalMentions: tenant.defaultLegalMentions || '',
    defaultInvoiceNotes: tenant.defaultInvoiceNotes || '',
    defaultCurrency: tenant.defaultCurrency || 'EUR',
  };
}

function formatAddress(address?: TenantAddress | null): string {
  if (!address) {
    return 'Aucune adresse associee';
  }

  const line1 = [address.street1, address.street2].filter(Boolean).join(' ');
  const line2 = [address.postalCode, address.city].filter(Boolean).join(' ');
  const line3 = address.countryCode || '';

  return [line1, line2, line3].filter(Boolean).join(' - ') || 'Aucune adresse associee';
}

export default function TenantPage() {
  const api = useApiClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentAddressLabel, setCurrentAddressLabel] = useState('Aucune adresse associee');
  const [form, setForm] = useState<TenantFormData>(createEmptyForm());
  const [addressMode, setAddressMode] = useState<AddressMode>('existing');
  const [newAddress, setNewAddress] = useState<AddAddressFormData>(createEmptyAddress());
  const [showCreateTenantForm, setShowCreateTenantForm] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      try {
        const res = await api.get('/tenants/current');
        if (!res.ok) {
          throw new Error('Erreur');
        }

        const data: TenantProfile = await res.json();
        if (!cancelled && data) {
          setForm(mapTenantToForm(data));
          setCurrentAddressLabel(formatAddress(data.address));
          setAddressMode(data.addressId ? 'existing' : 'new');
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger les informations de l\'entreprise.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTenant();

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        name: form.name,
        logoFileId: form.logoFileId,
        addressId:
          addressMode === 'existing' ? (form.addressId || undefined) : undefined,
        address: addressMode === 'new' ? newAddress : undefined,
        phoneNumber: form.phoneNumber,
        email: form.email,
        siretNumber: form.siretNumber,
        vatNumber: form.vatNumber,
        iban: form.iban,
        bic: form.bic,
        defaultPaymentTerms: form.defaultPaymentTerms,
        defaultLegalMentions: form.defaultLegalMentions,
        defaultInvoiceNotes: form.defaultInvoiceNotes,
        defaultCurrency: form.defaultCurrency,
      };

      const res = await api.put('/tenants/current', payload);
      if (!res.ok) {
        throw new Error('Erreur');
      }

      const updated: TenantProfile = await res.json();
      setForm(mapTenantToForm(updated));
      setCurrentAddressLabel(formatAddress(updated.address));
      setSuccess('Informations entreprise mises a jour.');
    } catch {
      setError('La mise a jour a echoue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-6">
        <header className="mb-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 px-6 py-7 text-white shadow-xl shadow-slate-800/20">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Parametres</p>
          <h2 className="mt-2 text-2xl font-semibold">Entreprise</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-200">
            Configure les informations de ton entreprise utilisees pour les documents de facturation.
          </p>
        </header>

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            onClick={() => setShowCreateTenantForm((current) => !current)}
          >
            {showCreateTenantForm ? 'Fermer' : 'Créer une entreprise'}
          </button>
        </div>

        {showCreateTenantForm && (
          <div className="mb-6">
            <AddTenantForm
              onCancel={() => setShowCreateTenantForm(false)}
              onCreated={() => {
                setShowCreateTenantForm(false);
                window.location.reload();
              }}
            />
          </div>
        )}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/80">
            {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}
            {success && <div className="rounded bg-green-100 p-3 text-green-700">{success}</div>}

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-slate-900">Informations generales</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="tenant-name" className="mb-1 block text-sm font-medium text-slate-700">Nom</label>
                  <input
                    id="tenant-name"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="tenant-logo" className="mb-1 block text-sm font-medium text-slate-700">Logo</label>
                  <input
                    id="tenant-logo"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    placeholder="ID du fichier logo"
                    value={form.logoFileId}
                    onChange={(e) => setForm({ ...form, logoFileId: e.target.value })}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Adresse</label>
                  <p className="mb-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    {currentAddressLabel}
                  </p>
                  <div className="mb-3 flex gap-2">
                    <button
                      type="button"
                      className={`rounded border px-3 py-2 text-sm ${addressMode === 'new' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                      onClick={() => setAddressMode('new')}
                    >
                      Nouvelle adresse
                    </button>
                    <button
                      type="button"
                      className={`rounded border px-3 py-2 text-sm ${addressMode === 'existing' ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}
                      onClick={() => setAddressMode('existing')}
                    >
                      Adresse existante
                    </button>
                  </div>

                  {addressMode === 'existing' ? (
                    <SelectExistingAddress
                      selectedAddressId={form.addressId}
                      onAddressChange={(addressId) => setForm({ ...form, addressId })}
                      required={false}
                    />
                  ) : (
                    <AddressForm address={newAddress} onChange={setNewAddress} />
                  )}
                </div>

                <div>
                  <label htmlFor="tenant-phone" className="mb-1 block text-sm font-medium text-slate-700">Telephone</label>
                  <input
                    id="tenant-phone"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="tenant-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    id="tenant-email"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-slate-900">Informations legales</h3>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="tenant-siret" className="mb-1 block text-sm font-medium text-slate-700">SIRET</label>
                  <input
                    id="tenant-siret"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.siretNumber}
                    onChange={(e) => setForm({ ...form, siretNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tenant-vat" className="mb-1 block text-sm font-medium text-slate-700">TVA</label>
                  <input
                    id="tenant-vat"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.vatNumber}
                    onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tenant-iban" className="mb-1 block text-sm font-medium text-slate-700">IBAN</label>
                  <input
                    id="tenant-iban"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.iban}
                    onChange={(e) => setForm({ ...form, iban: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="tenant-bic" className="mb-1 block text-sm font-medium text-slate-700">BIC</label>
                  <input
                    id="tenant-bic"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.bic}
                    onChange={(e) => setForm({ ...form, bic: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-slate-900">Notes en bas de facture</h3>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="tenant-payment-terms" className="mb-1 block text-sm font-medium text-slate-700">Conditions de paiement</label>
                  <textarea
                    id="tenant-payment-terms"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.defaultPaymentTerms}
                    onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="tenant-legal-mentions" className="mb-1 block text-sm font-medium text-slate-700">Mentions legales</label>
                  <textarea
                    id="tenant-legal-mentions"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.defaultLegalMentions}
                    onChange={(e) => setForm({ ...form, defaultLegalMentions: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label htmlFor="tenant-invoice-notes" className="mb-1 block text-sm font-medium text-slate-700">Message de fin</label>
                  <textarea
                    id="tenant-invoice-notes"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.defaultInvoiceNotes}
                    onChange={(e) => setForm({ ...form, defaultInvoiceNotes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="max-w-sm">
                  <label htmlFor="tenant-currency" className="mb-1 block text-sm font-medium text-slate-700">Devise</label>
                  <input
                    id="tenant-currency"
                    className="w-full rounded border border-slate-300 px-3 py-2"
                    value={form.defaultCurrency}
                    onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <button
              type="submit"
              disabled={saving}
              className="rounded bg-slate-900 px-5 py-2.5 text-white disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        )}
      </main>
    </ProtectedRoute>
  );
}
