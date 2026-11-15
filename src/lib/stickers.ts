/**
 * Studio stickers: 50 emojis + 30 decorations. Stickers are stamped into the
 * canvas bitmap, so a saved drawing stays one single image.
 */

export type Sticker =
  | { kind: "emoji"; id: string; label: string; char: string }
  | { kind: "deco"; id: string; label: string; src: string };

export const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

/** Visual sizes (canvas pixels, canvas is 800×800) for placed stickers. */
export const STICKER_SIZES: number[] = [50, 80, 120, 170, 240];

const EMOJI_CHARS = [
  "😀", "😄", "😍", "🥰", "😎", "🤩", "😜", "🥳", "😇", "🤗",
  "😺", "🐶", "🐱", "🐰", "🦊", "🐻", "🐼", "🐨", "🦁", "🐸",
  "🐵", "🦄", "🐝", "🦋", "🐞", "🐢", "🐠", "🐬", "🐳", "🦖",
  "🌸", "🌻", "🌈", "⭐", "🌙", "☀️", "❄️", "🍀", "🍎", "🍓",
  "🍉", "🍕", "🍦", "🧁", "🍭", "🎈", "🎉", "🎁", "🚀", "👑",
];

export const EMOJI_STICKERS: Sticker[] = EMOJI_CHARS.map((char, i) => ({
  kind: "emoji",
  id: `emoji-${i + 1}`,
  label: `Emoji ${char}`,
  char,
}));

// ---------- decorations (hand-drawn SVG, 100×100) ----------
const INK = "#1f2340";

