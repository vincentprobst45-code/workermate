'use client';

import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { useApiClient } from '../api-client';
import type { TenantProfile } from './TenantDetails';
import InvoicePdfViewer from './InvoicePdfViewer';

type InvoiceAppearanceSectionProps = {
  tenant: TenantProfile;
  onSaved: (tenant: TenantProfile) => void;
};

export default function InvoiceAppearanceSection({ tenant, onSaved }: InvoiceAppearanceSectionProps) {
  const api = useApiClient();
  const [template, setTemplate] = useState(tenant.invoiceTemplate || 'STANDARD');
  const [primaryColor, setPrimaryColor] = useState(tenant.invoicePrimaryColor || '#0f172a');
  const [font, setFont] = useState(tenant.invoiceFont || 'Helvetica');
  const [logoFileId, setLogoFileId] = useState(tenant.logoFileId || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | undefined;
    const timeout = window.setTimeout(() => {
      void (async () => {
        setPreviewLoading(true);
        setPreviewError('');
        try {
          const response = await api.post('/invoices/preview-appearance-pdf', {
            invoiceTemplate: template,
            invoicePrimaryColor: primaryColor,
            invoiceFont: font,
            logoFileId: logoFileId || null,
          });
          if (!response.ok) throw new Error('Aperçu indisponible.');
          const blob = await response.blob();
          if (cancelled) return;
          objectUrl = URL.createObjectURL(blob);
          setPreviewPdfUrl(objectUrl);
        } catch (previewRequestError) {
          if (!cancelled) setPreviewError(previewRequestError instanceof Error ? previewRequestError.message : 'Aperçu indisponible.');
        } finally {
          if (!cancelled) setPreviewLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [api, template, primaryColor, font, logoFileId]);

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setSaved(false);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await api.upload('/tenants/current/logo', body);
      if (!response.ok) throw new Error('Le logo n’a pas pu être importé.');
      const result = await response.json() as { fileId: string };
      setLogoFileId(result.fileId);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Le logo n’a pas pu être importé.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const response = await api.put('/tenants/current/invoice-appearance', {
        invoiceTemplate: template,
        invoicePrimaryColor: primaryColor,
        invoiceFont: font,
        logoFileId: logoFileId || null,
      });
      if (!response.ok) throw new Error('La personnalisation n’a pas pu être enregistrée.');
      const appearance = await response.json() as Pick<TenantProfile, 'logoFileId' | 'invoiceTemplate' | 'invoicePrimaryColor' | 'invoiceFont'>;
      onSaved({ ...tenant, ...appearance });
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'La personnalisation n’a pas pu être enregistrée.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Personnalisation des factures</h2>
          <p className="mt-1 text-sm text-slate-500">Choisissez l’apparence des nouveaux PDF de facture.</p>
        </div>
        <label className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoChange} disabled={uploading} />
          {uploading ? 'Importation...' : 'Importer un logo'}
        </label>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-3">
          {([{ value: 'STANDARD', label: 'Standard', description: 'Classique et équilibré' }, { value: 'MODERN', label: 'Moderne', description: 'En-tête coloré et aéré' }, { value: 'COMPACT', label: 'Compact', description: 'Optimisé pour une page' }] as const).map((option) => (
            <label key={option.value} className={`cursor-pointer rounded-lg border p-4 ${template === option.value ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900' : 'border-slate-200'}`}>
              <input type="radio" name="invoice-template" value={option.value} checked={template === option.value} onChange={() => setTemplate(option.value)} />
              <span className="ml-2 font-medium text-slate-900">{option.label}</span>
              <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Couleur principale<div className="mt-1 flex items-center gap-2"><input type="color" className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} /><input className="w-full rounded border border-slate-300 bg-white px-3 py-2 uppercase" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} pattern="^#[0-9a-fA-F]{6}$" /></div></label>
          <label className="text-sm font-medium text-slate-700">Police<select className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2" value={font} onChange={(event) => setFont(event.target.value as NonNullable<TenantProfile['invoiceFont']>)}><option value="Helvetica">Helvetica</option><option value="Times-Roman">Times</option><option value="Courier">Courier</option></select></label>
        </div>
        <p className="text-xs text-slate-500">{logoFileId ? 'Logo configuré.' : 'Aucun logo configuré.'} Formats acceptés : PNG, JPEG ou WebP, 5 Mo maximum.</p>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {saved && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Personnalisation enregistrée.</p>}
        <div className="flex justify-end"><button type="submit" disabled={saving || uploading} className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Enregistrement...' : 'Enregistrer la personnalisation'}</button></div>
      </form>
      <aside className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-slate-900">Aperçu</h3><span className="text-xs text-slate-500">PDF exemple</span></div>
        {previewLoading && <p className="mb-2 text-center text-xs text-slate-500">Génération de l’aperçu...</p>}
        {previewError && <p className="mb-2 rounded-md bg-red-50 p-3 text-center text-sm text-red-700">{previewError}</p>}
        {previewPdfUrl && !previewError && <InvoicePdfViewer src={previewPdfUrl} title="Aperçu de la facture" />}
      </aside>
      </div>
    </section>
  );
}