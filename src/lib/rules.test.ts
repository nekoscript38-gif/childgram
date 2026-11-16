import { describe, expect, it } from "vitest";
import { ageOn, canCommentBetween, canSendBanMessage, effectiveAge, isAllowedAdminBirthDate, isOldEnoughToSignUp, isTooOldToSignUp, isValidBirthDate, isValidUsername, needsParentalConsent, usernameToAuthEmail } from "./rules";
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
    expect(canCommentBetween(14, 13)).toBe(false);
  });
  it("blocks a 13-year-old from commenting a 14-year-old", () => {
    expect(canCommentBetween(13, 14)).toBe(false);
  });
  it("allows two kids aged 9 to 13", () => {
    expect(canCommentBetween(9, 13)).toBe(true);
  });
  it("allows two teens aged 14 to 17", () => {
    expect(canCommentBetween(14, 17)).toBe(true);
  });
});

describe("pré-adultes (18-20) and adults (21+)", () => {
  it("lets a 16-year-old and a 19-year-old talk both ways", () => {
    expect(canCommentBetween(16, 19)).toBe(true);
    expect(canCommentBetween(19, 16)).toBe(true);
  });
  it("blocks a 17-year-old and a 21-year-old both ways", () => {
    expect(canCommentBetween(17, 21)).toBe(false);
    expect(canCommentBetween(21, 17)).toBe(false);
  });
  it("lets a 20-year-old and a 30-year-old talk", () => {
    expect(canCommentBetween(20, 30)).toBe(true);
    expect(canCommentBetween(30, 20)).toBe(true);
  });
  it("blocks a 13-year-old and an 18-year-old", () => {
    expect(canCommentBetween(13, 18)).toBe(false);
    expect(canCommentBetween(18, 13)).toBe(false);
  });
  it("allows two adults", () => {
    expect(canCommentBetween(21, 45)).toBe(true);
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

describe("maximum sign-up age", () => {
  it("accepts someone who is 39", () => {
    expect(isTooOldToSignUp("1987-01-01", today)).toBe(false);
  });
  it("accepts the day before the 40th birthday", () => {
    expect(isTooOldToSignUp("1986-11-13", today)).toBe(false);
  });
  it("refuses someone on their 40th birthday", () => {
    expect(isTooOldToSignUp("1986-11-12", today)).toBe(true);
  });
  it("refuses a 55-year-old", () => {
    expect(isTooOldToSignUp("1971-03-01", today)).toBe(true);
  });
});

describe("admin soft-ban (age 0)", () => {
  it("a banned profile is 0 years old whatever its birth date", () => {
    expect(effectiveAge("2010-06-01", "2026-11-14T19:00:00Z", today)).toBe(0);
  });
  it("stays at 0 years later, until the ban is lifted", () => {
    expect(effectiveAge("2010-06-01", "2026-11-14T19:00:00Z", new Date(2031, 0, 1))).toBe(0);
    expect(effectiveAge("2010-06-01", null, today)).toBe(16);
  });
  it("a banned profile can't comment or be commented", () => {
    expect(canCommentBetween(effectiveAge("2010-06-01", "x", today), 16)).toBe(false);
    expect(canCommentBetween(16, effectiveAge("2010-06-01", "x", today))).toBe(false);
  });
  it("the admin can't set a birth date giving 0 years", () => {
    expect(isAllowedAdminBirthDate("2026-05-01", today)).toBe(false);
    expect(isAllowedAdminBirthDate("2025-11-12", today)).toBe(true);
  });
});

describe("private ban messaging", () => {
  const base = { senderId: "kid", senderIsAdmin: false, conversationUserId: "kid", conversationUserBanned: true };
  it("a banned profile can write to the admin", () => {
    expect(canSendBanMessage(base)).toBe(true);
  });
  it("a profile that is not banned can't use the messaging", () => {
    expect(canSendBanMessage({ ...base, conversationUserBanned: false })).toBe(false);
  });
  it("a user can't write in another user's conversation", () => {
    expect(canSendBanMessage({ ...base, senderId: "other" })).toBe(false);
  });
  it("the admin can write to a banned profile", () => {
    expect(canSendBanMessage({ ...base, senderId: "admin", senderIsAdmin: true })).toBe(true);
  });
  it("the admin can't write to a profile that is not banned", () => {
    expect(canSendBanMessage({ ...base, senderId: "admin", senderIsAdmin: true, conversationUserBanned: false })).toBe(false);
  });
});
