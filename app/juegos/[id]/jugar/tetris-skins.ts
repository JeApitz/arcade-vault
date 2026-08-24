// Paletas de TETRIS. `clasico` reproduce los literales de tetris-engine.ts (paleta
// "Tokyo Night" original) con ajustes mínimos donde el original no distinguía bien
// dos piezas entre sí (R3) o la rejilla se perdía contra el fondo (R7) — ver el
// detalle en references/game-with-themes.md.

import { SKIN_IDS, assertSkinContrast, type GameSkin, type SkinSet } from "./skins";

/** Estilo del panel DOM (chrome) alrededor del canvas: SCORE/LINES/LEVEL, NEXT, CONTROLS. */
export interface TetrisDom {
  border: string;
  canvasBg: string;
  label: string;
  value: string;
  controlsText: string;
  kbdBg: string;
  kbdBorder: string;
  kbdText: string;
}

export interface TetrisExtra {
  /** Color de cada índice de pieza (0 = vacío, sin usar; 1..7 = I,O,T,S,Z,J,L; 8 = N, sin spawnear hoy). */
  pieces: [null, string, string, string, string, string, string, string, string];
  /** Alfa del fantasma (silueta de caída) sobre `pieces`. */
  ghostAlpha: number;
  dom: TetrisDom;
}

export type TetrisSkin = GameSkin<TetrisExtra>;

export const TETRIS_SKINS: SkinSet<TetrisExtra> = {
  clasico: {
    id: "clasico",
    bg: "#1a1a25",
    fg: "#e6e6f0",
    fgDim: "rgba(230,230,240,0.7)",
    accent: "#7aa2f7",
    grid: "#2a2a3a",
    danger: "#e57373",
    overlay: "rgba(0,0,0,0.6)",
    glow: null,
    glowBlur: 0,
    ghostAlpha: 0.2,
    pieces: [
      null,
      "#4dd0e1", // I - cyan
      "#ffd54f", // O - yellow
      "#ba68c8", // T - purple
      "#81c784", // S - green
      "#e57373", // Z - red
      "#5c7cfa", // J - azul índigo (era #90caf9, muy cerca de I en R3; se oscurece/satura)
      "#ff9800", // L - naranja (era #ffb74d, muy cerca de O en R3; se satura)
      "#a1835c", // N - tuerca, bronce (era #9e9e9e; sin pieza spawneable hoy, ver gotcha)
    ],
    dom: {
      border: "#2a2a3a",
      canvasBg: "#1a1a25",
      label: "#555570",
      value: "#7aa2f7",
      controlsText: "#888888",
      kbdBg: "#22223a",
      kbdBorder: "#3a3a5a",
      kbdText: "#aaaaaa",
    },
  },
  neon: {
    id: "neon",
    bg: "#0a0414",
    fg: "#f2f0ff",
    fgDim: "rgba(230,225,255,0.72)",
    accent: "#ff2fe0",
    grid: "rgba(255,47,224,0.22)",
    danger: "#ff2f5e",
    overlay: "rgba(5,1,15,0.65)",
    glow: "#ff2fe0",
    glowBlur: 10,
    ghostAlpha: 0.25,
    pieces: [
      null,
      "#5df5ff", // I
      "#f5ff5d", // O
      "#ff2fe0", // T
      "#5dff9e", // S
      "#ff2f5e", // Z
      "#5d8aff", // J
      "#ff8a3a", // L
      "#8a5cff", // N
    ],
    dom: {
      border: "rgba(255,47,224,0.45)",
      canvasBg: "#0a0414",
      label: "rgba(242,240,255,0.55)",
      value: "#ff2fe0",
      controlsText: "rgba(242,240,255,0.6)",
      kbdBg: "#1a0a2a",
      kbdBorder: "rgba(255,47,224,0.5)",
      kbdText: "#f2f0ff",
    },
  },
  retro: {
    id: "retro",
    bg: "#0d1400",
    fg: "#9dff6b",
    fgDim: "rgba(157,255,107,0.68)",
    accent: "#4dff4d",
    grid: "rgba(77,255,77,0.14)",
    danger: "#ffb000",
    overlay: "rgba(13,20,0,0.65)",
    glow: null,
    glowBlur: 0,
    ghostAlpha: 0.22,
    pieces: [
      null,
      "#5dffc8", // I
      "#ffe066", // O
      "#ff5a9e", // T
      "#3ecf3e", // S
      "#ff5a3a", // Z
      "#5de0ff", // J
      "#c8ff5d", // L
      "#ffb000", // N
    ],
    dom: {
      border: "#3ecf3e",
      canvasBg: "#0d1400",
      label: "rgba(157,255,107,0.55)",
      value: "#4dff4d",
      controlsText: "rgba(157,255,107,0.65)",
      kbdBg: "#142200",
      kbdBorder: "#3ecf3e",
      kbdText: "#9dff6b",
    },
  },
};

if (process.env.NODE_ENV !== "production") {
  for (const id of SKIN_IDS) {
    const skin = TETRIS_SKINS[id];
    assertSkinContrast(
      skin,
      skin.pieces.filter((c): c is string => c !== null)
    );
  }
}
