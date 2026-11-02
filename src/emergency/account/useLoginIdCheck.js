import { useEffect, useMemo, useState } from 'react';
import { checkLoginIds } from '../accountApi';
import { LOGIN_ID_PATTERN, normalizeLoginId } from '../config';

const CHECK_DELAY_MS = 400; // after the last keystroke
const IDEAS_ASKED = 12; // with the ID itself, within one checkLoginIds call
const IDEAS_SHOWN = 4;
const NONE = new Map();

/** The answers kept so far plus `entries` ([id, free?]); answers about an older members list are dropped. */
const withAnswers = (prev, members, entries) => ({
  members,
  free: new Map([...(prev.members === members ? prev.free : NONE), ...entries]),
});

// Latin letters NFKD leaves whole, spelled out, so "Łukasz" doesn't come apart at the Ł.
const SPELLED = { ß: 'ss', æ: 'ae', œ: 'oe', ø: 'o', ł: 'l', đ: 'd', ð: 'd', þ: 'th', ı: 'i', ħ: 'h', ŧ: 't' };

/**
 * "S. Rāvi  O’Brien-Kumar" → ['s', 'ravi', 'obrien', 'kumar']: words in plain a–z and digits. A word
 * with letters from another script drops out whole rather than leaving pieces of itself behind.
 */
function nameParts(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[ßæœøłđðþıħŧ]/g, (c) => SPELLED[c])
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => /^[a-z0-9]+$/.test(word));
}

/**
 * Other IDs to offer when `id` (a valid one) is taken, best first: from the member's name, then
 * the ID with a number. Not checked yet.
 */
export function loginIdIdeas(id, name) {
  const parts = nameParts(name);
  // Initials make poor IDs, and often come first ("S. Ravi Kumar"): whole words where there are any.
  const first = parts.find((w) => w.length > 1) || parts[0] || '';
  const others = parts.filter((w) => w !== first);
  const last = others.findLast((w) => w.length > 1) || others.at(-1) || '';
  const fromName = last
    ? [first, `${first}.${last}`, `${first}${last}`, `${first}.${last[0]}`, `${first[0]}${last}`, `${first}_${last}`]
    : [first];
  const base = (id.replace(/[._-]*\d+$/, '') || id).slice(0, 29); // ravi2 → ravi
  const numbered = Array.from({ length: 9 }, (_, i) => `${base}${i + 1}`);
  return [...new Set([...fromName, ...numbered])].filter((x) => x !== id && LOGIN_ID_PATTERN.test(x)).slice(0, IDEAS_ASKED);
}

/**
 * Whether the ID typed into Add member is free, asked of the server once typing pauses, and free
 * alternatives when it isn't. `members` is the loaded members list (undefined while loading): their
 * IDs read as taken at once, and a new list (after a delete, say) forgets the earlier answers.
 *
 * Returns { id, status, ideas, ideasPending, retry, markTaken }. status is 'idle' (empty, or not a
 * valid ID yet), 'checking', 'free', 'taken' or 'error' (retry() asks again). ideas: up to
 * IDEAS_SHOWN free alternatives, once the ID is taken; ideasPending while more may come.
 */
export function useLoginIdCheck(loginId, name, members) {
  const id = normalizeLoginId(loginId);
  const valid = LOGIN_ID_PATTERN.test(id);
  const listed = useMemo(() => new Set((members || []).map((m) => m.loginId)), [members]);
  const [known, setKnown] = useState({ members, free: NONE }); // the server's answers: id → free?
  const [failed, setFailed] = useState(null); // the ask that failed
  const [attempt, setAttempt] = useState(0);

  const answers = known.members === members ? known.free : NONE;
  const isFree = (x) => (listed.has(x) ? false : answers.get(x)); // undefined: not known yet
  const own = valid ? isFree(id) : undefined;
  const ideas = useMemo(() => (valid ? loginIdIdeas(id, name) : []), [valid, id, name]);
  // A free ID needs no alternatives; for a taken one, only the ideas not answered yet are asked about.
  const ask = !valid || own === true ? [] : [...(own === undefined ? [id] : []), ...ideas.filter((x) => isFree(x) === undefined)];
  const askKey = ask.join(' ');

  useEffect(() => {
    if (!askKey) return undefined;
    let current = true;
    const timer = setTimeout(() => {
      setFailed(null);
      checkLoginIds(askKey.split(' ')).then(
        // Kept even when the ID has changed since: the next one may well be among them.
        ({ free, taken }) => setKnown((prev) => withAnswers(prev, members, [...free.map((x) => [x, true]), ...taken.map((x) => [x, false])])),
        // Only for the ask still on screen: an older one failing late would hide this one's answer.
        () => current && setFailed(askKey),
      );
    }, CHECK_DELAY_MS);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [askKey, members, attempt]);

  let status = 'idle';
  if (own === true) status = 'free';
  else if (own === false) status = 'taken';
  else if (valid) status = failed === askKey ? 'error' : 'checking';

  // In their order, up to the first one still being checked, so a better idea arriving late never
  // moves a button about to be tapped. Once the check has failed, the ones already known will do.
  const shown = [];
  for (const x of status === 'taken' ? ideas : []) {
    const free = isFree(x);
    if (free === undefined && failed !== askKey) break;
    if (free === true) shown.push(x);
    if (shown.length === IDEAS_SHOWN) break;
  }

  return {
    id,
    status,
    ideas: shown,
    ideasPending: status === 'taken' && askKey !== '' && failed !== askKey,
    retry: () => {
      setFailed(null);
      setAttempt((n) => n + 1);
    },
    /** Taken now: just added on this page, or found taken by createMember after all. */
    markTaken: (x) => setKnown((prev) => withAnswers(prev, members, [[x, false]])),
  };
}
