// Puerto de references/started-games/04-arkanoid/assets/spritesheet.js.
// Carga la imagen desde /games/arkanoid/spritesheet-breakout.png en vez de una ruta relativa.

import type { SkinId } from "./skins";
import type { ArkanoidBlockColor } from "./arkanoid-skins";

export interface SpriteFrame {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export const EXPLOSION_FRAMES: Record<string, SpriteFrame[]> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
  gray: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
};

export const EXPLOSION_DURATION = 150;

export const SPRITES: {
  paddle: SpriteFrame;
  ball: SpriteFrame;
  blocks: Record<string, SpriteFrame>;
} = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

let ssImg: HTMLCanvasElement | null = null;
let ssLoaded = false;
const ssCallbacks: (() => void)[] = [];

export function loadSpritesheet(cb: () => void): void {
  if (ssLoaded) {
    cb();
    return;
  }
  ssCallbacks.push(cb);
  if (ssImg) return;

  const rawImg = new Image();
  rawImg.onload = () => {
    const oc = document.createElement("canvas");
    oc.width = rawImg.width;
    oc.height = rawImg.height;
    const octx = oc.getContext("2d")!;
    octx.drawImage(rawImg, 0, 0);
    ssImg = oc;
    ssLoaded = true;
    ssCallbacks.forEach((f) => f());
  };
  rawImg.onerror = () => console.error("Failed to load spritesheet");
  rawImg.src = "/games/arkanoid/spritesheet-breakout.png";
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  x: number,
  y: number,
  w: number,
  h: number,
  sheet: CanvasImageSource | null = ssImg
): void {
  if (!ssLoaded || !sheet) return;
  ctx.drawImage(sheet, frame.sx, frame.sy, frame.sw, frame.sh, x, y, w, h);
}

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  name: string,
  x: number,
  y: number,
  w: number,
  h: number,
  sheet: CanvasImageSource | null = ssImg
): void {
  if (!ssLoaded || !sheet) return;
  let sp: SpriteFrame | undefined;
  if (name.startsWith("block_")) {
    sp = SPRITES.blocks[name.slice(6)];
  } else if (name === "paddle") {
    sp = SPRITES.paddle;
  } else if (name === "ball") {
    sp = SPRITES.ball;
  }
  if (!sp) return;
  ctx.drawImage(sheet, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
}

// --- Teñido pre-horneado por skin (Fase 4.4: pixel-art de rampa/monocromo) ---
// `clasico` (tint === null) usa la hoja original sin teñir. `neon`/`retro` bakean
// UNA vez por skin (no por frame) una copia de la hoja con cada rect recoloreado,
// preservando el biselado: copiar → "color" (reemplaza matiz/saturación, conserva
// luminancia) → "destination-in" (restaura la máscara alfa) → volcar a la hoja teñida.

let scratch: HTMLCanvasElement | null = null;
let scratchCtx: CanvasRenderingContext2D | null = null;
let blendMode: GlobalCompositeOperation | null = null;

function ensureScratch(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  if (!scratch) {
    scratch = document.createElement("canvas");
    scratchCtx = scratch.getContext("2d");
  }
  return { canvas: scratch, ctx: scratchCtx! };
}

/** Feature-detect de `globalCompositeOperation = "color"`; degrada a "source-atop" si falta. */
function pickBlendMode(ctx: CanvasRenderingContext2D): GlobalCompositeOperation {
  if (blendMode) return blendMode;
  ctx.globalCompositeOperation = "color";
  blendMode = ctx.globalCompositeOperation === "color" ? "color" : "source-atop";
  ctx.globalCompositeOperation = "source-over";
  return blendMode;
}

function tintFrame(
  destCtx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  frame: SpriteFrame,
  color: string
): void {
  const { canvas, ctx } = ensureScratch();
  canvas.width = frame.sw;
  canvas.height = frame.sh;
  ctx.clearRect(0, 0, frame.sw, frame.sh);
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(source, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
  ctx.globalCompositeOperation = pickBlendMode(ctx);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, frame.sw, frame.sh);
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(source, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
  ctx.globalCompositeOperation = "source-over";
  destCtx.clearRect(frame.sx, frame.sy, frame.sw, frame.sh);
  destCtx.drawImage(canvas, 0, 0, frame.sw, frame.sh, frame.sx, frame.sy, frame.sw, frame.sh);
}

export interface ArkanoidTintConfig {
  tint: Record<ArkanoidBlockColor, string>;
  paddleTint: string;
  ballTint: string;
}

const tintedSheets = new Map<SkinId, HTMLCanvasElement>();

/**
 * Devuelve la hoja de sprites a usar para `skinId`: la original sin teñir si
 * `config` es `null` (skin `clasico`), o una copia teñida horneada una sola vez
 * y cacheada por skin. Devuelve `null` si la hoja original aún no cargó.
 */
export function getTintedSheet(
  skinId: SkinId,
  config: ArkanoidTintConfig | null
): HTMLCanvasElement | null {
  if (!ssLoaded || !ssImg) return null;
  if (config === null) return ssImg;

  const cached = tintedSheets.get(skinId);
  if (cached) return cached;

  const dest = document.createElement("canvas");
  dest.width = ssImg.width;
  dest.height = ssImg.height;
  const destCtx = dest.getContext("2d")!;
  destCtx.drawImage(ssImg, 0, 0);

  tintFrame(destCtx, ssImg, SPRITES.paddle, config.paddleTint);
  tintFrame(destCtx, ssImg, SPRITES.ball, config.ballTint);
  for (const [key, frame] of Object.entries(SPRITES.blocks)) {
    tintFrame(destCtx, ssImg, frame, config.tint[key as ArkanoidBlockColor]);
  }
  for (const [key, frames] of Object.entries(EXPLOSION_FRAMES)) {
    const color = config.tint[key as ArkanoidBlockColor];
    for (const frame of frames) tintFrame(destCtx, ssImg, frame, color);
  }

  tintedSheets.set(skinId, dest);
  return dest;
}
