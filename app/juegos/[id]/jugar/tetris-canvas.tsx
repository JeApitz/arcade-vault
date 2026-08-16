"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { TetrisEngine, type TetrisStats } from "./tetris-engine";
import type { GameCanvasHandle, GameCanvasProps } from "./engines";

export type TetrisCanvasHandle = GameCanvasHandle;

const toGameStats = (stats: TetrisStats) => ({
  score: stats.score,
  secondary: stats.lines,
  level: stats.level,
  status: stats.status,
});

const TetrisCanvas = forwardRef<GameCanvasHandle, GameCanvasProps>(function TetrisCanvas(
  { onStats, paused },
  ref
) {
  const boardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const nextCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);

  useImperativeHandle(ref, () => ({
    forceGameOver: () => engineRef.current?.forceGameOver(),
  }));

  useEffect(() => {
    const boardCanvas = boardCanvasRef.current;
    const nextCanvas = nextCanvasRef.current;
    if (!boardCanvas || !nextCanvas) return;

    const engine = new TetrisEngine(boardCanvas, nextCanvas, (stats) =>
      onStats(toGameStats(stats))
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
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={boardCanvasRef}
        width={300}
        height={600}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "block",
        }}
      />
      <canvas
        ref={nextCanvasRef}
        width={120}
        height={120}
        style={{
          position: "absolute",
          left: "calc(50% + 170px)",
          top: 32,
          display: "block",
        }}
      />
    </div>
  );
});

export default TetrisCanvas;