function star(cx: number, cy: number, R: number, r: number, n: number) {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rad = i % 2 ? r : R;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** Shapes with a thick ink outline around their union, then filled. */
const blob = (shapes: string, fill: string, w = 7) =>
  `<g fill="${INK}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round">${shapes}</g><g fill="${fill}">${shapes}</g>`;
/** A colored stroke with an ink border. */
const line = (d: string, color: string, w = 6) =>
  `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shine = (cx: number, cy: number, r = 5) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffffff" opacity="0.85"/>`;
const dot = (cx: number, cy: number, r: number, fill: string) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;

const HEART =
  "M50 88 C20 68 6 50 6 32 C6 18 17 8 30 8 C40 8 47 14 50 22 C53 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 68 50 88 Z";

const arc = (r: number) => `M${50 - r} 84 A${r} ${r} 0 0 1 ${50 + r} 84`;
const flakeArm = "M50 10 V90 M40 18 L50 27 L60 18 M40 82 L50 73 L60 82";
const petals = [0, 1, 2, 3, 4]
  .map((k) => {
    const a = ((k * 72 - 90) * Math.PI) / 180;
    return `<circle cx="${(50 + 25 * Math.cos(a)).toFixed(1)}" cy="${(50 + 25 * Math.sin(a)).toFixed(1)}" r="18"/>`;
  })
  .join("");
const pennant = (x: number, y: number, fill: string) =>
  blob(`<polygon points="${x - 9},${y} ${x + 9},${y} ${x},${y + 34}"/>`, fill, 5);

const DECORATION_BODIES: { label: string; body: string }[] = [
  { label: "Étoile", body: blob(`<polygon points="${star(50, 53, 44, 19, 5)}"/>`, "#ffd23f") + shine(42, 40, 5) },
  { label: "Cœur", body: blob(`<path d="${HEART}"/>`, "#ff5c8a") + shine(28, 28, 6) },
  {
    label: "Nuage",
    body: blob(
      `<circle cx="32" cy="58" r="20"/><circle cx="52" cy="44" r="24"/><circle cx="72" cy="58" r="18"/><rect x="20" y="56" width="62" height="22" rx="11"/>`,
      "#ffffff",
    ),
  },
  {
    label: "Arc-en-ciel",
    body:
      `<path d="${arc(29)}" fill="none" stroke="${INK}" stroke-width="34"/>` +
      [
        [41, "#e53935"],
        [35, "#ff9800"],
        [29, "#ffe066"],
        [23, "#66bb6a"],
        [17, "#42a5f5"],
      ]
        .map(([r, c]) => `<path d="${arc(r as number)}" fill="none" stroke="${c}" stroke-width="6"/>`)
        .join("") +
      blob(`<circle cx="14" cy="84" r="10"/><circle cx="26" cy="87" r="8"/>`, "#ffffff", 5) +
      blob(`<circle cx="86" cy="84" r="10"/><circle cx="74" cy="87" r="8"/>`, "#ffffff", 5),
  },
  {
    label: "Soleil",
    body:
      blob(`<polygon points="${star(50, 50, 45, 32, 12)}"/>`, "#ff9800") +
      blob(`<circle cx="50" cy="50" r="24"/>`, "#ffd23f", 5) +
      dot(42, 46, 3, INK) +
      dot(58, 46, 3, INK) +
      `<path d="M41 56 Q50 64 59 56" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  },
  { label: "Lune", body: blob(`<path d="M60 8 A42 42 0 1 0 92 62 A34 34 0 0 1 60 8 Z"/>`, "#ffe066") },
  {
    label: "Étincelle",
    body:
      blob(`<polygon points="${star(46, 54, 42, 12, 4)}"/>`, "#fff3a3") +
      blob(`<polygon points="${star(80, 20, 14, 4, 4)}"/>`, "#9ad0ff", 5),
  },
  { label: "Fleur", body: blob(petals, "#ff8fab") + blob(`<circle cx="50" cy="50" r="14"/>`, "#ffd23f", 5) },
  {
    label: "Ballon",
    body:
      `<path d="M50 77 Q40 86 50 95" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      blob(`<ellipse cx="50" cy="40" rx="28" ry="33"/><polygon points="44,77 56,77 50,70"/>`, "#e53935") +
      shine(38, 26, 6),
  },
  { label: "Éclair", body: blob(`<polygon points="58,4 16,56 44,56 34,96 84,40 56,40 68,4"/>`, "#ffd23f") },
  {
    label: "Note de musique",
    body: blob(
      `<ellipse cx="36" cy="76" rx="16" ry="12"/><rect x="44" y="12" width="8" height="64"/><path d="M52 12 C70 20 84 30 78 52 C76 40 66 34 52 32 Z"/>`,
      "#8e5cd9",
    ),
  },
  {
    label: "Couronne",
    body:
      blob(
        `<polygon points="10,80 14,26 32,50 50,16 68,50 86,26 90,80"/><circle cx="14" cy="24" r="6"/><circle cx="50" cy="14" r="6"/><circle cx="86" cy="24" r="6"/>`,
        "#ffc107",
      ) +
      dot(30, 66, 5, "#e53935") +
      dot(50, 64, 6, "#42a5f5") +
      dot(70, 66, 5, "#66bb6a"),
  },
  {
    label: "Diamant",
    body:
      blob(`<polygon points="28,14 72,14 94,38 50,92 6,38"/>`, "#4dd0c4") +
      `<path d="M6 38 H94 M28 14 L40 38 L50 92 L60 38 L72 14" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` +
      shine(30, 26, 4),
  },
  {
    label: "Goutte",
    body: blob(`<path d="M50 6 C66 34 82 50 82 66 A32 32 0 0 1 18 66 C18 50 34 34 50 6 Z"/>`, "#42a5f5") + shine(36, 62, 6),
  },
  {
    label: "Feuille",
    body:
      blob(`<path d="M14 86 C14 40 44 12 90 10 C88 56 60 86 14 86 Z"/>`, "#66bb6a") +
      `<path d="M18 82 C40 60 60 40 84 16" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  },
  {
    label: "Flocon",
    body:
      [0, 60, 120]
        .map((a) => `<path transform="rotate(${a} 50 50)" d="${flakeArm}" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`)
        .join("") +
      [0, 60, 120]
        .map((a) => `<path transform="rotate(${a} 50 50)" d="${flakeArm}" fill="none" stroke="#9ad0ff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`)
        .join(""),
  },
  {
    label: "Nœud",
    body:
      blob(
        `<path d="M50 50 L10 22 Q2 50 10 78 Z M50 50 L90 22 Q98 50 90 78 Z M44 58 L32 92 L46 88 L50 62 Z M56 58 L68 92 L54 88 L50 62 Z"/>`,
        "#ff5c8a",
      ) + blob(`<rect x="40" y="38" width="20" height="24" rx="8"/>`, "#ff8fab", 5),
  },
  {
    label: "Bulle de BD",
    body:
      blob(
        `<path d="M16 14 H84 Q94 14 94 24 V60 Q94 70 84 70 H44 L24 90 L28 70 H16 Q6 70 6 60 V24 Q6 14 16 14 Z"/>`,
        "#ffffff",
      ) +
      dot(32, 42, 6, INK) +
      dot(50, 42, 6, INK) +
      dot(68, 42, 6, INK),
  },
  {
    label: "Spirale",
    body: line("M44 50 a6 6 0 0 1 12 0 a12 12 0 0 1 -24 0 a18 18 0 0 1 36 0 a24 24 0 0 1 -48 0 a30 30 0 0 1 60 0", "#ff8fab"),
  },
  {
    label: "Confettis",
    body: `<g stroke="${INK}" stroke-width="3" stroke-linejoin="round"><rect x="14" y="16" width="16" height="9" fill="#e53935" transform="rotate(25 22 20)"/><circle cx="72" cy="20" r="7" fill="#ffd23f"/><polygon points="${star(46, 46, 14, 6, 5)}" fill="#42a5f5"/><rect x="70" y="52" width="18" height="9" fill="#66bb6a" transform="rotate(-30 79 56)"/><circle cx="22" cy="68" r="7" fill="#8e5cd9"/><rect x="42" y="76" width="16" height="9" fill="#ff8fab" transform="rotate(50 50 80)"/><polygon points="${star(82, 86, 10, 4, 5)}" fill="#ff9800"/><circle cx="50" cy="12" r="5" fill="#4dd0c4"/></g>`,
  },
  {
    label: "Cadeau",
    body:
      blob(
        `<ellipse cx="38" cy="18" rx="12" ry="8" transform="rotate(20 38 18)"/><ellipse cx="62" cy="18" rx="12" ry="8" transform="rotate(-20 62 18)"/>`,
        "#ffd23f",
        5,
      ) +
      blob(`<rect x="14" y="42" width="72" height="50" rx="4"/><rect x="8" y="28" width="84" height="18" rx="4"/>`, "#e53935") +
      `<rect x="44" y="28" width="12" height="64" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>`,
  },
  {
    label: "Champignon",
    body:
      blob(`<rect x="34" y="50" width="32" height="40" rx="12"/>`, "#f4d6a0") +
      blob(`<path d="M8 56 C8 24 30 8 50 8 C70 8 92 24 92 56 Z"/>`, "#e53935") +
      dot(30, 38, 6, "#ffffff") +
      dot(54, 24, 7, "#ffffff") +
      dot(72, 42, 5, "#ffffff"),
  },
  {
    label: "Papillon",
    body:
      `<path d="M48 24 Q40 8 32 8 M52 24 Q60 8 68 8" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` +
      blob(
        `<ellipse cx="30" cy="36" rx="22" ry="18" transform="rotate(-20 30 36)"/><ellipse cx="70" cy="36" rx="22" ry="18" transform="rotate(20 70 36)"/><ellipse cx="34" cy="70" rx="16" ry="14"/><ellipse cx="66" cy="70" rx="16" ry="14"/>`,
        "#8e5cd9",
      ) +
      dot(28, 36, 6, "#ffe066") +
      dot(72, 36, 6, "#ffe066") +
      dot(34, 70, 4, "#ff8fab") +
      dot(66, 70, 4, "#ff8fab") +
      blob(`<rect x="45" y="22" width="10" height="62" rx="5"/>`, "#5b5f73", 4),
  },
  {
    label: "Sucette",
    body:
      blob(`<rect x="46" y="54" width="8" height="42" rx="3"/>`, "#ffffff", 5) +
      blob(`<circle cx="50" cy="38" r="32"/>`, "#ff8fab") +
      `<path d="M46 38 a4 4 0 0 1 8 0 a8 8 0 0 1 -16 0 a12 12 0 0 1 24 0 a16 16 0 0 1 -32 0 a20 20 0 0 1 40 0" fill="none" stroke="#d81b60" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    label: "Fanions",
    body:
      `<path d="M4 20 Q50 40 96 20" fill="none" stroke="${INK}" stroke-width="3"/>` +
      pennant(17, 25, "#e53935") +
      pennant(39, 29, "#ffd23f") +
      pennant(61, 29, "#42a5f5") +
      pennant(83, 25, "#66bb6a"),
  },
  {
    label: "Planète",
    body:
      blob(`<circle cx="50" cy="50" r="28"/>`, "#ff9800") +
      `<ellipse cx="50" cy="52" rx="46" ry="12" transform="rotate(-15 50 52)" fill="none" stroke="${INK}" stroke-width="10"/>` +
      `<ellipse cx="50" cy="52" rx="46" ry="12" transform="rotate(-15 50 52)" fill="none" stroke="#ffe066" stroke-width="4"/>` +
      `<path d="M22 52 A28 28 0 0 1 78 52 Z" fill="#ff9800" transform="rotate(-15 50 52)"/>` +
      shine(40, 36, 5),
  },
  {
    label: "Étoile filante",
    body:
      line("M8 92 L46 54", "#ff8fab", 5) +
      line("M6 68 L36 46", "#ffe066", 4) +
      line("M30 96 L56 70", "#9ad0ff", 4) +
      blob(`<polygon points="${star(66, 36, 28, 12, 5)}"/>`, "#ffd23f"),
  },
  {
    label: "Deux cœurs",
    body:
      `<g transform="translate(4 40) scale(0.6)">${blob(`<path d="${HEART}"/>`, "#ff8fab", 10)}</g>` +
      `<g transform="translate(40 8) scale(0.58)">${blob(`<path d="${HEART}"/>`, "#e53935", 10)}</g>`,
  },
  {
    label: "Bulles",
    body:
      `<g fill="#bfe6ff" stroke="${INK}" stroke-width="4"><circle cx="36" cy="62" r="26"/><circle cx="74" cy="30" r="16"/><circle cx="78" cy="76" r="12"/><circle cx="22" cy="20" r="9"/></g>` +
      shine(26, 52, 6) +
      shine(68, 24, 4) +
      shine(74, 72, 3),
  },
  {
    label: "Trèfle",
    body:
      line("M56 60 Q70 80 64 94", "#2e7d32", 5) +
      blob(
        `<circle cx="50" cy="30" r="18"/><circle cx="70" cy="50" r="18"/><circle cx="50" cy="70" r="18"/><circle cx="30" cy="50" r="18"/>`,
        "#66bb6a",
      ) +
      dot(50, 50, 6, "#2e7d32"),
  },
];

const toDataUrl = (body: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="240" height="240">${body}</svg>`,
  )}`;

export const DECORATION_STICKERS: Sticker[] = DECORATION_BODIES.map((d, i) => ({
  kind: "deco",
  id: `deco-${i + 1}`,
  label: d.label,
  src: toDataUrl(d.body),
}));
