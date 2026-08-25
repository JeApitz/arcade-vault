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

const SnakeCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function SnakeCanvas(
  { onStats, paused, skinId },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SnakeEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
    setKey: (key, pressed) => engineRef.current?.setKey(key, pressed),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // mobile-porter (M9): ver nota equivalente en asteroids-canvas.tsx.
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 600;
    const cssHeight = 600;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.getContext("2d")?.scale(dpr, dpr);

    const engine = new SnakeEngine(
      canvas,
      (stats) => onStats(toGameStats(stats)),
      SNAKE_SKINS[skinId]
    );
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
    engineRef.current?.setSkin(SNAKE_SKINS[skinId]);
  }, [skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={600}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default SnakeCanvas;
