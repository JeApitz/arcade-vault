// Paletas de FROGGER. `clasico` reproduce casi exactamente los literales que hoy
// están hardcodeados en frogger-engine.ts — con dos desviaciones mínimas
// documentadas abajo, necesarias para que R3 (distinguibilidad) pase: el verde
// de la rana/meta y el de la tortuga eran demasiado parecidos entre sí.
//
// Frogger no usa sprites bitmap — todo es dibujo procedural (fillRect/ellipse/arc),
// igual que asteroides y tetris. `grid` se usa para una línea divisoria sutil entre
// filas (adición estructural nueva, no cambia mecánica ni identidad visual).

import { SKIN_IDS, assertSkinContrast, type GameSkin, type SkinSet } from "./skins";

export interface FroggerExtra {
  cars: [string, string, string];
  truck: string;
  truckCabin: string;
  tire: string;
  log: string;
  logGrain: string;
  turtle: string;
  turtleSubmerged: string;
  zoneRiver: string;
  zoneSafe: string;
  zoneGoal: string;
  goalBorder: string;
  goalFilled: string;
  timeGood: string;
  timeWarn: string;
  eyeWhite: string;
  eyePupil: string;
}

export type FroggerSkin = GameSkin<FroggerExtra>;

export const FROGGER_SKINS: SkinSet<FroggerExtra> = {
  clasico: {
    id: "clasico",
    bg: "#0a0a0a",
    fg: "#ffffff",
    fgDim: "rgba(255,255,255,0.65)",
    // era #7CFC00: se desatura levemente hacia el verde puro (Δhue +25° sobre el
    // amarillo de los coches y +25° sobre la tortuga) para que R3 distinga rana/
    // meta de ambos sin perder la identidad "lima" del original.
    accent: "#5ee600",
    grid: "rgba(255,255,255,0.08)",
    danger: "#ff3b5c",
    overlay: "rgba(0,0,0,0.6)",
    glow: null,
    glowBlur: 0,
    cars: ["#ff3b5c", "#f5ff5d", "#5df5ff"],
    truck: "#9aa0a6",
    truckCabin: "#5b6066",
    tire: "#111111",
    log: "#8a5a30",
    logGrain: "rgba(0,0,0,0.35)",
    // era #3ecf3e: se vira hacia el teal para separarse del verde de la rana (R3).
    turtle: "#2ecf7e",
    turtleSubmerged: "rgba(46,207,126,0.3)",
    zoneRiver: "#0a1a33",
    zoneSafe: "#0a2410",
    zoneGoal: "#0f3018",
    goalBorder: "#e8c547",
    goalFilled: "#5ee600",
    timeGood: "#3ecf3e",
    timeWarn: "#f5ff5d",
    eyeWhite: "#ffffff",
    eyePupil: "#000000",
  },
  neon: {
    id: "neon",
    bg: "#0a0414",
    fg: "#f5f0ff",
    fgDim: "rgba(230,220,255,0.72)",
    accent: "#8aff5d",
    grid: "rgba(138,255,93,0.12)",
    danger: "#ff2f4d",
    overlay: "rgba(6,1,18,0.65)",
    glow: "#8aff5d",
    glowBlur: 10,
    cars: ["#ff2f4d", "#ffe066", "#5df5ff"],
    truck: "#b98aff",
    truckCabin: "#8a5cff",
    tire: "#0d0614",
    log: "#ff8a3a",
    logGrain: "rgba(0,0,0,0.4)",
    turtle: "#5dc8ff",
    turtleSubmerged: "rgba(93,200,255,0.3)",
    zoneRiver: "#140a33",
    zoneSafe: "#12082e",
    zoneGoal: "#140a2e",
    goalBorder: "#ff2fe0",
    goalFilled: "#8aff5d",
    timeGood: "#8aff5d",
    timeWarn: "#ffe066",
    eyeWhite: "#ffffff",
    eyePupil: "#000000",
  },
  retro: {
    id: "retro",
    bg: "#0d1400",
    fg: "#c8ffb0",
    fgDim: "rgba(200,255,176,0.68)",
    accent: "#4dff4d",
    grid: "rgba(200,255,176,0.14)",
    danger: "#ff5a3a",
    overlay: "rgba(13,20,0,0.65)",
    glow: null,
    glowBlur: 0,
    cars: ["#ff5a3a", "#ffe066", "#5de0ff"],
    truck: "#c8ff5d",
    truckCabin: "#3ecf3e",
    tire: "#081000",
    log: "#ff5a9e",
    logGrain: "rgba(0,0,0,0.4)",
    turtle: "#5dffc8",
    turtleSubmerged: "rgba(93,255,200,0.3)",
    zoneRiver: "#001a14",
    zoneSafe: "#0a1a00",
    zoneGoal: "#0f2000",
    goalBorder: "#ffb000",
    goalFilled: "#4dff4d",
    timeGood: "#4dff4d",
    timeWarn: "#ffe066",
    eyeWhite: "#ffffff",
    eyePupil: "#000000",
  },
};

if (process.env.NODE_ENV !== "production") {
  for (const id of SKIN_IDS) {
    const skin = FROGGER_SKINS[id];
    assertSkinContrast(skin, [
      skin.cars[0],
      skin.cars[1],
      skin.cars[2],
      skin.truck,
      skin.log,
      skin.turtle,
      skin.goalFilled,
      skin.goalBorder,
    ]);
  }
}
