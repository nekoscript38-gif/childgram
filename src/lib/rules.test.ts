import { describe, expect, it } from "vitest";
import { ageOn, canCommentBetween, isOldEnoughToSignUp, isValidBirthDate, isValidUsername, needsParentalConsent, sameAgeGroup, usernameToAuthEmail } from "./rules";
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

describe("admin birth date correction", () => {
  it("rejects a birth date in the future", () => {
    expect(isValidBirthDate("2026-11-13", today)).toBe(false);
  });
  it("accepts today's date", () => {
    expect(isValidBirthDate("2026-11-12", today)).toBe(true);
  });
  it("rejects a date more than 120 years ago", () => {
    expect(isValidBirthDate("1906-11-11", today)).toBe(false);
  });
  it("rejects an impossible day", () => {
    expect(isValidBirthDate("2015-02-30", today)).toBe(false);
  });
});

describe("age barrier for comments", () => {
  it("blocks a 14-year-old from commenting a 13-year-old", () => {
    expect(sameAgeGroup(14, 13)).toBe(false);
  });
  it("blocks a 13-year-old from commenting a 14-year-old", () => {
    expect(sameAgeGroup(13, 14)).toBe(false);
  });
  it("allows two kids under 14", () => {
    expect(sameAgeGroup(9, 13)).toBe(true);
  });
  it("allows two users aged 14 and over", () => {
    expect(sameAgeGroup(14, 18)).toBe(true);
  });
});

describe("under-9 comment block", () => {
  it("blocks an 8-year-old from writing a comment to another 8-year-old", () => {
    expect(canCommentBetween(8, 8)).toBe(false);
  });
  it("blocks a 13-year-old from commenting a 5-year-old", () => {
    expect(canCommentBetween(13, 5)).toBe(false);
  });
  it("blocks an 8-year-old from commenting a 10-year-old", () => {
    expect(canCommentBetween(8, 10)).toBe(false);
  });
  it("allows a 9-year-old and a 13-year-old", () => {
    expect(canCommentBetween(9, 13)).toBe(true);
  });
  it("still blocks 14+ from commenting a 10-year-old", () => {
    expect(canCommentBetween(15, 10)).toBe(false);
  });
});

describe("minimum sign-up age", () => {
  it("refuses a 3-year-old", () => {
    expect(isOldEnoughToSignUp("2023-01-01", today)).toBe(false);
  });
  it("refuses the day before the 4th birthday", () => {
    expect(isOldEnoughToSignUp("2022-11-13", today)).toBe(false);
  });
  it("accepts a child on their 4th birthday", () => {
    expect(isOldEnoughToSignUp("2022-11-12", today)).toBe(true);
  });
});
