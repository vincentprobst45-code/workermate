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
  onUpdated?: (customer: Customer) => void;
  initialCustomer?: Customer | null;
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

function FormField({ label, icon: Icon, required, containerClassName, ...inputProps }: FormFieldProps) {
  return (
    <label className={`flex flex-col gap-1.5 ${containerClassName || ''}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
        {required && <span className="ml-1 text-indigo-600">*</span>}
      </span>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />}
        <input
          {...inputProps}
          required={required}
          className={`w-full rounded-lg border border-slate-300 bg-white py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none ${Icon ? 'pl-9 pr-3' : 'px-3'}`}
        />
      </div>
    </label>
  );
}

export default function AddCustomerForm({ onCreated, onUpdated, initialCustomer = null, show }: AddCustomerFormProps) {
  const api = useApiClient();
  const isEditing = Boolean(initialCustomer);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCustomer, setNewCustomer] = useState<AddCustomerFormData>(() => initialCustomer ? {
    firstName: initialCustomer.firstName || '',
    lastName: initialCustomer.lastName || '',
    company: initialCustomer.company || '',
    email: initialCustomer.email || '',
    phone: initialCustomer.phone || '',
    mobile: initialCustomer.mobile || '',
    siret: initialCustomer.siret || '',
    vatNumber: initialCustomer.vatNumber || '',
    notes: initialCustomer.notes || '',
    addressId: initialCustomer.addressId || '',
    address: {
      ...createEmptyAddress(),
      street1: initialCustomer.address?.street1 || '',
      postalCode: initialCustomer.address?.postalCode || '',
      city: initialCustomer.address?.city || '',
    },
  } : createEmptyCustomer());
  const [selectedAddressId, setSelectedAddressId] = useState(initialCustomer?.addressId || '');
  const [addressMode, setAddressMode] = useState<AddressMode>(initialCustomer?.addressId ? 'existing' : initialCustomer?.address?.street1 ? 'new' : 'none');
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
      const customerToSave: CreateCustomerDto =
        addressMode === 'new'
          ? { ...newCustomer, address: newCustomer.address }
          : addressMode === 'existing'
            ? { ...newCustomer, addressId: selectedAddressId }
            : { ...newCustomer };

      const res = isEditing
        ? await api.put(`/customers/${initialCustomer.id}`, {
            firstName: customerToSave.firstName,
            lastName: customerToSave.lastName,
            company: customerToSave.company,
            email: customerToSave.email,
            phone: customerToSave.phone,
            mobile: customerToSave.mobile,
            siret: customerToSave.siret,
            vatNumber: customerToSave.vatNumber,
            notes: customerToSave.notes,
            addressId: addressMode === 'existing' ? selectedAddressId : undefined,
          })
        : await api.post('/customers', customerToSave);
      if (!res.ok) throw new Error('Erreur');

      const data = isEditing
        ? {
            ...initialCustomer,
            ...customerToSave,
            addressId: addressMode === 'existing' ? selectedAddressId : initialCustomer.addressId,
          }
        : await res.json();

      if (isEditing && addressMode === 'new' && initialCustomer.addressId) {
        const addressResponse = await api.put(`/addresses/${initialCustomer.addressId}`, newCustomer.address);
        if (!addressResponse.ok) throw new Error('La mise à jour de l’adresse a échoué');
        data.address = { ...initialCustomer.address, ...newCustomer.address };
      }

      if (isEditing) {
        onUpdated?.(data as Customer);
      } else {
        onCreated(data as Customer);
      }
      setNewCustomer(createEmptyCustomer());
      setAddressMode('none');
      setSelectedAddressId('');
      setStep(0);
      setError('');
      setSuccess(isEditing ? 'Client modifié avec succès' : 'Client ajouté avec succès');
    } catch (err) {
      setError(`Erreur lors de ${isEditing ? 'la modification' : "l'ajout"}: ${err}`);
    }
  }

  const previewName = [newCustomer.firstName, newCustomer.lastName]
    .filter((value) => value.trim())
    .join(' ');
  const previewInitial = (newCustomer.firstName || newCustomer.company || '?').trim().charAt(0).toUpperCase();

  return (
    <form
      onSubmit={handleAddCustomer}
      className={`mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${!show ? 'hidden' : ''}`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
        <div className="p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Hammer className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{isEditing ? 'Modifier la fiche' : 'Nouveau client'}</p>
              <h3 className="text-xl font-bold text-slate-900">{isEditing ? 'Modifier le client' : 'Ajouter un client'}</h3>
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
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                    i < step
                      ? 'cursor-pointer border-indigo-600 bg-indigo-600 text-white'
                      : i === step
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'cursor-not-allowed border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </button>
                {i < STEPS.length - 1 && (
                    <div className={`mx-2 h-1 flex-1 rounded-full ${i < step ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="mb-6 text-sm text-slate-500">
            Étape {step + 1}/{STEPS.length} — {STEPS[step].hint}
          </p>

          {error && (
            <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
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
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                      addressMode === mode ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {mode === 'new' ? 'Nouvelle adresse' : mode === 'existing' ? 'Adresse existante' : "Pas d'adresse"}
                  </button>
                ))}
              </div>

              {addressMode === 'new' && (
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <AddressForm
                    address={newCustomer.address}
                    onChange={(address) => setNewCustomer({ ...newCustomer, address })}
                  />
                </div>
              )}
              {addressMode === 'existing' && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <SelectExistingAddress selectedAddressId={selectedAddressId} onAddressChange={setSelectedAddressId} />
                </div>
              )}
              {addressMode === 'none' && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
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
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                <textarea
                  className="min-h-28 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus-visible:outline-none"
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
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
              >
                ← Retour
              </button>
            )}
            <button
              type="submit"
              className="ml-auto rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
              {step === STEPS.length - 1 ? (isEditing ? 'Enregistrer les modifications' : 'Ajouter le client') : 'Continuer →'}
            </button>
          </div>
        </div>

        <aside className="hidden flex-col justify-between border-l border-slate-200 bg-slate-900 p-8 text-white lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Aperçu</p>
            <div className="mt-6 flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-xl font-bold text-indigo-200">
                {previewInitial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-lg font-bold text-white">{previewName || 'Nouveau client'}</p>
                {newCustomer.company && <p className="truncate text-sm text-slate-400">{newCustomer.company}</p>}
              </div>
            </div>

            <div className="mt-8 space-y-3 text-sm">
              {newCustomer.email && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Mail className="h-4 w-4 shrink-0 text-indigo-300" /> <span className="truncate">{newCustomer.email}</span>
                </p>
              )}
              {newCustomer.phone && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4 shrink-0 text-indigo-300" /> {newCustomer.phone}
                </p>
              )}
              {newCustomer.mobile && (
                <p className="flex items-center gap-2 text-slate-300">
                  <Phone className="h-4 w-4 shrink-0 text-indigo-300" /> {newCustomer.mobile}
                </p>
              )}
              {addressMode === 'new' && newCustomer.address.street1 && (
                <p className="flex items-start gap-2 text-slate-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-indigo-300" />
                  <span>
                    {[newCustomer.address.street1, newCustomer.address.postalCode, newCustomer.address.city]
                      .filter(Boolean)
                      .join(' ')}
                  </span>
                </p>
              )}
              {addressMode === 'existing' && selectedAddressId && (
                <p className="flex items-center gap-2 text-slate-300">
                  <MapPin className="h-4 w-4 shrink-0 text-indigo-300" /> Adresse existante sélectionnée
                </p>
              )}
              {(newCustomer.siret || newCustomer.vatNumber) && (
                <p className="flex items-center gap-2 text-slate-300">
                  <FileText className="h-4 w-4 shrink-0 text-indigo-300" /> {newCustomer.siret || newCustomer.vatNumber}
                </p>
              )}
              {!newCustomer.email && !newCustomer.phone && !newCustomer.mobile && (
                <p className="text-slate-500">Les informations saisies apparaîtront ici au fur et à mesure.</p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-500">Fiche générée automatiquement à partir de vos saisies.</p>
        </aside>
      </div>
    </form>
  );
}