// Registro de motores de juego: mapea el id de un juego real a su componente
// de canvas y al estado inicial de su HUD. Único punto que game-player.tsx
// consulta para saber cómo renderizar un juego, en vez del `if` puntual previo.

import type { ForwardRefExoticComponent, RefAttributes } from "react";
import AsteroidsCanvas from "./asteroids-canvas";
import TetrisCanvas from "./tetris-canvas";
import ArkanoidCanvas from "./arkanoid-canvas";

export interface GameStats {
  score: number;
  secondary: number; // vidas, líneas, ... según el juego
  level: number;
  status: "playing" | "dead" | "gameover";
}

export interface GameCanvasHandle {
  forceGameOver: () => void;
}

export interface GameCanvasProps {
  onStats: (stats: GameStats) => void;
  paused: boolean;
  onPauseChange?: (paused: boolean) => void;
}

interface GameEngineEntry {
  Canvas: ForwardRefExoticComponent<GameCanvasProps & RefAttributes<GameCanvasHandle>>;
  hudLabel: string; // "VIDAS" | "LÍNEAS" | ...
  initialStats: GameStats;
  crtAspect: string; // relación de aspecto del marco CRT, según la forma del campo de juego
  hidePauseOverlay?: boolean; // true si el propio motor dibuja su overlay de pausa en el canvas
}

export const ENGINES: Record<string, GameEngineEntry> = {
  asteroides: {
    Canvas: AsteroidsCanvas,
    hudLabel: "VIDAS",
    initialStats: { score: 0, secondary: 3, level: 1, status: "playing" },
    crtAspect: "4 / 3",
  },
  tetris: {
    Canvas: TetrisCanvas,
    hudLabel: "LÍNEAS",
    initialStats: { score: 0, secondary: 0, level: 1, status: "playing" },
    crtAspect: "4 / 5",
  },
  arkanoid: {
    Canvas: ArkanoidCanvas,
    hudLabel: "VIDAS",
    initialStats: { score: 0, secondary: 3, level: 1, status: "playing" },
    crtAspect: "4 / 3",
    hidePauseOverlay: true,
  },
};
