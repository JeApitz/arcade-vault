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

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  key: string,
  dx: number,
  dy: number,
  size: number
): void {
  if (!sheetLoaded || !sheetImg) return;
  const f = FRUITS[key];
  if (!f) return;
  ctx.drawImage(sheetImg, f.x, f.y, f.w, f.h, dx, dy, size, size);
}
