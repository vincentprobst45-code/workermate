'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ProtectedRoute } from '../protected-route';
import { useApiClient } from '../api-client';

interface TenantProfile {
  id: string;
  name: string;
  addressId?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  siretNumber?: string | null;
  vatNumber?: string | null;
  iban?: string | null;
  bic?: string | null;
  invoiceNumberPrefix?: string | null;
  nextInvoiceNumber?: number | null;
  logoFileId?: string | null;
  defaultCurrency: string;
  defaultPaymentTerms?: string | null;
  defaultLegalMentions?: string | null;
  defaultInvoiceNotes?: string | null;
  defaultVatRate?: number | null;
}

interface TenantFormData {
  name: string;
  email: string;
  phoneNumber: string;
  siretNumber: string;
  vatNumber: string;
  iban: string;
  bic: string;
  invoiceNumberPrefix: string;
  nextInvoiceNumber: string;
  defaultCurrency: string;
  defaultPaymentTerms: string;
  defaultLegalMentions: string;
  defaultInvoiceNotes: string;
  defaultVatRate: string;
}

function mapTenantToForm(tenant: TenantProfile): TenantFormData {
  return {
    name: tenant.name || '',
    email: tenant.email || '',
    phoneNumber: tenant.phoneNumber || '',
    siretNumber: tenant.siretNumber || '',
    vatNumber: tenant.vatNumber || '',
    iban: tenant.iban || '',
    bic: tenant.bic || '',
    invoiceNumberPrefix: tenant.invoiceNumberPrefix || '',
    nextInvoiceNumber:
      tenant.nextInvoiceNumber !== null && tenant.nextInvoiceNumber !== undefined
        ? String(tenant.nextInvoiceNumber)
        : '',
    defaultCurrency: tenant.defaultCurrency || 'EUR',
    defaultPaymentTerms: tenant.defaultPaymentTerms || '',
    defaultLegalMentions: tenant.defaultLegalMentions || '',
    defaultInvoiceNotes: tenant.defaultInvoiceNotes || '',
    defaultVatRate:
      tenant.defaultVatRate !== null && tenant.defaultVatRate !== undefined
        ? String(tenant.defaultVatRate)
        : '',
  };
}

function createEmptyForm(): TenantFormData {
  return {
    name: '',
    email: '',
    phoneNumber: '',
    siretNumber: '',
    vatNumber: '',
    iban: '',
    bic: '',
    invoiceNumberPrefix: '',
    nextInvoiceNumber: '',
    defaultCurrency: 'EUR',
    defaultPaymentTerms: '',
    defaultLegalMentions: '',
    defaultInvoiceNotes: '',
    defaultVatRate: '',
  };
}

export default function TenantPage() {
  const api = useApiClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState<TenantFormData>(createEmptyForm());

  useEffect(() => {
    let cancelled = false;

    async function loadTenant() {
      try {
        const res = await api.get('/tenants/current');
        if (!res.ok) {
          throw new Error('Erreur lors du chargement de l\'entreprise');
        }

        const data: TenantProfile = await res.json();
        if (!cancelled && data) {
          setForm(mapTenantToForm(data));
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
        email: form.email,
        phoneNumber: form.phoneNumber,
        siretNumber: form.siretNumber,
        vatNumber: form.vatNumber,
        iban: form.iban,
        bic: form.bic,
        invoiceNumberPrefix: form.invoiceNumberPrefix,
        nextInvoiceNumber: form.nextInvoiceNumber
          ? Number(form.nextInvoiceNumber)
          : undefined,
        defaultCurrency: form.defaultCurrency,
        defaultPaymentTerms: form.defaultPaymentTerms,
        defaultLegalMentions: form.defaultLegalMentions,
        defaultInvoiceNotes: form.defaultInvoiceNotes,
        defaultVatRate: form.defaultVatRate
          ? Number(form.defaultVatRate)
          : undefined,
      };

      const res = await api.put('/tenants/current', payload);
      if (!res.ok) {
        throw new Error('Erreur lors de la mise a jour de l\'entreprise');
      }

      const updated: TenantProfile = await res.json();
      setForm(mapTenantToForm(updated));
      setSuccess('Informations entreprise mises a jour.');
    } catch {
      setError('La mise a jour a echoue.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <h2 className="mb-6 text-2xl font-semibold">Entreprise</h2>

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <form onSubmit={handleSubmit} className="rounded-lg border-2 bg-white p-5 shadow">
            {error && <div className="mb-4 rounded bg-red-100 p-3 text-red-700">{error}</div>}
            {success && <div className="mb-4 rounded bg-green-100 p-3 text-green-700">{success}</div>}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                className="rounded border px-3 py-2"
                placeholder="Nom de l'entreprise"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Telephone"
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="SIRET"
                value={form.siretNumber}
                onChange={(e) => setForm({ ...form, siretNumber: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Numero de TVA"
                value={form.vatNumber}
                onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="IBAN"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="BIC"
                value={form.bic}
                onChange={(e) => setForm({ ...form, bic: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Prefixe numero facture (ex: FAC-2026-)"
                value={form.invoiceNumberPrefix}
                onChange={(e) => setForm({ ...form, invoiceNumberPrefix: e.target.value })}
              />
              <input
                type="number"
                min={1}
                className="rounded border px-3 py-2"
                placeholder="Prochain numero facture"
                value={form.nextInvoiceNumber}
                onChange={(e) => setForm({ ...form, nextInvoiceNumber: e.target.value })}
              />
              <input
                className="rounded border px-3 py-2"
                placeholder="Devise par defaut (EUR)"
                value={form.defaultCurrency}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
              />
              <input
                type="number"
                step="0.01"
                min={0}
                className="rounded border px-3 py-2"
                placeholder="TVA par defaut"
                value={form.defaultVatRate}
                onChange={(e) => setForm({ ...form, defaultVatRate: e.target.value })}
              />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <textarea
                className="rounded border px-3 py-2"
                placeholder="Conditions de paiement par defaut"
                value={form.defaultPaymentTerms}
                onChange={(e) => setForm({ ...form, defaultPaymentTerms: e.target.value })}
                rows={3}
              />
              <textarea
                className="rounded border px-3 py-2"
                placeholder="Mentions legales par defaut"
                value={form.defaultLegalMentions}
                onChange={(e) => setForm({ ...form, defaultLegalMentions: e.target.value })}
                rows={3}
              />
              <textarea
                className="rounded border px-3 py-2"
                placeholder="Notes facture par defaut"
                value={form.defaultInvoiceNotes}
                onChange={(e) => setForm({ ...form, defaultInvoiceNotes: e.target.value })}
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </form>
        )}
      </main>
    </ProtectedRoute>
  );
}
