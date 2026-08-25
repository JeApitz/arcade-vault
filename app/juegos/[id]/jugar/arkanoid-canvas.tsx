"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ArkanoidEngine, type ArkanoidStats } from "./arkanoid-engine";
import { ARKANOID_SKINS } from "./arkanoid-skins";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

export type ArkanoidCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: ArkanoidStats) => ({
  score: stats.score,
  secondary: stats.lives,
  level: stats.level,
  status: stats.status,
});

const ArkanoidCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function ArkanoidCanvas(
  { onStats, paused, onPauseChange, skinId },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ArkanoidEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // mobile-porter (M9): ver nota equivalente en asteroids-canvas.tsx. La
    // conversión de coordenadas de puntero/touch en arkanoid-engine.ts pasó
    // de `this.canvas.width` (ahora físico, con dpr) a la constante lógica
    // CANVAS_W/CANVAS_H para no desalinear el paddle con el cursor.
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 800;
    const cssHeight = 600;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.getContext("2d")?.scale(dpr, dpr);

    const engine = new ArkanoidEngine(
      canvas,
      (stats) => onStats(toGameStats(stats)),
      (nextPaused) => onPauseChange?.(nextPaused),
      ARKANOID_SKINS[skinId]
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
    engineRef.current?.setSkin(ARKANOID_SKINS[skinId]);
  }, [skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
        touchAction: "none",
      }}
    />
  );
});

export default ArkanoidCanvas;
