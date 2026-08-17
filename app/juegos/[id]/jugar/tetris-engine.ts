// Motor del juego TETRIS, portado de references/started-games/03-tetris/game.js.
// Todo el estado vive en propiedades de instancia de TetrisEngine (sin globales de módulo).

export interface TetrisStats {
  score: number;
  lines: number; // reemplaza a "vidas" en el HUD para este juego
  level: number;
  status: "playing" | "dead" | "gameover";
}

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const GRID_LINE = "#22222e";

const COLORS = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
  "#9e9e9e", // N - tuerca (gris metálico)
];

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  // [
  //   [8, 8, 8],
  //   [8, 0, 8],
  //   [8, 8, 8],
  // ], // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

export class TetrisEngine {
  private boardCanvas: HTMLCanvasElement;
  private boardCtx: CanvasRenderingContext2D;
  private nextCanvas: HTMLCanvasElement;
  private nextCtx: CanvasRenderingContext2D;
  private onStats: (stats: TetrisStats) => void;

  private board: number[][] = [];
  private current!: Piece;
  private next!: Piece;

  private score = 0;
  private lines = 0;
  private level = 1;
  private status: TetrisStats["status"] = "playing";

  private paused = false;
  private destroyed = false;
  private dropAccum = 0;
  private dropInterval = 1000;
  private rafId: number | null = null;
  private lastTime: number | null = null;
  private lastReported: TetrisStats | null = null;

  constructor(
    boardCanvas: HTMLCanvasElement,
    nextCanvas: HTMLCanvasElement,
    onStats: (stats: TetrisStats) => void
  ) {
    this.boardCanvas = boardCanvas;
    const boardCtx = boardCanvas.getContext("2d");
    if (!boardCtx) throw new Error("No se pudo obtener el contexto 2D del canvas del tablero.");
    this.boardCtx = boardCtx;

    this.nextCanvas = nextCanvas;
    const nextCtx = nextCanvas.getContext("2d");
    if (!nextCtx)
      throw new Error("No se pudo obtener el contexto 2D del canvas de siguiente pieza.");
    this.nextCtx = nextCtx;

    this.onStats = onStats;

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
    this.paused = paused;
  }

  forceGameOver() {
    if (this.status === "gameover") return;
    this.status = "gameover";
    this.reportStats();
  }

  private createBoard(): number[][] {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  private randomPiece(): Piece {
    const type = Math.floor(Math.random() * 7) + 1;
    const shape = PIECES[type]!.map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  private collide(shape: number[][], ox: number, oy: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && this.board[ny][nx]) return true;
      }
    }
    return false;
  }

  private rotateCW(shape: number[][]): number[][] {
    const rows = shape.length;
    const cols = shape[0].length;
    const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
    return result;
  }

  private tryRotate() {
    const rotated = this.rotateCW(this.current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!this.collide(rotated, this.current.x + kick, this.current.y)) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private merge() {
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          this.board[this.current.y + r][this.current.x + c] = this.current.shape[r][c];
  }

  private clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      this.score += (LINE_SCORES[cleared] || 0) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
      this.reportStats();
    }
  }

  private ghostY(): number {
    let gy = this.current.y;
    while (!this.collide(this.current.shape, this.current.x, gy + 1)) gy++;
    return gy;
  }

  private hardDrop() {
    const gy = this.ghostY();
    this.score += (gy - this.current.y) * 2;
    this.current.y = gy;
    this.lockPiece();
    this.reportStats();
  }

  private softDrop() {
    if (!this.collide(this.current.shape, this.current.x, this.current.y + 1)) {
      this.current.y++;
      this.score += 1;
      this.reportStats();
    } else {
      this.lockPiece();
    }
  }

  private lockPiece() {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  private spawn() {
    this.current = this.next;
    this.next = this.randomPiece();
    if (this.collide(this.current.shape, this.current.x, this.current.y)) {
      this.status = "gameover";
      this.reportStats();
    }
  }

  private reportStats() {
    const stats: TetrisStats = {
      score: this.score,
      lines: this.lines,
      level: this.level,
      status: this.status,
    };
    const prev = this.lastReported;
    if (
      prev &&
      prev.score === stats.score &&
      prev.lines === stats.lines &&
      prev.level === stats.level &&
      prev.status === stats.status
    ) {
      return;
    }
    this.lastReported = stats;
    this.onStats(stats);
  }

  private initGame() {
    this.board = this.createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.status = "playing";
    this.dropInterval = 1000;
    this.dropAccum = 0;
    this.next = this.randomPiece();
    this.spawn();
    this.reportStats();
  }

  private drawBlock(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colorIndex: number,
    size: number,
    alpha?: number
  ) {
    if (!colorIndex) return;
    const color = COLORS[colorIndex];
    ctx.globalAlpha = alpha ?? 1;
    ctx.fillStyle = color!;
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    ctx.globalAlpha = 1;
  }

  private drawGrid() {
    const ctx = this.boardCtx;
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
  }

  private draw() {
    const ctx = this.boardCtx;
    ctx.clearRect(0, 0, this.boardCanvas.width, this.boardCanvas.height);
    this.drawGrid();

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) this.drawBlock(ctx, c, r, this.board[r][c], BLOCK);

    const gy = this.ghostY();
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          this.drawBlock(ctx, this.current.x + c, gy + r, this.current.shape[r][c], BLOCK, 0.2);

    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        this.drawBlock(
          ctx,
          this.current.x + c,
          this.current.y + r,
          this.current.shape[r][c],
          BLOCK
        );

    this.drawNext();
  }

  private drawNext() {
    const NB = 30;
    const ctx = this.nextCtx;
    ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const shape = this.next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        this.drawBlock(ctx, offX + c, offY + r, shape[r][c], NB);
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (this.paused || this.status === "gameover") return;
    switch (e.code) {
      case "ArrowLeft":
        if (!this.collide(this.current.shape, this.current.x - 1, this.current.y)) this.current.x--;
        break;
      case "ArrowRight":
        if (!this.collide(this.current.shape, this.current.x + 1, this.current.y)) this.current.x++;
        break;
      case "ArrowDown":
        this.softDrop();
        break;
      case "ArrowUp":
        this.tryRotate();
        break;
      case "Space":
        e.preventDefault();
        this.hardDrop();
        break;
      default:
        return;
    }
  }

  private loop(ts: number) {
    if (this.destroyed) return;

    if (this.paused || this.status === "gameover") {
      this.lastTime = ts;
      this.draw();
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }

    const dt = this.lastTime === null ? 0 : ts - this.lastTime;
    this.lastTime = ts;
    this.dropAccum += dt;
    if (this.dropAccum >= this.dropInterval) {
      this.dropAccum = 0;
      if (!this.collide(this.current.shape, this.current.x, this.current.y + 1)) {
        this.current.y++;
      } else {
        this.lockPiece();
      }
    }

    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  }
}
