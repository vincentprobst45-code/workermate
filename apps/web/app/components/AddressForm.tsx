'use client';
import { useState } from 'react';

function AddressForm({ address, onChange }){
  // const [newAddress, setNewAddress] = useState({ street1: '', street2: ''
  //   , postalCode: '', city: '', region: '', countryCode: ''
  //   , latitude: '', longitude: ''
  //   , accessCode: '', floor: '', apartment: '', note: ''
  //  });

    return(<div>
        
          <div className="grid grid-cols-1 sm:grid-cols-3 py-2 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Rue ligne 1"
              value={address.street1}
              onChange={(e) => onChange({ ...address, street1: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Rue ligne 2"
              value={address.street2}
              onChange={(e) => onChange({ ...address, street2: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Code Postal"
              value={address.postalCode}
              onChange={(e) => onChange({ ...address, postalCode: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Ville"
              value={address.city}
              onChange={(e) => onChange({ ...address, city: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Région"
              value={address.region}
              onChange={(e) => onChange({ ...address, region: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Pays"
              value={address.countryCode}
              onChange={(e) => onChange({ ...address, countryCode: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Appartement"
              value={address.apartment}
              onChange={(e) => onChange({ ...address, apartment: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Étage"
              value={address.floor}
              onChange={(e) => onChange({ ...address, floor: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Code d'accès"
              value={address.accessCode}
              onChange={(e) => onChange({ ...address, accessCode: e.target.value })}
            />
          </div>
            <textarea
              className="border px-3 py-2 rounded md:w-1/2 w-1/1 h-64 align-text-top
;
"
              placeholder="Notes additionelles"
              value={address.note}
              onChange={(e) => onChange({ ...address, note: e.target.value })}
            />
          <div className="grid grid-cols-1 sm:grid-cols-3 py-2 gap-3">
            <input
              className="border px-3 py-2 rounded"
              placeholder="Latitude"
              value={address.latitude}
              onChange={(e) => onChange({ ...address, latitude: e.target.value })}
            />
            <input
              className="border px-3 py-2 rounded"
              placeholder="Longitude"
              value={address.longitude}
              onChange={(e) => onChange({ ...address, longitude: e.target.value })}
            />
          </div>
    </div>)
}
export default AddressForm