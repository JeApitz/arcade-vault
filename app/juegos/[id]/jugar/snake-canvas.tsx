"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { SnakeEngine, type SnakeStats } from "./snake-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";
import { SNAKE_SKINS } from "./snake-skins";

export type SnakeCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: SnakeStats) => ({
  score: stats.score,
  secondary: stats.length,
  level: stats.level,
  status: stats.status,
});

// Tamaño lógico del tablero de SnakeEngine (snake-engine.ts: W, H).
const LOGICAL_W = 600;
const LOGICAL_H = 640;
const MAX_DPR = 2;

const SnakeCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function SnakeCanvas(
  { onStats, paused, skinId },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SnakeEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
    setKey: (key, pressed) => engineRef.current?.setKey(key, pressed),
  }));

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const engine = new SnakeEngine(
      canvas,
      (stats) => onStats(toGameStats(stats)),
      SNAKE_SKINS[skinId]
    );
    engineRef.current = engine;

    const applySize = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width || LOGICAL_W;
      const height = rect.height || LOGICAL_H;
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext("2d");
      ctx?.setTransform((width / LOGICAL_W) * dpr, 0, 0, (height / LOGICAL_H) * dpr, 0, 0);
      engine.resize(width, height, dpr);
    };

    applySize();
    engine.start();

    const observer = new ResizeObserver(applySize);
    observer.observe(container);

    return () => {
      observer.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  useEffect(() => {
    engineRef.current?.setSkin(SNAKE_SKINS[skinId]);
  }, [skinId]);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        width={LOGICAL_W}
        height={LOGICAL_H}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
});

export default SnakeCanvas;
