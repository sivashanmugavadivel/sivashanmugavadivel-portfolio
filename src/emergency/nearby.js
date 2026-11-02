// Nearby emergency services from Google Places (Places API, New), plus the Google Maps loader.
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { GOOGLE_MAPS_KEY } from './config';

export const PLACE_TYPES = {
  hospital: { label: 'Hospitals', one: 'Hospital' },
  pharmacy: { label: 'Pharmacies', one: 'Pharmacy' },
  fire_station: { label: 'Fire stations', one: 'Fire station' },
  police: { label: 'Police stations', one: 'Police station' },
};
export const PLACE_ORDER = Object.keys(PLACE_TYPES);

// Asking for the phone number makes each search a "Nearby Search Enterprise" call. One lookup
// is one search per type; Google's free monthly allowance covers a personal page many times over.
const FIELDS = ['id', 'displayName', 'location', 'shortFormattedAddress', 'internationalPhoneNumber', 'businessStatus'];
const MAX_RADIUS_M = 50000; // Google's limit

let optionsSet = false;
let authFailed = false;
const authListeners = new Set();

/** Loads one Maps JavaScript API library ('maps', 'marker', 'places', 'core'). */
export function loadGoogleMaps(library) {
  if (!optionsSet) {
    setOptions({ key: GOOGLE_MAPS_KEY, v: 'weekly' });
    // Google calls this when it rejects the key: wrong domain, API not enabled, or no billing account.
    window.gm_authFailure = () => {
      authFailed = true;
      authListeners.forEach((fn) => fn());
    };
    optionsSet = true;
  }
  return importLibrary(library);
}

/** Calls `fn` if Google rejects the key. Returns an unsubscribe function. */
export function onGoogleAuthFailure(fn) {
  if (authFailed) fn();
  authListeners.add(fn);
  return () => authListeners.delete(fn);
}

function toPlace(place, type) {
  if (!place.location || place.businessStatus === 'CLOSED_PERMANENTLY') return null;
  return {
    id: place.id,
    placeId: place.id,
    type,
    name: place.displayName || PLACE_TYPES[type].one,
    phone: place.internationalPhoneNumber || '',
    address: place.shortFormattedAddress || '',
    lat: place.location.lat(),
    lng: place.location.lng(),
  };
}

export async function fetchNearby(center, radiusM = 5000) {
  let searches;
  try {
    const { Place, SearchNearbyRankPreference } = await loadGoogleMaps('places');
    // One search per type, so twenty pharmacies can't push every hospital out of the results.
    searches = await Promise.allSettled(
      PLACE_ORDER.map((type) =>
        Place.searchNearby({
          fields: FIELDS,
          locationRestriction: { center, radius: Math.min(radiusM, MAX_RADIUS_M) },
          includedTypes: [type],
          maxResultCount: 20,
          rankPreference: SearchNearbyRankPreference.DISTANCE,
        }),
      ),
    );
  } catch (error) {
    searches = [{ status: 'rejected', reason: error }];
  }

  const failed = searches.filter((s) => s.status === 'rejected');
  failed.forEach((s) => console.error('Nearby search failed', s.reason));
  if (failed.length === searches.length) {
    throw new Error(
      navigator.onLine === false
        ? 'No connection. Check mobile data or Wi-Fi and try again.'
        : 'Couldn’t load nearby places. Try again, or use the Google Maps links below.',
    );
  }

  // A hospital is often also tagged as a pharmacy; keep it under the first type it matched.
  const seen = new Set();
  const places = [];
  searches.forEach((s, i) => {
    if (s.status !== 'fulfilled') return;
    for (const result of s.value.places) {
      if (seen.has(result.id)) continue;
      const place = toPlace(result, PLACE_ORDER[i]);
      if (!place) continue;
      seen.add(result.id);
      places.push(place);
    }
  });
  return places;
}
