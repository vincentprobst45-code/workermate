'use client';

export type AddAddressFormData = {
  street1: string;
  street2: string;
  postalCode: string;
  city: string;

  region: string;
  countryCode: string;

  latitude: string;
  longitude: string;

  accessCode: string;
  floor: string;
  apartment: string;
  note: string;
};

type AddressFormProps = {
  address: AddAddressFormData;
  onChange: (address: AddAddressFormData) => void;
};

export function createEmptyAddress(): AddAddressFormData {
  return {
  street1:    '',
  street2:    '',
  postalCode: '',
  city:       '',

  region:     '',
  countryCode:'',

  latitude:   '',
  longitude:  '',

  accessCode: '',
  floor:      '',
  apartment:  '',
  note:       '',
  };
}

function AddressForm({ address , onChange }: AddressFormProps){
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Adresse</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Rue (ligne 1)</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: 14 rue des Acacias"
              value={address.street1}
              onChange={(e) => onChange({ ...address, street1: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Rue (ligne 2)</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Bâtiment, résidence..."
              value={address.street2}
              onChange={(e) => onChange({ ...address, street2: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Code postal</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: 75001"
              value={address.postalCode}
              onChange={(e) => onChange({ ...address, postalCode: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Ville</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: Paris"
              value={address.city}
              onChange={(e) => onChange({ ...address, city: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Région</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: Île-de-France"
              value={address.region}
              onChange={(e) => onChange({ ...address, region: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Pays</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: FR"
              value={address.countryCode}
              onChange={(e) => onChange({ ...address, countryCode: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Accès</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Appartement</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: B12"
              value={address.apartment}
              onChange={(e) => onChange({ ...address, apartment: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Étage</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: 3"
              value={address.floor}
              onChange={(e) => onChange({ ...address, floor: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Code d&apos;accès</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: A42#"
              value={address.accessCode}
              onChange={(e) => onChange({ ...address, accessCode: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Notes</h3>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-zinc-700">Informations complémentaires</span>
          <textarea
            className="min-h-40 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
            placeholder="Ex: sonner au nom de..., portail à gauche..."
            value={address.note}
            onChange={(e) => onChange({ ...address, note: e.target.value })}
          />
        </label>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-700">Géolocalisation</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Latitude</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: 48.8566"
              value={address.latitude}
              onChange={(e) => onChange({ ...address, latitude: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-zinc-700">Longitude</span>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
              placeholder="Ex: 2.3522"
              value={address.longitude}
              onChange={(e) => onChange({ ...address, longitude: e.target.value })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
export default AddressForm