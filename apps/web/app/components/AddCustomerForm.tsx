'use client';
import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { Building2, Check, FileText, Hammer, Mail, MapPin, Phone, UserRound, type LucideIcon } from 'lucide-react';
import AddressForm, { createEmptyAddress, type AddAddressFormData } from './AddressForm';
import SelectExistingAddress from './SelectExistingAddress';
import { useApiClient } from '../api-client';

interface AddressOneLine {
  street1?: string;
  postalCode?: string;
  city?: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  createdById?: string;
  firstName: string;
  lastName?: string;
  company?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  addressId?: string;
  address?: AddressOneLine;
  siret?: string;
  vatNumber?: string;
  notes?: string;
  createdAt: string;
}

type AddressMode = 'new' | 'existing' | 'none';

export type AddCustomerFormData = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  siret: string;
  vatNumber: string;
  notes: string;
  // addressMode: AddressMode;
  addressId: string;
  address: AddAddressFormData;
};

export type CreateCustomerDto  = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  mobile: string;
  siret: string;
  vatNumber: string;
  notes: string;
  addressId: string;
  address: AddAddressFormData;
};

export function createEmptyCustomer(): AddCustomerFormData {
  return {
    firstName: '',
    lastName: '',
    company: '',
    email: '',
    phone: '',
    mobile: '',
    siret: '',
    vatNumber: '',
    notes: '',
    // addressMode: 'none',
    addressId: '',
    address: createEmptyAddress(),
  };
}

type AddCustomerFormProps = {
  onCreated: (customer: Customer) => void;
  show: boolean;
};

const STEPS = [
  { title: 'Identité', hint: 'Qui est ce client ?' },
  { title: 'Adresse', hint: 'Où intervenir ou facturer ?' },
  { title: 'Détails', hint: 'SIRET, TVA et notes' },
] as const;

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: LucideIcon;
  required?: boolean;
  containerClassName?: string;
};

// Chunky bordered field used only by this form's "workshop ticket" styling.
function FormField({ label, icon: Icon, required, containerClassName, ...inputProps }: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${containerClassName || ''}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">
        {label}
        {required && <span className="ml-1 text-amber-600">*</span>}
      </span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />}
        <input
          {...inputProps}
          required={required}
          className={`w-full rounded-xl border-2 border-zinc-900 bg-white py-2.5 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${Icon ? 'pl-9 pr-3' : 'px-3'}`}
        />
      </div>
    </label>
  );
}

