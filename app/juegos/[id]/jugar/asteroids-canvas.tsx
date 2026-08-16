"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { AsteroidsEngine, type AsteroidsStats } from "./asteroids-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

export type AsteroidsCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: AsteroidsStats) => ({
  score: stats.score,
  secondary: stats.lives,
  level: stats.level,
  status: stats.status,
});

const AsteroidsCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function AsteroidsCanvas(
  { onStats, paused },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<AsteroidsEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new AsteroidsEngine(canvas, (stats) => onStats(toGameStats(stats)));
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
