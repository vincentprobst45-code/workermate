
export interface Address {
  id: string;
  street1: string;
  street2: string | null;

  postalCode: string;
  city: string;
  region: string | null;
  countryCode: string;

  latitude: number | null;
  longitude: number | null;

  accessCode: string | null;
  floor: string | null;
  apartment: string | null;
  note: string | null;
}


export type CreateAddress = Omit<
  Address,
  'id'
>;