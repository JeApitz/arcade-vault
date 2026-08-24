// Cimientos compartidos del sistema de skins: los 3 ids obligatorios, persistencia
// en localStorage (por juego) y utilidades de contraste WCAG usadas por cada
// `<juego>-skins.ts` para verificar sus propios colores antes de darlos por buenos.

export const SKIN_IDS = ["clasico", "neon", "retro"] as const;
export type SkinId = (typeof SKIN_IDS)[number];
export const DEFAULT_SKIN: SkinId = "clasico";
export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: "CLÁSICO",
  neon: "NEÓN",
  retro: "RETRO",
};

/** Núcleo que TODO skin de TODO juego debe tener. */
export interface SkinCore {
  id: SkinId;
  bg: string; // fondo del campo de juego — regla R4
  fg: string; // texto/HUD dentro del canvas
  fgDim: string; // texto secundario
  accent: string; // color protagonista (nave, serpiente, pala…)
  grid: string; // rejilla / bordes estructurales
  danger: string; // muerte, explosión, colisión
  overlay: string; // scrim rgba() de pausa y game over
  glow: string | null; // null = sin glow (clásico y retro)
  glowBlur: number; // shadowBlur cuando glow != null; máx 12
}

export type GameSkin<TExtra = Record<string, never>> = SkinCore & TExtra;
export type SkinSet<TExtra = Record<string, never>> = Record<SkinId, GameSkin<TExtra>>;

// --- Persistencia (localStorage, por juego) ---
const storageKey = (gameId: string) => `arcade-vault:skin:${gameId}`;

export function readSkinId(gameId: string): SkinId {
  if (typeof window === "undefined") return DEFAULT_SKIN;
  try {
    const v = window.localStorage.getItem(storageKey(gameId));
    return (SKIN_IDS as readonly string[]).includes(v ?? "") ? (v as SkinId) : DEFAULT_SKIN;
  } catch {
    return DEFAULT_SKIN;
  }
}

export function writeSkinId(gameId: string, id: SkinId): void {
  try {
    window.localStorage.setItem(storageKey(gameId), id);
  } catch {
    // modo privado / storage bloqueado — no-op
  }
}

// --- Contraste WCAG ---

function parseColor(color: string): { r: number; g: number; b: number; a: number } {
  const c = color.trim();
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((ch) => ch + ch)
        .join("");
    }
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return { r, g, b, a: 1 };
  }
  const m = c.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
  if (m) {
    return {
      r: Number(m[1]),
      g: Number(m[2]),
      b: Number(m[3]),
      a: m[4] !== undefined ? Number(m[4]) : 1,
    };
  }
  // color desconocido (p. ej. "transparent") — trátalo como negro opaco, seguro por defecto.
  return { r: 0, g: 0, b: 0, a: 1 };
}

/** Compone `fg` (posiblemente translúcido) sobre `bg` opaco. */
function composite(
  fg: { r: number; g: number; b: number; a: number },
  bg: { r: number; g: number; b: number; a: number }
) {
  const a = fg.a;
  return {
    r: fg.r * a + bg.r * (1 - a),
    g: fg.g * a + bg.g * (1 - a),
    b: fg.b * a + bg.b * (1 - a),
    a: 1,
  };
}

function relLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const chan = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
}

/** Ratio de contraste WCAG entre dos colores (hex o rgba); alpha de `a` se compone sobre `b`. */
export function contrastRatio(a: string, b: string): number {
  const bg = parseColor(b);
  const bgOpaque = composite(bg, { r: 10, g: 10, b: 15, a: 1 }); // fallback si `b` mismo trae alfa
  const fgComposited = composite(parseColor(a), bgOpaque);
  const l1 = relLuminance(fgComposited);
  const l2 = relLuminance(bgOpaque);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Luminancia relativa WCAG de un color (0–1). */
export function luminanceOf(color: string): number {
  return relLuminance(parseColor(color));
}

/** Matiz HSL en grados (0–360) de un color. */
export function hueOf(color: string): number {
  const { r, g, b } = parseColor(color);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return 0;
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d) % 6;
      break;
    case gn:
      h = (bn - rn) / d + 2;
      break;
    default:
      h = (rn - gn) / d + 4;
  }
  h *= 60;
  return h < 0 ? h + 360 : h;
}

