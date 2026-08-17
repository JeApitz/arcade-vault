"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { ArkanoidEngine, type ArkanoidStats } from "./arkanoid-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

export type ArkanoidCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: ArkanoidStats) => ({
  score: stats.score,
  secondary: stats.lives,
  level: stats.level,
  status: stats.status,
});

const ArkanoidCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function ArkanoidCanvas(
  { onStats, paused, onPauseChange },
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

    const engine = new ArkanoidEngine(
      canvas,
      (stats) => onStats(toGameStats(stats)),
      (nextPaused) => onPauseChange?.(nextPaused)
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

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default ArkanoidCanvas;
