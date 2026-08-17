// Motor del juego ARKANOID, portado de references/started-games/04-arkanoid/game.js.
// Todo el estado vive en propiedades de instancia de ArkanoidEngine (sin globales de módulo).

import {
  drawFrame,
  drawSprite,
  EXPLOSION_DURATION,
  EXPLOSION_FRAMES,
  loadSpritesheet,
} from "./arkanoid-sprites";
import { LEVELS } from "./arkanoid-levels";

export interface ArkanoidStats {
  score: number;
  lives: number; // reemplaza a "secondary" en el HUD (igual que asteroides)
  level: number; // 1..5
  status: "playing" | "dead" | "gameover"; // "win" del motor se mapea a "gameover" al reportar
}

const CANVAS_W = 800;
const CANVAS_H = 600;
const PADDLE_SPEED = 400;
const BLOCK_COLS = 10;
const BLOCK_W = 64;
const BLOCK_H = 24;
const BLOCKS_ORIGIN_X = (CANVAS_W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCKS_ORIGIN_Y = 80;
const BASE_BALL_VX = 200;
const BASE_BALL_VY = -300;

const PAUSE_BTN_W = 60;
const PAUSE_BTN_H = 40;
const PAUSE_BTN_GAP = 12;
const PAUSE_BTN_Y = 340;
const PAUSE_BTN_ROW_X = (CANVAS_W - (5 * PAUSE_BTN_W + 4 * PAUSE_BTN_GAP)) / 2;

interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Ball {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  elapsed: number;
}

export class ArkanoidEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onStats: (stats: ArkanoidStats) => void;
  private onPauseChangeCb: (paused: boolean) => void;

  private bounceSound: HTMLAudioElement;
  private breakSound: HTMLAudioElement;

  private paddle: Paddle = { x: 0, y: 560, w: 81, h: 14 };
  private ball: Ball = { x: 0, y: 0, w: 16, h: 16, vx: BASE_BALL_VX, vy: BASE_BALL_VY };
  private blocks: Block[] = [];
  private explosions: Explosion[] = [];
  private lives = 3;
  private score = 0;
  private gameState: "playing" | "gameover" | "win" = "playing";
  private currentLevel = 1;
  private isPaused = false;

  private keys = { ArrowLeft: false, ArrowRight: false };

  private destroyed = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private lastReported: ArkanoidStats | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    onStats: (stats: ArkanoidStats) => void,
    onPauseChange: (paused: boolean) => void
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");
    this.ctx = ctx;
    this.onStats = onStats;
    this.onPauseChangeCb = onPauseChange;

    this.bounceSound = new Audio("/games/arkanoid/ball-bounce.mp3");
    this.breakSound = new Audio("/games/arkanoid/break-sound.mp3");

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("click", this.handleClick);

    loadSpritesheet(() => {
      if (this.destroyed) return;
      this.initPaddle();
      this.loadLevel(1);
      this.reportStats();
      this.rafId = requestAnimationFrame(this.loop);
    });
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("click", this.handleClick);
  }

  setPaused(paused: boolean) {
    if (this.isPaused === paused) return;
    this.applyPause(paused);
  }

  forceGameOver() {
    if (this.gameState === "gameover") return;
    this.gameState = "gameover";
    this.reportStats();
  }

  private applyPause(paused: boolean) {
    this.isPaused = paused;
    this.onPauseChangeCb(paused);
  }

  private playSound(sound: HTMLAudioElement) {
    const clone = sound.cloneNode() as HTMLAudioElement;
    clone.play().catch(() => {});
  }

  private initPaddle() {
    this.paddle.x = (CANVAS_W - this.paddle.w) / 2;
  }

  private initBall() {
    const speed = LEVELS[this.currentLevel - 1].speed;
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = BASE_BALL_VX * speed;
    this.ball.vy = BASE_BALL_VY * speed;
  }

  private loadLevel(n: number) {
    this.currentLevel = n;
    const level = LEVELS[n - 1];
    this.blocks = level.blocks.map((b) => ({
      x: BLOCKS_ORIGIN_X + b.col * BLOCK_W,
      y: BLOCKS_ORIGIN_Y + b.row * BLOCK_H,
      w: BLOCK_W,
      h: BLOCK_H,
      color: b.color,
      alive: true,
    }));
    this.explosions = [];
    this.ball.x = this.paddle.x + (this.paddle.w - this.ball.w) / 2;
    this.ball.y = this.paddle.y - this.ball.h;
    this.ball.vx = BASE_BALL_VX * level.speed;
    this.ball.vy = BASE_BALL_VY * level.speed;
  }

  private collideAABB(block: Block): boolean {
    const { ball } = this;
    return (
      ball.x < block.x + block.w &&
      ball.x + ball.w > block.x &&
      ball.y < block.y + block.h &&
      ball.y + ball.h > block.y
    );
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") this.keys[e.key] = true;
    if ((e.key === "p" || e.key === "P" || e.key === "Escape") && this.gameState === "playing") {
      this.applyPause(!this.isPaused);
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") this.keys[e.key] = false;
  }

  private handleMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const mouseX = (e.clientX - rect.left) * scaleX;
    this.paddle.x = Math.max(0, Math.min(CANVAS_W - this.paddle.w, mouseX - this.paddle.w / 2));
  }

  private handleClick(e: MouseEvent) {
    if (!this.isPaused) return;
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    for (let i = 0; i < 5; i++) {
      const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
      if (
        mx >= bx &&
        mx <= bx + PAUSE_BTN_W &&
        my >= PAUSE_BTN_Y &&
        my <= PAUSE_BTN_Y + PAUSE_BTN_H
      ) {
        this.loadLevel(i + 1);
        this.reportStats();
        this.applyPause(false);
        return;
      }
    }
  }

  private update(dt: number) {
    if (this.gameState !== "playing") return;

    const { paddle, ball } = this;

    if (this.keys.ArrowLeft) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED * dt);
    if (this.keys.ArrowRight)
      paddle.x = Math.min(CANVAS_W - paddle.w, paddle.x + PADDLE_SPEED * dt);

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x <= 0) {
      ball.x = 0;
      ball.vx = Math.abs(ball.vx);
      this.playSound(this.bounceSound);
    }
    if (ball.x + ball.w >= CANVAS_W) {
      ball.x = CANVAS_W - ball.w;
      ball.vx = -Math.abs(ball.vx);
      this.playSound(this.bounceSound);
    }
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = Math.abs(ball.vy);
      this.playSound(this.bounceSound);
    }

    if (
      ball.vy > 0 &&
      ball.x + ball.w > paddle.x &&
      ball.x < paddle.x + paddle.w &&
      ball.y + ball.h >= paddle.y &&
      ball.y + ball.h <= paddle.y + paddle.h + 8
    ) {
      ball.y = paddle.y - ball.h;
      ball.vy = -Math.abs(ball.vy);
      this.playSound(this.bounceSound);
    }

    for (const block of this.blocks) {
      if (!block.alive) continue;
      if (this.collideAABB(block)) {
        block.alive = false;
        this.explosions.push({
          x: block.x,
          y: block.y,
          w: block.w,
          h: block.h,
          color: block.color,
          elapsed: 0,
        });
        this.score += 10;
        ball.vy = -ball.vy;
        this.playSound(this.breakSound);
        if (this.blocks.every((b) => !b.alive)) {
          if (this.currentLevel < 5) this.loadLevel(this.currentLevel + 1);
          else this.gameState = "win";
        }
        this.reportStats();
        break; // one block per frame
      }
    }

    for (const exp of this.explosions) exp.elapsed += dt * 1000;
    this.explosions = this.explosions.filter((exp) => exp.elapsed < EXPLOSION_DURATION);

    if (ball.y > CANVAS_H) {
      this.lives--;
      if (this.lives <= 0) {
        this.lives = 0;
        this.gameState = "gameover";
      } else {
        this.initBall();
      }
      this.reportStats();
    }
  }

  private reportStats() {
    const stats: ArkanoidStats = {
      score: this.score,
      lives: this.lives,
      level: this.currentLevel,
      status: this.gameState === "win" ? "gameover" : this.gameState,
    };
    const prev = this.lastReported;
    if (
      prev &&
      prev.score === stats.score &&
      prev.lives === stats.lives &&
      prev.level === stats.level &&
      prev.status === stats.status
    ) {
      return;
    }
    this.lastReported = stats;
    this.onStats(stats);
  }

  private drawOverlay(message: string) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 64px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(message, CANVAS_W / 2, CANVAS_H / 2);
  }

  private drawPauseOverlay() {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 56px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("PAUSA", CANVAS_W / 2, 260);

    ctx.font = "bold 16px monospace";
    ctx.fillText("Saltar al nivel:", CANVAS_W / 2, 310);

    for (let i = 0; i < 5; i++) {
      const bx = PAUSE_BTN_ROW_X + i * (PAUSE_BTN_W + PAUSE_BTN_GAP);
      const isActive = i + 1 === this.currentLevel;
      ctx.fillStyle = isActive ? "#f0c040" : "#444";
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, PAUSE_BTN_Y, PAUSE_BTN_W, PAUSE_BTN_H, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = isActive ? "#000" : "#fff";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(i + 1), bx + PAUSE_BTN_W / 2, PAUSE_BTN_Y + PAUSE_BTN_H / 2);
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const block of this.blocks) {
      if (block.alive) drawSprite(ctx, "block_" + block.color, block.x, block.y, block.w, block.h);
    }

    for (const exp of this.explosions) {
      const frameIndex = Math.min(Math.floor((exp.elapsed / EXPLOSION_DURATION) * 4), 3);
      drawFrame(ctx, EXPLOSION_FRAMES[exp.color][frameIndex], exp.x, exp.y, exp.w, exp.h);
    }

    drawSprite(ctx, "paddle", this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    drawSprite(ctx, "ball", this.ball.x, this.ball.y, this.ball.w, this.ball.h);

    if (this.gameState === "playing") {
      ctx.fillStyle = "#fff";
      ctx.font = "bold 18px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("Score: " + this.score, 10, 10);
      ctx.textAlign = "center";
      ctx.fillText("Nivel: " + this.currentLevel, CANVAS_W / 2, 10);
      const ballSize = 16;
      const ballSpacing = 4;
      for (let i = 0; i < this.lives; i++) {
        const bx = CANVAS_W - 10 - (this.lives - i) * (ballSize + ballSpacing);
        drawSprite(ctx, "ball", bx, 10, ballSize, ballSize);
      }
    }

    if (this.gameState === "gameover") this.drawOverlay("GAME OVER");
    if (this.gameState === "win") this.drawOverlay("¡Completaste el juego!");
    if (this.isPaused) this.drawPauseOverlay();
  }

  private loop(ts: number) {
    if (this.destroyed) return;

    const dt = this.lastTime === null ? 0 : (ts - this.lastTime) / 1000;
    this.lastTime = ts;

    if (!this.isPaused) this.update(dt);
    this.draw();

    this.rafId = requestAnimationFrame(this.loop);
  }
}
