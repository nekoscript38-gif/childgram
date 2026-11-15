/** ChildGram account rules shared by the sign-up form and tests. */

export const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;
export const PARENTAL_CONSENT_AGE = 13;
export const BIO_MAX = 200;
export const COMMENT_MAX = 300;
export const TITLE_MAX = 60;
export const PASSWORD_MIN = 8;
/** Below this age sign-up is refused (blocks fake "baby" accounts). Mirrors handle_new_user. */
export const MIN_SIGNUP_AGE = 4;

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

/** Sign-up is only open from MIN_SIGNUP_AGE (moyenne section) onwards. */
export function isOldEnoughToSignUp(birthDate: string, today: Date = new Date()) {
  const age = ageOn(birthDate, today);
  return !Number.isNaN(age) && age >= MIN_SIGNUP_AGE;
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

/**
 * ChildGram life stages for comments (see the Terms):
 * under 9 none, 9-13 (grand enfant / pré-ado), 14-17 (ado), 18-20 (pré-adulte), 21+ (adulte).
 */
export const MIN_COMMENT_AGE = 9;
export const AGE_BARRIER = 14;
export const PRE_ADULT_AGE = 18;
export const ADULT_AGE = 21;
export function commentAgeTier(age: number) {
  if (Number.isNaN(age) || age < MIN_COMMENT_AGE) return 0;
  if (age < AGE_BARRIER) return 1;
  if (age < PRE_ADULT_AGE) return 2;
  if (age < ADULT_AGE) return 3;
  return 4;
}
/**
 * Same stage can talk; 14-17 with 18-20 and 18-20 with 21+ too; 9-13 stays among itself.
 * Mirrors `ages_can_comment` in the database, which is the real enforcement.
 */
export function canCommentBetween(writerAge: number, authorAge: number) {
  const a = commentAgeTier(writerAge);
  const b = commentAgeTier(authorAge);
  if (a === 0 || b === 0) return false;
  return a === b || (Math.min(a, b) >= 2 && Math.abs(a - b) === 1);
}

/**
 * Admin soft-ban: a banned profile shows this age, frozen until the admin lifts the ban.
 * Mirrors `effective_age()` in the database, which drives every age rule (comments included).
 */
export const BANNED_AGE = 0;
export function effectiveAge(birthDate: string, bannedAt: string | null, today: Date = new Date()) {
  return bannedAt ? BANNED_AGE : ageOn(birthDate, today);
}
export function isBannedAge(age: number | null | undefined) {
  return age === BANNED_AGE;
}
/** Real birth dates must give at least 1 year: age 0 is reserved for the ban. */
export function isAllowedAdminBirthDate(birthDate: string, today: Date = new Date()) {
  return isValidBirthDate(birthDate, today) && ageOn(birthDate, today) > BANNED_AGE;
}
