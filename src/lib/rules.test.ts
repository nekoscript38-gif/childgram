import { describe, expect, it } from "vitest";
import { ageOn, isValidUsername, needsParentalConsent, usernameToAuthEmail } from "./rules";
import { AVATARS } from "./avatars";
import { BRUSH_SIZES, PALETTE } from "./palette";

const today = new Date(2026, 10, 12); // 12 Nov 2026

describe("parental consent rule", () => {
  it("requires consent for a 12-year-old", () => {
    expect(needsParentalConsent("2014-01-01", today)).toBe(true);
  });
  it("requires consent the day before the 13th birthday", () => {
    expect(needsParentalConsent("2013-11-13", today)).toBe(true);
  });
  it("does not require consent on the 13th birthday", () => {
    expect(needsParentalConsent("2013-11-12", today)).toBe(false);
  });
  it("computes age correctly", () => {
    expect(ageOn("2010-06-01", today)).toBe(16);
  });
});

describe("username", () => {
  it("accepts letters, digits and underscore, 3-20 chars", () => {
    expect(isValidUsername("Leo_42")).toBe(true);
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("léo")).toBe(false);
    expect(isValidUsername("a".repeat(21))).toBe(false);
  });
  it("maps to a case-insensitive private login", () => {
    expect(usernameToAuthEmail("Leo_42")).toBe(usernameToAuthEmail("leo_42"));
  });
});

describe("studio and avatars", () => {
  it("offers exactly 20 avatars", () => expect(AVATARS).toHaveLength(20));
  it("offers exactly 25 colors", () => expect(new Set(PALETTE).size).toBe(25));
  it("offers exactly 8 brush sizes", () => expect(BRUSH_SIZES).toHaveLength(8));
});
