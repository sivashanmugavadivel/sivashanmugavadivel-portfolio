// A vehicle's insurance comes in two covers, often from different companies: third-party (the law
// requires it for every motor vehicle on the road; for one bought new it often runs for years) and
// own damage (the vehicle itself, renewed each year). One comprehensive policy can be both.

export const blankCover = () => ({ insurer: '', policyNumber: '', validUntil: '', phone: '' });

// Anything typed counts: a helpline alone is still worth showing.
const hasCover = (c) => Boolean(c?.insurer || c?.policyNumber || c?.validUntil || c?.phone);
const same = (a, b) => String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase();
// Filled in on both sides and different; one side left empty doesn't count.
const differ = (a, b) => Boolean(a && b) && !same(a, b);

/**
 * The vehicle with both covers filled out, as the editor edits it. Pages saved before the two
 * covers had a single insurer and policy number: that becomes the third-party cover, the one every
 * motor vehicle has, and the owner can move it in the editor.
 */
export function withCovers(vehicle) {
  const { insurer = '', policyNumber = '', ...rest } = vehicle ?? {};
  const thirdParty = { ...blankCover(), coversOwnDamage: false, ...rest.thirdParty };
  if (!thirdParty.insurer && !thirdParty.policyNumber && (insurer || policyNumber)) Object.assign(thirdParty, { insurer, policyNumber });
  return { ...rest, thirdParty, ownDamage: { ...blankCover(), ...rest.ownDamage } };
}

/** The profile with every vehicle in the two-cover shape (withCovers). */
export function profileWithCovers(profile) {
  if (!profile || !Array.isArray(profile.vehicles)) return profile;
  return { ...profile, vehicles: profile.vehicles.map(withCovers) };
}

/**
 * What the page shows, in order: [{ key, label, both, insurer, policyNumber, validUntil, phone }],
 * empty covers left out. One policy that covers both (ticked, or the same policy entered twice)
 * shows once, labelled Insurance, with `both` set. Entered twice with different dates or helplines
 * it's two covers: a new vehicle's bundled policy has one number, but its own-damage part ends years
 * before the third-party part, and that date must still show (and show as expired).
 */
export function vehicleCovers(vehicle) {
  const { thirdParty: tp, ownDamage: od } = withCovers(vehicle);
  const twice =
    hasCover(tp) &&
    hasCover(od) &&
    same(tp.insurer, od.insurer) &&
    same(tp.policyNumber, od.policyNumber) &&
    !differ(tp.validUntil, od.validUntil) &&
    !differ(tp.phone, od.phone);
  const covers = [];
  if (hasCover(tp)) {
    const both = tp.coversOwnDamage === true || twice;
    covers.push({
      key: 'thirdParty',
      label: both ? 'Insurance' : 'Third-party',
      both,
      insurer: tp.insurer,
      policyNumber: tp.policyNumber,
      validUntil: tp.validUntil || (twice ? od.validUntil : ''),
      phone: tp.phone || (twice ? od.phone : ''),
    });
  }
  if (hasCover(od) && !twice) {
    covers.push({ key: 'ownDamage', label: 'Own damage', both: false, ...od });
  }
  return covers;
}
