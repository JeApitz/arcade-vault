// Paletas de ARKANOID. `clasico` reproduce EXACTAMENTE los literales que hoy están
// hardcodeados en arkanoid-engine.ts — es el baseline de regresión. `tint`/`paddleTint`/
// `ballTint` alimentan el pipeline de teñido pre-horneado de arkanoid-sprites.ts;
// `null` (solo en `clasico`) significa "usa la hoja de sprites original, sin teñir".

import { SKIN_IDS, assertSkinContrast, type GameSkin, type SkinSet } from "./skins";

export type ArkanoidBlockColor =
  "red" | "cyan" | "green" | "magenta" | "yellow" | "hotpink" | "gray";

export interface ArkanoidExtra {
  tint: Record<ArkanoidBlockColor, string> | null;
  paddleTint: string | null;
  ballTint: string | null;
}

export type ArkanoidSkin = GameSkin<ArkanoidExtra>;

export const ARKANOID_SKINS: SkinSet<ArkanoidExtra> = {
  clasico: {
    id: "clasico",
    bg: "#08080c",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.65)",
    accent: "#ffffff",
    grid: "rgba(255,255,255,0.10)",
    danger: "#ffffff",
    overlay: "rgba(0,0,0,0.6)",
    glow: null,
    glowBlur: 0,
    tint: null,
    paddleTint: null,
    ballTint: null,
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
    tint: {
      red: "#ff2f5e",
      cyan: "#5df5ff",
      green: "#5dff9e",
      magenta: "#ff2fe0",
      yellow: "#f5ff5d",
      hotpink: "#ff8a3a",
      gray: "#b98aff",
    },
    paddleTint: "#ffb3f5",
    ballTint: "#ffffff",
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
    tint: {
      red: "#ff5a3a",
      yellow: "#ffe066",
      green: "#3ecf3e",
      cyan: "#5dffc8",
      gray: "#5de0ff",
      magenta: "#ff5a9e",
      hotpink: "#c8ff5d",
    },
    paddleTint: "#4dff4d",
    ballTint: "#ffffff",
  },
};

if (process.env.NODE_ENV !== "production") {
  for (const id of SKIN_IDS) {
    const skin = ARKANOID_SKINS[id];
    const extra = skin.tint
      ? [...Object.values(skin.tint), skin.paddleTint, skin.ballTint].filter(
          (c): c is string => c != null
        )
      : [];
    assertSkinContrast(skin, extra);
  }
}
