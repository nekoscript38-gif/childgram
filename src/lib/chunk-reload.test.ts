import { describe, expect, it } from "vitest";
import { isChunkLoadError } from "./chunk-reload";

describe("isChunkLoadError", () => {
  it("recognises the Safari stale-page error", () => {
    expect(isChunkLoadError(new TypeError("Importing a module script failed."))).toBe(true);
  });
  it("recognises the Chrome stale-page error", () => {
    expect(isChunkLoadError(new TypeError("Failed to fetch dynamically imported module: /src/routes/auth.tsx"))).toBe(true);
  });
  it("ignores ordinary errors", () => {
    expect(isChunkLoadError(new Error("Tu n'es plus connecté"))).toBe(false);
  });
});
