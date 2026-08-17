"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { SnakeEngine, type SnakeStats } from "./snake-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

export type SnakeCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: SnakeStats) => ({
  score: stats.score,
  secondary: stats.length,
  level: stats.level,
  status: stats.status,
});

const SnakeCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function SnakeCanvas(
  { onStats, paused },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SnakeEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new SnakeEngine(canvas, (stats) => onStats(toGameStats(stats)));
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
      width={600}
      height={600}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default SnakeCanvas;
