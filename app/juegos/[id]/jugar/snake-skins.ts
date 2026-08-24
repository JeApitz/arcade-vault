// Paletas de SNAKE. `clasico` reproduce EXACTAMENTE los literales que hoy están
// hardcodeados en snake-engine.ts — es el baseline de regresión.
//
// La fruta es un sprite fotográfico multicolor (fruits.png) — nunca se tiñe con
// composite operations (la volvería irreconocible); cada skin aplica un
// `ctx.filter` CSS a la única llamada `drawFruit`, o `null` para no aplicar nada.

import { SKIN_IDS, assertSkinContrast, type GameSkin, type SkinSet } from "./skins";

export interface SnakeExtra {
  head: string;
  body: string;
  fruitFilter: string | null;
}

export type SnakeSkin = GameSkin<SnakeExtra>;

export const SNAKE_SKINS: SkinSet<SnakeExtra> = {
  clasico: {
    id: "clasico",
    bg: "#05070a",
    fg: "#00ff88",
    fgDim: "rgba(255,255,255,0.65)",
    accent: "#00ff88",
    grid: "rgba(0, 255, 136, 0.10)",
    danger: "#ff3b5c",
    overlay: "rgba(0,0,0,0.6)",
    glow: "#00ff88",
    glowBlur: 8,
    head: "#00ff88",
    body: "rgba(0, 255, 136, 0.75)",
    fruitFilter: null,
  },
  neon: {
    id: "neon",
    bg: "#0a0417",
    fg: "#f5f0ff",
    fgDim: "rgba(230,220,255,0.72)",
    accent: "#39ffe0",
    grid: "rgba(57,255,224,0.14)",
    danger: "#ff2fa0",
    overlay: "rgba(6,1,18,0.65)",
    glow: "#39ffe0",
    glowBlur: 12,
    head: "#39ffe0",
    body: "rgba(57, 255, 224, 0.7)",
    fruitFilter: "saturate(1.6) brightness(1.15) drop-shadow(0 0 6px rgba(57,255,224,0.55))",
  },
  retro: {
    id: "retro",
    bg: "#0d1400",
    fg: "#9dff6b",
    fgDim: "rgba(157,255,107,0.68)",
    accent: "#c8ff4d",
    grid: "rgba(157,255,107,0.14)",
    danger: "#ffb000",
    overlay: "rgba(13,20,0,0.65)",
    glow: null,
    glowBlur: 0,
    head: "#c8ff4d",
    body: "rgba(157, 255, 77, 0.7)",
    fruitFilter: "sepia(0.55) saturate(2.4) hue-rotate(-25deg) contrast(1.1)",
  },
};

if (process.env.NODE_ENV !== "production") {
  for (const id of SKIN_IDS) {
    const skin = SNAKE_SKINS[id];
    assertSkinContrast(skin, [skin.head, skin.body]);
  }
}
