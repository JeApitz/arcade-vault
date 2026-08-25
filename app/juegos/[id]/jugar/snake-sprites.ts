// Puerto de references/source-assets/snake-assets/sprites.js.
// Carga la imagen desde /games/snake/fruits.png en vez de una ruta relativa.

export interface SpriteFrame {
  x: number;
  y: number;
  w: number;
  h: number;
}

// Fila mediana de fruits.png (y=136–295, 160px de alto), hoja de 3790x442px, fondo transparente.
export const FRUITS: Record<string, SpriteFrame> = {
  banana: { x: 34, y: 136, w: 110, h: 160 },
  orange: { x: 186, y: 136, w: 150, h: 160 },
  grape: { x: 378, y: 136, w: 110, h: 160 },
  garlic: { x: 540, y: 136, w: 130, h: 160 },
  eggplant: { x: 712, y: 136, w: 130, h: 160 },
  strawberry: { x: 894, y: 136, w: 110, h: 160 },
  cherry: { x: 1066, y: 136, w: 110, h: 160 },
  carrot: { x: 1228, y: 136, w: 130, h: 160 },
  mushroom: { x: 1400, y: 136, w: 130, h: 160 },
  broccoli: { x: 1582, y: 136, w: 110, h: 160 },
  watermelon: { x: 1734, y: 136, w: 150, h: 160 },
  pepper: { x: 1906, y: 136, w: 150, h: 160 },
  kiwi: { x: 2068, y: 136, w: 170, h: 160 },
  lemon: { x: 2250, y: 136, w: 140, h: 160 },
  peach: { x: 2432, y: 136, w: 130, h: 160 },
  peanut: { x: 2604, y: 136, w: 130, h: 160 },
  apple: { x: 2786, y: 136, w: 110, h: 160 },
  tomato: { x: 2948, y: 136, w: 130, h: 160 },
  berries: { x: 3110, y: 136, w: 150, h: 160 },
  grapes2: { x: 3302, y: 136, w: 110, h: 160 },
  pineapple: { x: 3454, y: 136, w: 150, h: 160 },
  melon: { x: 3637, y: 136, w: 130, h: 160 },
};

const FRUIT_KEYS = Object.keys(FRUITS);

let sheetImg: HTMLImageElement | null = null;
let sheetLoaded = false;
const sheetCallbacks: (() => void)[] = [];

export function loadFruitSheet(cb: () => void): void {
  if (sheetLoaded) {
    cb();
    return;
  }
  sheetCallbacks.push(cb);
  if (sheetImg) return;

  const img = new Image();
  img.onload = () => {
    sheetLoaded = true;
    sheetCallbacks.forEach((f) => f());
  };
  img.onerror = () => console.error("Failed to load fruit sheet");
  img.src = "/games/snake/fruits.png";
  sheetImg = img;
}

export function pickRandomFruit(): string {
  return FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
}

// Hojas teñidas horneadas UNA vez por filtro (no por frame) — mismo patrón que
// arkanoid-sprites.ts (getTintedSheet), adaptado a ctx.filter en vez de blend
// por color, porque la fruta es un sprite fotográfico multicolor (nunca se tiñe
// con composite operations, ver snake-skins.ts). Los huecos entre frames de
// fruits.png (>=40px) son mayores que el blur de cualquier fruitFilter definido
// (<=10px), así que hornear la hoja completa de una vez no produce sangrado
// entre frutas vecinas.
const tintedSheets = new Map<string, HTMLCanvasElement>();

/**
 * Devuelve la hoja a usar para un `fruitFilter` dado: la imagen original sin
 * filtro (`filter` null, skin `clasico`), o una copia horneada una sola vez con
 * `ctx.filter` aplicado y cacheada por string de filtro. `null` si la hoja
 * original aún no cargó.
 */
export function getFruitSheet(filter: string | null): CanvasImageSource | null {
  if (!sheetLoaded || !sheetImg) return null;
  if (!filter) return sheetImg;

  const cached = tintedSheets.get(filter);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = sheetImg.width;
  canvas.height = sheetImg.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sheetImg;
  ctx.filter = filter;
  ctx.drawImage(sheetImg, 0, 0);
  ctx.filter = "none";

  tintedSheets.set(filter, canvas);
  return canvas;
}

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  sheet: CanvasImageSource,
  key: string,
  dx: number,
  dy: number,
  size: number
): void {
  const f = FRUITS[key];
  if (!f) return;
  ctx.drawImage(sheet, f.x, f.y, f.w, f.h, dx, dy, size, size);
}