function hueDelta(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Verifica R1–R9 sobre un skin del núcleo (más los colores extra propios del
 * juego). Reporta con console.error, nunca lanza — un color imperfecto no
 * debe romper la partida.
 */
export function assertSkinContrast<T>(skin: GameSkin<T>, extraColors: string[] = []): void {
  const tag = `[skin:${skin.id}]`;

  // R1 — texto
  const fgRatio = contrastRatio(skin.fg, skin.bg);
  if (fgRatio < 7.0) console.error(`${tag} R1: fg vs bg = ${fgRatio.toFixed(2)} (< 7.0)`);
  const fgDimRatio = contrastRatio(skin.fgDim, skin.bg);
  if (fgDimRatio < 4.5) console.error(`${tag} R1: fgDim vs bg = ${fgDimRatio.toFixed(2)} (< 4.5)`);

  // R2 — objetos de juego (núcleo + extras)
  const entities: Array<[string, string]> = [
    ["accent", skin.accent],
    ["danger", skin.danger],
    ...extraColors.map((c, i): [string, string] => [`extra[${i}]`, c]),
  ];
  for (const [name, color] of entities) {
    const r = contrastRatio(color, skin.bg);
    if (r < 3.0) console.error(`${tag} R2: ${name} vs bg = ${r.toFixed(2)} (< 3.0)`);
  }

  // R3 — distinguibilidad entre extras
  for (let i = 0; i < extraColors.length; i++) {
    for (let j = i + 1; j < extraColors.length; j++) {
      const r = contrastRatio(extraColors[i], extraColors[j]);
      const dh = hueDelta(hueOf(extraColors[i]), hueOf(extraColors[j]));
      if (r < 1.3 && dh < 30) {
        console.error(
          `${tag} R3: extra[${i}] vs extra[${j}] indistinguibles (ratio=${r.toFixed(2)}, Δhue=${dh.toFixed(1)})`
        );
      }
    }
  }

  // R4 — no choca con el fondo fijo del sitio
  const bgLum = luminanceOf(skin.bg);
  if (bgLum > 0.06) console.error(`${tag} R4: luminancia(bg) = ${bgLum.toFixed(4)} (> 0.06)`);
  const bgVsSite = contrastRatio(skin.bg, "#0a0a0f");
  if (bgVsSite > 1.6)
    console.error(`${tag} R4: contrastRatio(bg, #0a0a0f) = ${bgVsSite.toFixed(2)} (> 1.6)`);

  // R5 — fondo no absoluto
  if (bgLum < 0.002)
    console.error(`${tag} R5: luminancia(bg) = ${bgLum.toFixed(4)} (< 0.002, negro puro)`);

  // R6 — glow coherente
  if (skin.glow != null) {
    const dh = hueDelta(hueOf(skin.glow), hueOf(skin.accent));
    if (dh > 15) console.error(`${tag} R6: Δhue(glow, accent) = ${dh.toFixed(1)} (> 15)`);
    if (skin.glowBlur > 12) console.error(`${tag} R6: glowBlur = ${skin.glowBlur} (> 12)`);
  }

  // R7 — rejilla subordinada
  const gridRatio = contrastRatio(skin.grid, skin.bg);
  if (gridRatio < 1.15 || gridRatio > 2.2) {
    console.error(`${tag} R7: grid vs bg = ${gridRatio.toFixed(2)} (fuera de [1.15, 2.2])`);
  }

  // R8 — overlay
  const overlayColor = parseColor(skin.overlay);
  if (overlayColor.a < 0.55 || overlayColor.a > 0.75) {
    console.error(
      `${tag} R8: alfa(overlay) = ${overlayColor.a.toFixed(2)} (fuera de [0.55, 0.75])`
    );
  }
  const bgWithOverlay = composite(overlayColor, parseColor(skin.bg));
  const bgWithOverlayHex = `rgba(${Math.round(bgWithOverlay.r)}, ${Math.round(bgWithOverlay.g)}, ${Math.round(bgWithOverlay.b)}, 1)`;
  const fgVsOverlay = contrastRatio(skin.fg, bgWithOverlayHex);
  if (fgVsOverlay < 7.0) {
    console.error(`${tag} R8: fg vs (bg⊕overlay) = ${fgVsOverlay.toFixed(2)} (< 7.0)`);
  }

  // R9 — cobertura de campos del núcleo
  const coreFields: Array<keyof SkinCore> = [
    "id",
    "bg",
    "fg",
    "fgDim",
    "accent",
    "grid",
    "danger",
    "overlay",
    "glowBlur",
  ];
  for (const field of coreFields) {
    if (skin[field] === undefined)
      console.error(`${tag} R9: campo del núcleo "${field}" es undefined`);
  }
}
