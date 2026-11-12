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
