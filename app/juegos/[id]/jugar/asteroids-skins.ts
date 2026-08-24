// Paletas de ASTEROIDES. `clasico` reproduce EXACTAMENTE los literales que hoy
// están hardcodeados en asteroids-engine.ts — es el baseline de regresión.

import { SKIN_IDS, assertSkinContrast, type GameSkin, type SkinSet } from "./skins";

export interface AsteroidsExtra {
  ship: string;
  bullet: string;
  asteroid: string;
  thrust: string;
  particle: string;
  powerUp: string;
}

export type AsteroidsSkin = GameSkin<AsteroidsExtra>;

export const ASTEROIDS_SKINS: SkinSet<AsteroidsExtra> = {
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
    ship: "#ffffff",
    bullet: "#dedede",
    asteroid: "#c1c1c1",
    thrust: "rgba(255, 130, 0, 0.85)",
    particle: "#a7a7a7",
    powerUp: "#00ffff",
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
    glowBlur: 12,
    ship: "#ff2fe0",
    bullet: "#5df5ff",
    asteroid: "#8a5cff",
    thrust: "rgba(255, 165, 0, 0.9)",
    particle: "#eaff5d",
    powerUp: "#5dff9e",
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
    ship: "#4dff4d",
    bullet: "#c8ff8a",
    asteroid: "#3ecf3e",
    thrust: "rgba(255, 176, 0, 0.85)",
    particle: "#ff5a3a",
    powerUp: "#ffe066",
  },
};

if (process.env.NODE_ENV !== "production") {
  for (const id of SKIN_IDS) {
    const skin = ASTEROIDS_SKINS[id];
    assertSkinContrast(skin, [
      skin.ship,
      skin.bullet,
      skin.asteroid,
      skin.thrust,
      skin.particle,
      skin.powerUp,
    ]);
  }
}
