import { describe, expect, it } from "vitest";
import { DECORATION_STICKERS, EMOJI_STICKERS } from "./stickers";

describe("studio stickers", () => {
  it("offers exactly 50 different emojis", () => {
    const chars = EMOJI_STICKERS.map((s) => (s.kind === "emoji" ? s.char : ""));
    expect(chars).toHaveLength(50);
    expect(new Set(chars).size).toBe(50);
  });

  it("offers exactly 30 different decorations", () => {
    expect(DECORATION_STICKERS).toHaveLength(30);
    expect(new Set(DECORATION_STICKERS.map((s) => s.label)).size).toBe(30);
  });
});
