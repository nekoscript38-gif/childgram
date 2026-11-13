/** ChildGram account rules shared by the sign-up form and tests. */

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
export const PARENTAL_CONSENT_AGE = 13;
export const BIO_MAX = 200;
export const COMMENT_MAX = 300;
export const TITLE_MAX = 60;
export const PASSWORD_MIN = 8;

export function isValidUsername(username: string) {
  return USERNAME_RE.test(username.trim());
}

/** Children sign in with a pseudo only; auth needs an email, so we derive a private one. */
export function usernameToAuthEmail(username: string) {
  return `${username.trim().toLowerCase()}@childgram.local`;
}

export function ageOn(birthDate: string, today: Date = new Date()) {
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return NaN;
  let age = today.getFullYear() - y;
  const beforeBirthday =
    today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d);
  if (beforeBirthday) age -= 1;
  return age;
}

/** Under 13: the account must be opened by a parent / legal guardian with formal consent. */
export function needsParentalConsent(birthDate: string, today: Date = new Date()) {
  const age = ageOn(birthDate, today);
  return Number.isNaN(age) || age < PARENTAL_CONSENT_AGE;
}

/** A birth date must be a real day, not in the future, and at most 120 years ago. */
export function isValidBirthDate(birthDate: string, today: Date = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
  const [y = 0, m = 0, d = 0] = birthDate.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return false;
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (date > start) return false;
  const oldest = new Date(start.getFullYear() - 120, start.getMonth(), start.getDate());
  return date >= oldest;
}