export default function AddCustomerForm({ onCreated, show }: AddCustomerFormProps) {
  const api = useApiClient();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCustomer, setNewCustomer] = useState<AddCustomerFormData>(createEmptyCustomer());
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [addressMode, setAddressMode] = useState<AddressMode>('none');
  const [step, setStep] = useState(0);

  function validateStep(index: number): string {
    if (index === 0 && !newCustomer.firstName.trim()) {
      return 'Le prénom du client est obligatoire.';
    }
    if (index === 1 && addressMode === 'existing' && !selectedAddressId) {
      return 'Veuillez sélectionner une adresse existante.';
    }
    return '';
  }

  function goToStep(index: number) {
    if (index > step) {
      return;
    }
    setError('');
    setStep(index);
  }

  function handleBack() {
    setError('');
    setStep((current) => Math.max(0, current - 1));
  }

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault();

    const stepError = validateStep(step);
    if (stepError) {
      setError(stepError);
      return;
    }

    if (step < STEPS.length - 1) {
      setError('');
      setStep((current) => current + 1);
      return;
    }

    try {
      const customerToAdd: CreateCustomerDto =
        addressMode === 'new'
          ? { ...newCustomer, address: newCustomer.address }
          : addressMode === 'existing'
            ? { ...newCustomer, addressId: selectedAddressId }
            : { ...newCustomer };

      const res = await api.post('/customers', customerToAdd);
      if (!res.ok) throw new Error('Erreur');

      const data = await res.json();
      onCreated(data);
      setNewCustomer(createEmptyCustomer());
      setAddressMode('none');
      setSelectedAddressId('');
      setStep(0);
      setError('');
      setSuccess('Client ajouté avec succès');
    } catch (err) {
      setError(`Erreur lors de l'ajout: ${err}`);
    }
  }

  const previewName = [newCustomer.firstName, newCustomer.lastName]
    .filter((value) => value.trim())
    .join(' ');
  const previewInitial = (newCustomer.firstName || newCustomer.company || '?').trim().charAt(0).toUpperCase();

  return (
    <form
      onSubmit={handleAddCustomer}
      className={`mb-8 overflow-hidden rounded-3xl border-2 border-zinc-900 bg-[#FBF4E8] shadow-[6px_6px_0_0_#18181b] ${!show ? 'hidden' : ''}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
        <div className="p-5 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-zinc-900 bg-amber-400">
              <Hammer className="h-5 w-5 text-zinc-900" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Nouveau dossier</p>
              <h3 className="text-xl font-black text-zinc-900">Ajouter un client</h3>
            </div>
          </div>

          <div className="mb-2 flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.title} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  disabled={i > step}
                  aria-current={i === step ? 'step' : undefined}
                  aria-label={`Étape ${i + 1} : ${s.title}`}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-zinc-900 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                    i < step
                      ? 'cursor-pointer bg-zinc-900 text-amber-300'
                      : i === step
                        ? 'bg-amber-400 text-zinc-900'
                        : 'cursor-not-allowed bg-white text-zinc-400'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-1 flex-1 rounded-full ${i < step ? 'bg-zinc-900' : 'bg-zinc-900/15'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="mb-6 text-sm font-semibold text-zinc-500">
            Étape {step + 1}/{STEPS.length} — {STEPS[step].hint}
          </p>

          {error && (
            <div className="mb-5 rounded-xl border-2 border-red-900 bg-red-100 px-4 py-3 text-sm font-semibold text-red-900">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-5 rounded-xl border-2 border-emerald-900 bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-900">
              {success}
            </div>
          )}

          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Prénom"
                icon={UserRound}
                required
                placeholder="Prénom"
                value={newCustomer.firstName}
                onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
              />
              <FormField
                label="Nom"
                icon={UserRound}
                placeholder="Nom"
                value={newCustomer.lastName}
                onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
              />
              <FormField
                label="Entreprise"
                icon={Building2}
                placeholder="Entreprise"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer({ ...newCustomer, company: e.target.value })}
                containerClassName="sm:col-span-2"
              />
              <FormField
                label="Email"
                icon={Mail}
                type="email"
                placeholder="Email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
              <FormField
                label="Téléphone"
                icon={Phone}
                placeholder="Téléphone"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
              <FormField
                label="Téléphone secondaire"
                icon={Phone}
                placeholder="Téléphone 2"
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                {(['new', 'existing', 'none'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setAddressMode(mode)}
                    className={`rounded-xl border-2 border-zinc-900 px-4 py-2 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 ${
                      addressMode === mode ? 'bg-zinc-900 text-amber-300' : 'bg-white text-zinc-700 hover:bg-zinc-100'
                    }`}
                  >
                    {mode === 'new' ? 'Nouvelle adresse' : mode === 'existing' ? 'Adresse existante' : "Pas d'adresse"}
                  </button>
                ))}
              </div>

              {addressMode === 'new' && (
                <div className="overflow-hidden rounded-2xl border-2 border-zinc-900 bg-white">
                  <AddressForm
                    address={newCustomer.address}
                    onChange={(address) => setNewCustomer({ ...newCustomer, address })}
                  />
                </div>
              )}
              {addressMode === 'existing' && (
                <div className="rounded-2xl border-2 border-zinc-900 bg-white p-4">
                  <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />
                </div>
              )}
              {addressMode === 'none' && (
                <p className="rounded-2xl border-2 border-dashed border-zinc-400 bg-white/60 p-6 text-center text-sm text-zinc-500">
                  Ce client sera enregistré sans adresse pour le moment.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  label="Numéro SIRET"
                  icon={FileText}
                  placeholder="Numéro SIRET"
                  value={newCustomer.siret}
                  onChange={(e) => setNewCustomer({ ...newCustomer, siret: e.target.value })}
                />
                <FormField
                  label="Numéro TVA"
                  icon={FileText}
                  placeholder="Numéro TVA"
                  value={newCustomer.vatNumber}
                  onChange={(e) => setNewCustomer({ ...newCustomer, vatNumber: e.target.value })}
                />
              </div>
              <label className="mt-4 flex flex-col gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-zinc-600">Notes</span>
                <textarea
                  className="min-h-28 w-full rounded-xl border-2 border-zinc-900 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:bg-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
                  placeholder="Notes additionnelles sur ce client..."
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                />
              </label>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border-2 border-zinc-900 bg-white px-4 py-2.5 text-sm font-bold text-zinc-900 transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              >
                ← Retour
              </button>
            )}
            <button
              type="submit"
              className="ml-auto rounded-xl border-2 border-zinc-900 bg-amber-400 px-6 py-2.5 text-sm font-bold text-zinc-900 shadow-[3px_3px_0_0_#18181b] transition hover:bg-amber-300 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
            >
              {step === STEPS.length - 1 ? 'Ajouter le client' : 'Continuer →'}
            </button>
          </div>
        </div>

        <aside className="hidden flex-col justify-between bg-zinc-900 p-8 text-white lg:flex lg:border-l-2 lg:border-zinc-900">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-400">Aperçu</p>
            <div className="mt-6 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-amber-400 bg-zinc-800 text-xl font-black text-amber-300">
                {previewInitial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{previewName || 'Nouveau client'}</p>
                {newCustomer.company && <p className="truncate text-sm text-zinc-400">{newCustomer.company}</p>}
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm">
              {newCustomer.email && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Mail className="h-4 w-4 shrink-0 text-amber-400" /> <span className="truncate">{newCustomer.email}</span>
                </p>
              )}
              {newCustomer.phone && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Phone className="h-4 w-4 shrink-0 text-amber-400" /> {newCustomer.phone}
                </p>
              )}
              {newCustomer.mobile && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <Phone className="h-4 w-4 shrink-0 text-amber-400" /> {newCustomer.mobile}
                </p>
              )}
              {addressMode === 'new' && newCustomer.address.street1 && (
                <p className="flex items-start gap-2 text-zinc-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    {[newCustomer.address.street1, newCustomer.address.postalCode, newCustomer.address.city]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                </p>
              )}
              {addressMode === 'existing' && selectedAddressId && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="h-4 w-4 shrink-0 text-amber-400" /> Adresse existante sélectionnée
                </p>
              )}
              {(newCustomer.siret || newCustomer.vatNumber) && (
                <p className="flex items-center gap-2 text-zinc-300">
                  <FileText className="h-4 w-4 shrink-0 text-amber-400" /> {newCustomer.siret || newCustomer.vatNumber}
                </p>
              )}
              {!newCustomer.email && !newCustomer.phone && !newCustomer.mobile && (
                <p className="text-zinc-500">Les informations saisies apparaîtront ici au fur et à mesure.</p>
              )}
            </div>
          </div>

          <p className="text-xs text-zinc-500">Fiche générée automatiquement à partir de vos saisies.</p>
        </aside>
      </div>
    </form>
  );
}