// Motor del juego FROGGER, construido desde cero (specs/frogger/01-frogger-core.md).
// Todo el estado vive en propiedades de instancia de FroggerEngine (sin globales de módulo).
// Primitivas canvas únicamente — sin sprites bitmap (spec, fuera de alcance).

import type { FroggerSkin } from "./frogger-skins";

export interface FroggerStats {
  score: number;
  lives: number;
  level: number;
  status: "playing" | "dead" | "gameover";
}

const COLS = 16;
const ROWS = 14;
const CELL = 40;
const HUD_H = 40; // alto de la banda de HUD, en px lógicos
const W = COLS * CELL; // 640
const H = HUD_H + ROWS * CELL; // 40 + 560 = 600

// Zonas (índice de fila, 0 = arriba)
const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const JUMP_MS = 120;
const DEAD_PAUSE_S = 0.6;
const ROUND_TIME_BASE_S = 15;
const ROUND_TIME_MIN_S = 8;
const LEVEL_SPEED_STEP = 0.15;

// Las 5 bocas destino ocupan 2 columnas cada una; separadas por muros de 1 columna.
const GOAL_COLS = [1, 4, 7, 10, 13];
const GOAL_COUNT = GOAL_COLS.length;

type Direction = "up" | "down" | "left" | "right";

interface Entity {
  col: number;
  width: number;
  type: "car" | "truck" | "log" | "turtle";
  carIndex?: number; // solo "car": índice en skin.cars (0..2)
  submerged?: boolean;
  submergeT?: number; // 0..SUBMERGE_CYCLE_S, solo turtles
}

interface Lane {
  row: number;
  speed: number; // celdas/seg
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number; // puede ser fraccional mientras va sobre un tronco/tortuga
  row: number;
  animating: boolean;
  animT: number; // ms
  fromCol: number;
  fromRow: number;
  targetCol: number;
  targetRow: number;
}

