// Motor del juego SNAKE, construido desde cero (sin referencia en references/started-games/).
// Todo el estado vive en propiedades de instancia de SnakeEngine (sin globales de módulo).

import { drawFruit, loadFruitSheet, pickRandomFruit } from "./snake-sprites";

export interface SnakeStats {
  score: number;
  length: number;
  level: number;
  status: "playing" | "dead" | "gameover";
}

const GRID = 20;
const CELL = 30;
const W = GRID * CELL;
const H = GRID * CELL;

const START_TICK_MS = 140;
const MIN_TICK_MS = 60;
const TICK_STEP_MS = 10;
const FRUITS_PER_LEVEL = 5;
const POINTS_PER_FRUIT = 10;

interface Cell {
  x: number;
  y: number;
}

const dirsEqual = (a: Cell, b: Cell) => a.x === b.x && a.y === b.y;
const isOpposite = (a: Cell, b: Cell) => a.x === -b.x && a.y === -b.y;

export class SnakeEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onStats: (stats: SnakeStats) => void;

  private snake: Cell[] = [];
  private direction: Cell = { x: 1, y: 0 };
  private pendingDirection: Cell = { x: 1, y: 0 };
  private fruit: { x: number; y: number; spriteKey: string } = { x: 0, y: 0, spriteKey: "apple" };
  private growPending = 0;

  private score = 0;
  private length = 3;
  private level = 1;
  private eaten = 0;
  private tickMs = START_TICK_MS;
  private bestScore = 0;
  private status: SnakeStats["status"] = "playing";

  private paused = false;
  private destroyed = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private accumMs = 0;
  private lastReported: SnakeStats | null = null;
  private spriteReady = false;

  constructor(canvas: HTMLCanvasElement, onStats: (stats: SnakeStats) => void) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");
    this.ctx = ctx;
    this.onStats = onStats;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    window.addEventListener("keydown", this.handleKeyDown);
    loadFruitSheet(() => {
      this.spriteReady = true;
    });
    this.initGame();
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    window.removeEventListener("keydown", this.handleKeyDown);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  forceGameOver() {
    if (this.status === "gameover") return;
    this.status = "gameover";
    this.reportStats();
  }

  private handleKeyDown(e: KeyboardEvent) {
    let next: Cell | null = null;
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        next = { x: 0, y: -1 };
        break;
      case "ArrowDown":
      case "KeyS":
        next = { x: 0, y: 1 };
        break;
      case "ArrowLeft":
      case "KeyA":
        next = { x: -1, y: 0 };
        break;
      case "ArrowRight":
      case "KeyD":
        next = { x: 1, y: 0 };
        break;
      default:
        return;
    }
    if (isOpposite(next, this.direction)) return;
    this.pendingDirection = next;
  }

  private spawnFruit() {
    let cell: Cell;
    do {
      cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (this.snake.some((s) => dirsEqual(s, cell)));
    this.fruit = { x: cell.x, y: cell.y, spriteKey: pickRandomFruit() };
  }

  private initGame() {
    const cy = Math.floor(GRID / 2);
    this.snake = [
      { x: 10, y: cy },
      { x: 9, y: cy },
      { x: 8, y: cy },
    ];
    this.direction = { x: 1, y: 0 };
    this.pendingDirection = { x: 1, y: 0 };
    this.growPending = 0;
    this.score = 0;
    this.length = this.snake.length;
    this.level = 1;
    this.eaten = 0;
    this.tickMs = START_TICK_MS;
    this.bestScore = Math.max(this.bestScore, this.score);
    this.status = "playing";
    this.accumMs = 0;
    this.spawnFruit();
    this.reportStats();
  }

  private reportStats() {
    const stats: SnakeStats = {
      score: this.score,
      length: this.length,
      level: this.level,
      status: this.status,
    };
    const prev = this.lastReported;
    if (
      prev &&
      prev.score === stats.score &&
      prev.length === stats.length &&
      prev.level === stats.level &&
      prev.status === stats.status
    ) {
      return;
    }
    this.lastReported = stats;
    this.onStats(stats);
  }

  private step() {
    this.direction = this.pendingDirection;
    const head = this.snake[0];
    const newHead: Cell = { x: head.x + this.direction.x, y: head.y + this.direction.y };

    if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
      this.status = "gameover";
      this.reportStats();
      return;
    }
    if (this.snake.some((s) => dirsEqual(s, newHead))) {
      this.status = "gameover";
      this.reportStats();
      return;
    }

    this.snake.unshift(newHead);
    if (dirsEqual(newHead, this.fruit)) {
      this.score += POINTS_PER_FRUIT;
      this.eaten++;
      this.bestScore = Math.max(this.bestScore, this.score);
      if (this.eaten % FRUITS_PER_LEVEL === 0) {
        this.level++;
        this.tickMs = Math.max(MIN_TICK_MS, this.tickMs - TICK_STEP_MS);
      }
      this.spawnFruit();
    } else {
      this.snake.pop();
    }
    this.length = this.snake.length;
    this.reportStats();
  }

  private update(dt: number) {
    if (this.status === "gameover") return;
    this.accumMs += dt * 1000;
    if (this.accumMs >= this.tickMs) {
      this.accumMs -= this.tickMs;
      this.step();
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#05070a";
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.strokeStyle = "rgba(0, 255, 136, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(W, i * CELL);
      ctx.stroke();
    }
    ctx.restore();

    if (this.spriteReady) {
      drawFruit(
        ctx,
        this.fruit.spriteKey,
        this.fruit.x * CELL + 2,
        this.fruit.y * CELL + 2,
        CELL - 4
      );
    } else {
      ctx.fillStyle = "#ff3b5c";
      ctx.fillRect(this.fruit.x * CELL + 4, this.fruit.y * CELL + 4, CELL - 8, CELL - 8);
    }

    this.snake.forEach((seg, i) => {
      ctx.save();
      ctx.fillStyle = i === 0 ? "#00ff88" : "rgba(0, 255, 136, 0.75)";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = i === 0 ? 8 : 3;
      const pad = 2;
      const r = 6;
      const x = seg.x * CELL + pad;
      const y = seg.y * CELL + pad;
      const size = CELL - pad * 2;
      ctx.beginPath();
      ctx.roundRect(x, y, size, size, r);
      ctx.fill();
      ctx.restore();
    });

    this.drawHUD();

    if (this.status === "gameover") {
      this.drawOverlay("GAME OVER", `PUNTAJE: ${this.score}`);
    }
  }

  private drawHUD() {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = "bold 16px monospace";
    ctx.fillStyle = "#00ff88";
    ctx.textBaseline = "middle";

    ctx.textAlign = "left";
    ctx.fillText(`🍎 ${this.score}`, 14, 24);

    ctx.textAlign = "right";
    ctx.fillText(`🏆 ${this.bestScore}`, W - 14, 24);
    ctx.restore();
  }

  private drawOverlay(title: string, sub: string) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = "center";
    ctx.fillStyle = "#fff";
    ctx.font = "bold 40px monospace";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = "16px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText(sub, W / 2, H / 2 + 18);
    ctx.restore();
  }

  private loop(ts: number) {
    if (this.destroyed) return;

    if (this.paused) {
      this.lastTime = ts;
      this.draw();
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const dt = this.lastTime === null ? 0 : Math.min((ts - this.lastTime) / 1000, 0.05);
    this.lastTime = ts;
    this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  }
}
