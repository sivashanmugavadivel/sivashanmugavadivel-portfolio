// Health insurance: as many policies as someone has, often a corporate one through their employer
// and a personal one of their own.

export const HEALTH_POLICY_TYPES = ['Personal', 'Corporate', 'Government scheme', 'Other'];

export const blankHealthPolicy = () => ({ provider: '', type: '', policyNumber: '', memberId: '', validUntil: '', phone: '' });

const isObject = (p) => Boolean(p) && typeof p === 'object' && !Array.isArray(p);
const hasPolicy = (p) => Boolean(p.provider || p.policyNumber || p.memberId || p.validUntil || p.phone);

/**
 * medical.insurance as a list of policies with every field. Pages saved before there could be
 * several kept one policy there as an object ({ provider, policyNumber, phone }): it becomes the
 * only one, unless it was the empty one a new page starts with.
 */
function policyList(insurance) {
  const list = Array.isArray(insurance) ? insurance.filter(isObject) : isObject(insurance) && hasPolicy(insurance) ? [insurance] : [];
  return list.map((p) => ({ ...blankHealthPolicy(), ...p }));
}

/** The policies to show, in order: one with nothing but a type is left out. */
export const healthPolicies = (medical) => policyList(medical?.insurance).filter(hasPolicy);

/**
 * The profile with medical.insurance as a list, as the editor edits it. Every policy stays, even one
 * with only its type picked so far: the editor would otherwise drop it and the next save delete it.
 */
export function profileWithHealthPolicies(profile) {
  if (!isObject(profile?.medical)) return profile;
  return { ...profile, medical: { ...profile.medical, insurance: policyList(profile.medical.insurance) } };
}
