"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AsteroidsEngine, type AsteroidsStats } from "./asteroids-engine";
import { ASTEROIDS_SKINS } from "./asteroids-skins";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

export type AsteroidsCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: AsteroidsStats) => ({
  score: stats.score,
  secondary: stats.lives,
  level: stats.level,
  status: stats.status,
});

const AsteroidsCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function AsteroidsCanvas(
  { onStats, paused, skinId },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
    setKey: (key, pressed) => engineRef.current?.setKey(key, pressed),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // mobile-porter (M9): backing store en píxeles físicos (devicePixelRatio)
    // para nitidez en pantallas hi-dpi; la lógica de coordenadas del motor
    // sigue asumiendo el espacio lógico 800x600 gracias al ctx.scale.
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 800;
    const cssHeight = 600;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.getContext("2d")?.scale(dpr, dpr);

    const engine = new AsteroidsEngine(
      canvas,
      (stats) => onStats(toGameStats(stats)),
      ASTEROIDS_SKINS[skinId]
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
    engineRef.current?.setSkin(ASTEROIDS_SKINS[skinId]);
  }, [skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default AsteroidsCanvas;
