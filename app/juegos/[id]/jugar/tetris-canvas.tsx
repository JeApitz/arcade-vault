"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { TetrisEngine, type TetrisStats } from "./tetris-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";
import { TETRIS_SKINS } from "./tetris-skins";

export type TetrisCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: TetrisStats) => ({
  score: stats.score,
  secondary: stats.lines,
  level: stats.level,
  status: stats.status,
});

const INITIAL_STATS: TetrisStats = { score: 0, lines: 0, level: 1, status: "playing" };

// Ancho/alto de referencia del stage completo (tablero 300x600 + panel 160 + gap 20).
const STAGE_W = 480;
const STAGE_H = 600;

// Tamaño lógico CSS (fijo) de los canvas del motor (TetrisEngine: BOARD_W/H, NEXT_SIZE).
// El `scale` calculado más abajo encoge/agranda visualmente el stage completo vía
// `transform: scale()`, nunca el tamaño lógico de estos dos canvas.
const BOARD_W = 300;
const BOARD_H = 600;
const NEXT_SIZE = 120;
const MAX_DPR = 2;

const TetrisCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function TetrisCanvas(
  { onStats, paused, skinId },
  ref
) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const [stats, setStats] = useState<TetrisStats>(INITIAL_STATS);
  const [scale, setScale] = useState(1);
  const skin = TETRIS_SKINS[skinId];

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
    setKey: (key, pressed) => engineRef.current?.setKey(key, pressed),
  }));

  useEffect(() => {
    const boardCanvas = boardCanvasRef.current;
    const nextCanvas = nextCanvasRef.current;
    if (!boardCanvas || !nextCanvas) return;

    const engine = new TetrisEngine(
      boardCanvas,
      nextCanvas,
      (nextStats) => {
        setStats(nextStats);
        onStats(toGameStats(nextStats));
      },
      TETRIS_SKINS[skinId]
    );
    engineRef.current = engine;

    // DPR real topado a 2x: el tamaño CSS lógico de ambos canvas es fijo (no depende
    // del `scale` de transform, que solo encoge/agranda visualmente el stage completo),
    // así que solo hace falta escalar el backing store por DPR, no por contenedor.
    const applyDpr = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      boardCanvas.width = Math.round(BOARD_W * dpr);
      boardCanvas.height = Math.round(BOARD_H * dpr);
      nextCanvas.width = Math.round(NEXT_SIZE * dpr);
      nextCanvas.height = Math.round(NEXT_SIZE * dpr);
      boardCanvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      nextCanvas.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
      engine.resize(BOARD_W, BOARD_H, dpr);
    };

    applyDpr();
    engine.start();

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    engineRef.current?.setSkin(TETRIS_SKINS[skinId]);
  }, [skinId]);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(1, width / STAGE_W, height / STAGE_H));
    });
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="tetris-stage-wrap">
      <div
        className="tetris-stage"
        style={{ transform: `scale(${scale})`, width: STAGE_W, height: STAGE_H }}
      >
        <div
          className="tetris-container"
          style={
            {
              "--tetris-border": skin.dom.border,
              "--tetris-canvas-bg": skin.dom.canvasBg,
              "--tetris-label": skin.dom.label,
              "--tetris-value": skin.dom.value,
              "--tetris-controls-text": skin.dom.controlsText,
              "--tetris-kbd-bg": skin.dom.kbdBg,
              "--tetris-kbd-border": skin.dom.kbdBorder,
              "--tetris-kbd-text": skin.dom.kbdText,
            } as CSSProperties
          }
        >
          <canvas
            ref={boardCanvasRef}
            className="tetris-board-canvas"
            width={BOARD_W}
            height={BOARD_H}
            style={{ width: BOARD_W, height: BOARD_H }}
          />

          <aside className="tetris-panel">
            <div className="tetris-section">
              <span className="tetris-label">SCORE</span>
              <span className="tetris-value">{stats.score.toLocaleString("es-ES")}</span>
            </div>
            <div className="tetris-section">
              <span className="tetris-label">LINES</span>
              <span className="tetris-value">{stats.lines}</span>
            </div>
            <div className="tetris-section">
              <span className="tetris-label">LEVEL</span>
              <span className="tetris-value">{stats.level}</span>
            </div>

            <div className="tetris-section">
              <span className="tetris-label">NEXT</span>
              <canvas
                ref={nextCanvasRef}
                className="tetris-next-canvas"
                width={NEXT_SIZE}
                height={NEXT_SIZE}
                style={{ width: NEXT_SIZE, height: NEXT_SIZE }}
              />
            </div>

            <div className="tetris-section tetris-controls">
              <span className="tetris-label">CONTROLS</span>
              <ul>
                <li>
                  <kbd>←</kbd>
                  <kbd>→</kbd> mover
                </li>
                <li>
                  <kbd>↑</kbd> rotar
                </li>
                <li>
                  <kbd>↓</kbd> bajar
                </li>
                <li>
                  <kbd>Space</kbd> caída
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
});

export default TetrisCanvas;
