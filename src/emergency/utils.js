export function cleanPhone(phone = '') {
  return String(phone).replace(/[^\d+]/g, '');
}

export const telHref = (phone) => `tel:${cleanPhone(phone)}`;

/** `?&body=` works on both Android and iOS Messages. */
export function smsHref(phone, body = '') {
  const to = cleanPhone(phone);
  return body ? `sms:${to}?&body=${encodeURIComponent(body)}` : `sms:${to}`;
}

export function whatsappHref(phone, text = '') {
  const to = cleanPhone(phone).replace(/^\+/, '');
  return `https://wa.me/${to}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

export const mapsSearchUrl = ({ lat, lng }) => `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
/** Google Maps centred on the phone’s own location, for when the page has no fix yet. */
export const mapsHereUrl = 'https://www.google.com/maps/@?api=1&map_action=map';
export const directionsUrl = ({ lat, lng, placeId }) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${placeId ? `&destination_place_id=${encodeURIComponent(placeId)}` : ''}`;

/** A Google Maps search ("Hospitals") around a point; without one, around wherever the phone is. Opens the app on phones. */
export const mapsNearbyUrl = (term, coords) =>
  coords
    ? `https://www.google.com/maps/search/${encodeURIComponent(term)}/@${coords.lat},${coords.lng},14z`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(term)}`;

export function ageFrom(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

export function initials(name = '') {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  );
}

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || name;

export function distanceKm(a, b) {
  const R = 6371;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
  if (km == null || Number.isNaN(km)) return '';
  if (km < 1) return `${Math.max(10, Math.round(km * 100) * 10)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export function severityTone(severity = '') {
  const s = severity.toLowerCase();
  if (s.startsWith('sev') || s.includes('life')) return 'red';
  if (s.startsWith('mod')) return 'amber';
  return 'neutral';
}

export function primaryContact(contacts = []) {
  return contacts.find((c) => c.primary && c.phone) || contacts.find((c) => c.phone) || null;
}

export function buildSosMessage(name = 'This person', coords) {
  const lines = [`EMERGENCY: ${name} needs help.`];
  if (coords) {
    lines.push(`Location: ${mapsSearchUrl(coords)}${coords.accuracy ? ` (within about ${coords.accuracy} m)` : ''}`);
  } else {
    lines.push('Location unavailable. Please call back.');
  }
  lines.push(`Sent by someone helping, from ${firstName(name)}’s emergency page.`);
  return lines.join('\n');
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    // Callers toast on the result, so a throwing execCommand must read as "not copied".
    try {
      area.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      area.remove();
    }
  }
}
