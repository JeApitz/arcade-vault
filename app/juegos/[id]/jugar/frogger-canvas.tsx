"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { FroggerEngine, type FroggerStats } from "./frogger-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";
import { FROGGER_SKINS } from "./frogger-skins";

export type FroggerCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: FroggerStats) => ({
  score: stats.score,
  secondary: stats.lives,
  level: stats.level,
  status: stats.status,
});

const FroggerCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function FroggerCanvas(
  { onStats, paused, skinId },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FroggerEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
    setKey: (key, pressed) => engineRef.current?.setKey(key, pressed),
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const cssWidth = 640;
    const cssHeight = 560;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
    canvas.getContext("2d")?.scale(dpr, dpr);

    const engine = new FroggerEngine(
      canvas,
      (stats) => onStats(toGameStats(stats)),
      FROGGER_SKINS[skinId]
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
    engineRef.current?.setSkin(FROGGER_SKINS[skinId]);
  }, [skinId]);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={560}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
    />
  );
});

export default FroggerCanvas;
