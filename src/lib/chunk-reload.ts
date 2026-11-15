/**
 * After the app is updated, a page left open can ask for old page files that
 * no longer exist. Browsers then throw e.g. "Importing a module script failed"
 * (Safari). Reloading once fetches the new files and fixes the blank screen.
 */
const CHUNK_ERROR_PATTERNS = [
  /Importing a module script failed/i, // Safari
  /Failed to fetch dynamically imported module/i, // Chrome
  /error loading dynamically imported module/i, // Firefox
  /Unable to preload CSS/i,
  /ChunkLoadError/i,
];

export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error ? `${error.name} ${error.message}` : typeof error === "string" ? error : "";
  return CHUNK_ERROR_PATTERNS.some((re) => re.test(message));
}

const KEY = "childgram:chunk-reload-at";
const MIN_INTERVAL_MS = 15_000;

/** Reloads the page once; returns false if we already tried very recently (avoids loops). */
export function reloadForStaleChunk(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < MIN_INTERVAL_MS) return false;
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // storage blocked: still try a single reload
  }
  window.location.reload();
  return true;
}