const SUBMERGE_VISIBLE_S = 3;
const SUBMERGE_HIDDEN_S = 1.5;
const SUBMERGE_CYCLE_S = SUBMERGE_VISIBLE_S + SUBMERGE_HIDDEN_S;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export class FroggerEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onStats: (stats: FroggerStats) => void;

  private frog: Frog;
  private lanes: Lane[] = [];
  private goals: boolean[] = new Array(GOAL_COUNT).fill(false);
  private minRowReached = ROW_START;

  private score = 0;
  private lives = 3;
  private level = 1;
  private roundTime = ROUND_TIME_BASE_S;
  private status: FroggerStats["status"] = "playing";
  private deadTimer = 0;

  private pendingDir: Direction | null = null;

  private paused = false;
  private destroyed = false;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private lastReported: FroggerStats | null = null;
  private skin: FroggerSkin;

  // Capa estática cacheada: zonas + rejilla + marcos de bocas destino (no cambian frame a frame).
  private staticLayer: OffscreenCanvas | HTMLCanvasElement | null = null;
  private staticLayerCtx: CanvasRenderingContext2D | null = null;
  // Píxeles de backing store por unidad lógica, para que la capa estática se vea nítida (frogger-canvas.tsx la fija tras medir el contenedor).
  private deviceScale = 1;

  constructor(
    canvas: HTMLCanvasElement,
    onStats: (stats: FroggerStats) => void,
    skin: FroggerSkin
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas.");
    this.ctx = ctx;
    this.onStats = onStats;
    this.skin = skin;

    this.frog = this.freshFrog();
    this.rebuildStaticLayer();

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.loop = this.loop.bind(this);
  }

  start() {
    window.addEventListener("keydown", this.handleKeyDown);
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
    if (this.paused === paused) return;
    this.paused = paused;
    if (paused) {
      this.draw(); // pinta una vez al entrar en pausa; el loop deja de repintar hasta reanudar
    } else {
      this.lastTime = null; // evita un salto de dt tras el tiempo detenido
    }
  }

  setSkin(skin: FroggerSkin) {
    this.skin = skin;
    this.rebuildStaticLayer();
    this.draw(); // fuerza el repintado: en pausa/game over el rAF puede tardar en refrescar
  }

  // width/height: tamaño CSS mostrado del canvas; dpr: devicePixelRatio ya topado en 2x.
  // El motor sigue dibujando en coordenadas lógicas 640x600; frogger-canvas.tsx aplica el
  // ctx.setTransform correspondiente sobre el canvas principal.
  resize(width: number, height: number, dpr: number) {
    if (width <= 0 || height <= 0) return;
    this.deviceScale = (width * dpr) / W;
    this.rebuildStaticLayer();
    this.draw(); // fuerza el repintado a la nueva resolución sin esperar al próximo frame
  }

  forceGameOver() {
    if (this.status === "gameover") return;
    this.status = "gameover";
    this.reportStats();
  }

  setKey(code: string, pressed: boolean) {
    if (!pressed) return;
    let dir: Direction | null = null;
    switch (code) {
      case "ArrowUp":
      case "KeyW":
        dir = "up";
        break;
      case "ArrowDown":
      case "KeyS":
        dir = "down";
        break;
      case "ArrowLeft":
      case "KeyA":
        dir = "left";
        break;
      case "ArrowRight":
      case "KeyD":
        dir = "right";
        break;
      default:
        return;
    }
    this.pendingDir = dir;
  }

  private handleKeyDown(e: KeyboardEvent) {
    this.setKey(e.code, true);
  }

  // --- Setup ---

  private freshFrog(): Frog {
    const col = Math.floor(COLS / 2);
    return {
      col,
      row: ROW_START,
      animating: false,
      animT: 0,
      fromCol: col,
      fromRow: ROW_START,
      targetCol: col,
      targetRow: ROW_START,
    };
  }

  private buildLanes(level: number): Lane[] {
    const scale = Math.pow(1 + LEVEL_SPEED_STEP, level - 1);
    const lanes: Lane[] = [];

    // Carriles de carretera: filas ROW_ROAD_TOP..ROW_ROAD_BOT
    for (let row = ROW_ROAD_TOP; row <= ROW_ROAD_BOT; row++) {
      const idx = row - ROW_ROAD_TOP;
      const dir: 1 | -1 = idx % 2 === 0 ? 1 : -1;
      const baseSpeed = (1.5 + idx * 0.5) * scale;
      const isTruckLane = idx % 3 === 2;
      const entities: Entity[] = [];
      const width = isTruckLane ? 3 : 1 + (idx % 2);
      const gap = 4 + idx;
      const count = Math.ceil(COLS / (width + gap)) + 1;
      for (let i = 0; i < count; i++) {
        entities.push({
          col: i * (width + gap) - idx,
          width,
          type: isTruckLane ? "truck" : "car",
          carIndex: isTruckLane ? undefined : i % 3,
        });
      }
      lanes.push({ row, speed: baseSpeed, dir, entities });
    }

    // Carriles de río: filas ROW_RIVER_TOP..ROW_RIVER_BOT
    for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
      const idx = row - ROW_RIVER_TOP;
      const dir: 1 | -1 = idx % 2 === 0 ? -1 : 1;
      const baseSpeed = (1 + idx * 0.35) * scale;
      const isTurtleLane = idx % 2 === 1;
      const entities: Entity[] = [];
      if (isTurtleLane) {
        const groupSize = 2 + (idx % 2);
        const gap = 5;
        const count = Math.ceil(COLS / (groupSize + gap)) + 1;
        for (let i = 0; i < count; i++) {
          for (let t = 0; t < groupSize; t++) {
            entities.push({
              col: i * (groupSize + gap) + t - idx,
              width: 1,
              type: "turtle",
              submerged: false,
              submergeT: (t * 0.7 + i * 0.3) % SUBMERGE_CYCLE_S,
            });
          }
        }
      } else {
        const width = 2 + (idx % 3);
        const gap = 3 + idx;
        const count = Math.ceil(COLS / (width + gap)) + 1;
        for (let i = 0; i < count; i++) {
          entities.push({
            col: i * (width + gap) - idx,
            width,
            type: "log",
          });
        }
      }
      lanes.push({ row, speed: baseSpeed, dir, entities });
    }

    return lanes;
  }

  private roundTimeForLevel(level: number): number {
    return Math.max(ROUND_TIME_MIN_S, ROUND_TIME_BASE_S - (level - 1));
  }

  private initGame() {
    this.frog = this.freshFrog();
    this.minRowReached = ROW_START;
    this.goals = new Array(GOAL_COUNT).fill(false);
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.roundTime = this.roundTimeForLevel(this.level);
    this.status = "playing";
    this.deadTimer = 0;
    this.pendingDir = null;
    this.lanes = this.buildLanes(this.level);
    this.reportStats();
  }

  private reportStats() {
    const stats: FroggerStats = {
      score: this.score,
      lives: this.lives,
      level: this.level,
      status: this.status,
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

  // --- Colisiones y soporte ---

  private checkRoadCollision(): boolean {
    const lane = this.lanes.find((l) => l.row === this.frog.row);
    if (!lane) return false;
    return lane.entities.some(
      (e) => this.frog.col + 0.5 >= e.col && this.frog.col + 0.5 < e.col + e.width
    );
  }

  private getSupport(): { lane: Lane; entity: Entity } | null {
    const lane = this.lanes.find(
      (l) => l.row === this.frog.row && l.row >= ROW_RIVER_TOP && l.row <= ROW_RIVER_BOT
    );
    if (!lane) return null;
    for (const e of lane.entities) {
      if (this.frog.col + 0.5 >= e.col && this.frog.col + 0.5 < e.col + e.width) {
        if (e.type === "turtle" && e.submerged) return null;
        return { lane, entity: e };
      }
    }
    return null;
  }

  private goalIndexForCol(col: number): number {
    const c = Math.round(col);
    for (let i = 0; i < GOAL_COLS.length; i++) {
      const start = GOAL_COLS[i];
      if (c === start || c === start + 1) return i;
    }
    return -1;
  }

  // --- Ronda ---

  private completeRound() {
    this.score += 200;
    this.level++;
    this.lanes = this.buildLanes(this.level);
    this.roundTime = this.roundTimeForLevel(this.level);
    this.goals = new Array(GOAL_COUNT).fill(false);
    this.resetFrogAfterGoal();
    this.reportStats();
  }

  private resetFrogAfterGoal() {
    this.frog = this.freshFrog();
    this.minRowReached = ROW_START;
  }

  private checkGoal() {
    const idx = this.goalIndexForCol(this.frog.col);
    if (idx === -1 || this.goals[idx]) {
      this.killFrog();
      return;
    }
    this.goals[idx] = true;
    this.score += 50 + Math.round(this.roundTime) * 10;
    if (this.goals.every(Boolean)) {
      this.completeRound();
    } else {
      this.resetFrogAfterGoal();
      this.roundTime = this.roundTimeForLevel(this.level);
      this.reportStats();
    }
  }

  private resolveLanding() {
    if (this.frog.row < this.minRowReached) {
      this.score += 10 * (this.minRowReached - this.frog.row);
      this.minRowReached = this.frog.row;
      this.reportStats();
    }
    if (this.frog.row === ROW_GOALS) {
      this.checkGoal();
      return;
    }
    if (this.frog.row >= ROW_RIVER_TOP && this.frog.row <= ROW_RIVER_BOT) {
      if (!this.getSupport()) {
        this.killFrog();
      }
    }
  }

  private killFrog() {
    if (this.status !== "playing") return;
    this.lives--;
    if (this.lives <= 0) {
      this.lives = 0;
      this.status = "gameover";
      this.reportStats();
      return;
    }
    this.status = "dead";
    this.deadTimer = DEAD_PAUSE_S;
    this.frog = this.freshFrog();
    this.minRowReached = ROW_START;
    this.roundTime = this.roundTimeForLevel(this.level);
    this.reportStats();
  }

  // --- Loop ---

  private updateLanes(dt: number) {
    for (const lane of this.lanes) {
      for (const e of lane.entities) {
        e.col += lane.speed * lane.dir * dt;
        if (lane.dir > 0 && e.col > COLS) e.col = -e.width;
        if (lane.dir < 0 && e.col < -e.width) e.col = COLS;
        if (e.type === "turtle") {
          e.submergeT = ((e.submergeT ?? 0) + dt) % SUBMERGE_CYCLE_S;
          e.submerged = e.submergeT >= SUBMERGE_VISIBLE_S;
        }
      }
    }
  }

  private startJump(dir: Direction) {
    let targetCol = this.frog.col;
    let targetRow = this.frog.row;
    if (dir === "up") targetRow -= 1;
    else if (dir === "down") targetRow += 1;
    else if (dir === "left") targetCol -= 1;
    else targetCol += 1;

    targetCol = Math.round(targetCol);
    targetRow = clamp(targetRow, ROW_GOALS, ROW_START);
    if (targetCol < 0 || targetCol > COLS - 1) return; // no sale por los bordes

    this.frog.animating = true;
    this.frog.animT = 0;
    this.frog.fromCol = this.frog.col;
    this.frog.fromRow = this.frog.row;
    this.frog.targetCol = targetCol;
    this.frog.targetRow = targetRow;
  }

  private update(dt: number) {
    if (this.status === "gameover") return;

    this.updateLanes(dt);

    if (this.status === "dead") {
      this.deadTimer -= dt;
      if (this.deadTimer <= 0) {
        this.status = "playing";
        this.reportStats();
      }
      return;
    }

    // status === "playing"
    if (this.frog.animating) {
      this.frog.animT += dt * 1000;
      if (this.frog.animT >= JUMP_MS) {
        this.frog.animating = false;
        this.frog.col = this.frog.targetCol;
        this.frog.row = this.frog.targetRow;
        this.resolveLanding();
      }
    } else {
      if (this.pendingDir) {
        const dir = this.pendingDir;
        this.pendingDir = null;
        this.startJump(dir);
      } else if (this.frog.row >= ROW_RIVER_TOP && this.frog.row <= ROW_RIVER_BOT) {
        const support = this.getSupport();
        if (support) {
          this.frog.col += support.lane.speed * support.lane.dir * dt;
          if (this.frog.col < 0 || this.frog.col > COLS - 1) {
            this.killFrog();
          }
        } else {
          this.killFrog();
        }
      }
    }

    if ((this.status as FroggerStats["status"]) !== "playing") return;

    if (this.frog.row >= ROW_ROAD_TOP && this.frog.row <= ROW_ROAD_BOT && !this.frog.animating) {
      if (this.checkRoadCollision()) {
        this.killFrog();
        return;
      }
    }

    this.roundTime -= dt;
    if (this.roundTime <= 0) {
      this.roundTime = 0;
      this.killFrog();
    }
  }

  // --- Dibujo ---

  private zoneColorForRow(row: number): string {
    const skin = this.skin;
    if (row === ROW_GOALS) return skin.zoneGoal;
    if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT) return skin.zoneRiver;
    if (row === ROW_SAFE_MID || row === ROW_START) return skin.zoneSafe;
    return skin.bg; // carretera
  }

  private createOffscreenCanvas(
    width: number,
    height: number
  ): OffscreenCanvas | HTMLCanvasElement {
    if (typeof OffscreenCanvas !== "undefined") {
      return new OffscreenCanvas(width, height);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  private rebuildStaticLayer() {
    const boardH = ROWS * CELL;
    const scale = this.deviceScale;
    const layer = this.createOffscreenCanvas(
      Math.max(1, Math.round(W * scale)),
      Math.max(1, Math.round(boardH * scale))
    );
    const ctx = layer.getContext("2d") as CanvasRenderingContext2D | null;
    if (!ctx) return;
    ctx.scale(scale, scale); // el resto del método sigue dibujando en coordenadas lógicas
    const skin = this.skin;

    for (let row = 0; row < ROWS; row++) {
      ctx.fillStyle = this.zoneColorForRow(row);
      ctx.fillRect(0, row * CELL, W, CELL);
    }

    // Línea divisoria sutil entre filas — subordinada al fondo (R7).
    ctx.save();
    ctx.strokeStyle = skin.grid;
    ctx.lineWidth = 1;
    for (let row = 1; row < ROWS; row++) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL + 0.5);
      ctx.lineTo(W, row * CELL + 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // Marcos de bocas destino (el relleno de bocas alcanzadas se pinta por frame en draw()).
    ctx.save();
    ctx.strokeStyle = skin.goalBorder;
    ctx.lineWidth = 2;
    for (const col of GOAL_COLS) {
      ctx.strokeRect(col * CELL + 2, ROW_GOALS * CELL + 2, CELL * 2 - 4, CELL - 4);
    }
    ctx.restore();

    this.staticLayer = layer;
    this.staticLayerCtx = ctx;
  }

  private draw() {
    const ctx = this.ctx;
    const skin = this.skin;

    ctx.save();
    ctx.translate(0, HUD_H);

    if (this.staticLayer) {
      ctx.drawImage(this.staticLayer as CanvasImageSource, 0, 0, W, ROWS * CELL);
    }

    // Relleno de bocas alcanzadas — cambia con el estado del juego, se pinta por frame.
    for (let i = 0; i < GOAL_COLS.length; i++) {
      if (!this.goals[i]) continue;
      const col = GOAL_COLS[i];
      ctx.save();
      ctx.fillStyle = skin.goalFilled;
      ctx.beginPath();
      ctx.ellipse((col + 1) * CELL, ROW_GOALS * CELL + CELL / 2, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    for (const lane of this.lanes) {
      for (const e of lane.entities) {
        this.drawEntity(e, lane.row);
      }
    }

    this.drawFrog();

    ctx.restore();

    this.drawHUD();

    if (this.status === "gameover") {
      this.drawOverlay("GAME OVER", `PUNTAJE: ${this.score}`);
    }
  }

  private drawEntity(e: Entity, row: number) {
    const ctx = this.ctx;
    const skin = this.skin;
    const x = e.col * CELL;
    const y = row * CELL;
    const w = e.width * CELL;

    if (e.type === "car" || e.type === "truck") {
      ctx.save();
      ctx.fillStyle = e.type === "truck" ? skin.truck : skin.cars[e.carIndex ?? 0];
      ctx.fillRect(x + 3, y + 8, w - 6, CELL - 16);
      if (e.type === "truck") {
        ctx.fillStyle = skin.truckCabin;
        ctx.fillRect(x + w - 14, y + 4, 12, CELL - 8);
      }
      ctx.fillStyle = skin.tire;
      ctx.beginPath();
      ctx.arc(x + 8, y + CELL - 8, 4, 0, Math.PI * 2);
      ctx.arc(x + w - 8, y + CELL - 8, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      return;
    }

    if (e.type === "log") {
      ctx.save();
      ctx.fillStyle = skin.log;
      ctx.fillRect(x + 2, y + 8, w - 4, CELL - 16);
      ctx.strokeStyle = skin.logGrain;
      ctx.lineWidth = 1;
      for (let i = 1; i < e.width; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * CELL, y + 8);
        ctx.lineTo(x + i * CELL, y + CELL - 8);
        ctx.stroke();
      }
      ctx.restore();
      return;
    }

    // turtle
    ctx.save();
    if (e.submerged) {
      ctx.strokeStyle = skin.turtleSubmerged;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x + CELL / 2, y + CELL / 2, 15, 12, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = skin.turtle;
      ctx.beginPath();
      ctx.ellipse(x + CELL / 2, y + CELL / 2, 15, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.beginPath();
      ctx.arc(x + CELL / 2, y + CELL / 2, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawFrog() {
    const ctx = this.ctx;
    let col: number;
    let row: number;
    let jumping = false;
    if (this.frog.animating) {
      const t = clamp(this.frog.animT / JUMP_MS, 0, 1);
      col = this.frog.fromCol + (this.frog.targetCol - this.frog.fromCol) * t;
      row = this.frog.fromRow + (this.frog.targetRow - this.frog.fromRow) * t;
      jumping = true;
    } else {
      col = this.frog.col;
      row = this.frog.row;
    }
    const cx = col * CELL + CELL / 2;
    const cy = row * CELL + CELL / 2;
    const lift = jumping ? -Math.sin(clamp(this.frog.animT / JUMP_MS, 0, 1) * Math.PI) * 6 : 0;

    const skin = this.skin;
    ctx.save();
    if (this.status === "dead") ctx.globalAlpha = 0.5;
    if (skin.glow) {
      ctx.shadowColor = skin.glow;
      ctx.shadowBlur = skin.glowBlur;
    }
    ctx.fillStyle = skin.accent;
    ctx.beginPath();
    ctx.ellipse(cx, cy + lift, 14, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const legSpread = jumping ? 10 : 6;
    ctx.strokeStyle = skin.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + lift + 6);
    ctx.lineTo(cx - legSpread - 4, cy + lift + 14);
    ctx.moveTo(cx + 10, cy + lift + 6);
    ctx.lineTo(cx + legSpread + 4, cy + lift + 14);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = skin.eyeWhite;
    ctx.beginPath();
    ctx.arc(cx - 5, cy + lift - 6, 3, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy + lift - 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = skin.eyePupil;
    ctx.beginPath();
    ctx.arc(cx - 5, cy + lift - 6, 1.4, 0, Math.PI * 2);
    ctx.arc(cx + 5, cy + lift - 6, 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawHUD() {
    const ctx = this.ctx;
    const skin = this.skin;
    ctx.save();

    ctx.fillStyle = skin.bg;
    ctx.fillRect(0, 0, W, HUD_H);

    ctx.font = "bold 16px monospace";
    ctx.fillStyle = skin.fg;
    ctx.textBaseline = "middle";

    ctx.textAlign = "left";
    ctx.fillText(`${this.score}`, 14, HUD_H / 2 - 2);

    ctx.textAlign = "center";
    ctx.fillText(`NIVEL ${this.level}`, W / 2, HUD_H / 2 - 2);

    ctx.textAlign = "right";
    for (let i = 0; i < this.lives; i++) {
      ctx.beginPath();
      ctx.fillStyle = skin.accent;
      ctx.ellipse(W - 14 - i * 22, HUD_H / 2 - 2, 7, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const ratio = clamp(this.roundTime / this.roundTimeForLevel(this.level), 0, 1);
    ctx.fillStyle = ratio > 0.5 ? skin.timeGood : ratio > 0.25 ? skin.timeWarn : skin.danger;
    ctx.fillRect(0, HUD_H - 3, W * ratio, 3);
    ctx.restore();
  }

  private drawOverlay(title: string, sub: string) {
    const ctx = this.ctx;
    const skin = this.skin;
    ctx.save();
    ctx.fillStyle = skin.overlay;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = skin.fg;
    ctx.font = "bold 40px monospace";
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = "16px monospace";
    ctx.fillStyle = skin.fgDim;
    ctx.fillText(sub, W / 2, H / 2 + 18);
    ctx.restore();
  }

  private loop(ts: number) {
    if (this.destroyed) return;

    if (this.paused) {
      // El pintado de la pausa ya lo hizo setPaused(); mantenemos el rAF vivo sin dibujar.
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
