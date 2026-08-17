"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { TetrisEngine, type TetrisStats } from "./tetris-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

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

const TetrisCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function TetrisCanvas(
  { onStats, paused },
  ref
) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);
  const [stats, setStats] = useState<TetrisStats>(INITIAL_STATS);
  const [scale, setScale] = useState(1);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const boardCanvas = boardCanvasRef.current;
    const nextCanvas = nextCanvasRef.current;
    if (!boardCanvas || !nextCanvas) return;

    const engine = new TetrisEngine(boardCanvas, nextCanvas, (nextStats) => {
      setStats(nextStats);
      onStats(toGameStats(nextStats));
    });
    engineRef.current = engine;
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
        <div className="tetris-container">
          <canvas ref={boardCanvasRef} width={300} height={600} />

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
              <canvas ref={nextCanvasRef} width={120} height={120} />
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
