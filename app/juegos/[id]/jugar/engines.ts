// Registro de motores de juego: mapea el id de un juego real a su componente
// de canvas y al estado inicial de su HUD. Único punto que game-player.tsx
// consulta para saber cómo renderizar un juego, en vez del `if` puntual previo.

import type { ForwardRefExoticComponent, RefAttributes } from "react";
import AsteroidsCanvas from "./asteroids-canvas";
import TetrisCanvas from "./tetris-canvas";
import ArkanoidCanvas from "./arkanoid-canvas";
import SnakeCanvas from "./snake-canvas";
import FroggerCanvas from "./frogger-canvas";
import type { SkinId } from "./skins";

export interface GameStats {
  score: number;
  secondary: number; // vidas, líneas, ... según el juego
  level: number;
  status: "playing" | "dead" | "gameover";
}

export interface GameCanvasHandle {
  forceGameOver: () => void;
  setKey?: (key: string, pressed: boolean) => void;
}

export interface GameCanvasProps {
  onStats: (stats: GameStats) => void;
  paused: boolean;
  onPauseChange?: (paused: boolean) => void;
  skinId: SkinId;
}

export interface TouchButton {
  key: string; // debe matchear el `code` que el motor ya usa en su handleKeyDown/keyup
  label: string;
  area: "dpad" | "action";
  repeat?: boolean; // true = auto-repeat mientras se mantiene presionado (solo Tetris mover/bajar)
}

export type TouchControlsConfig =
  { mode: "buttons"; buttons: TouchButton[] } | { mode: "drag"; hint: string };

interface GameEngineEntry {
  Canvas: ForwardRefExoticComponent<GameCanvasProps & RefAttributes<GameCanvasHandle>>;
  hudLabel: string; // "VIDAS" | "LÍNEAS" | ...
  initialStats: GameStats;
  crtAspect: string; // relación de aspecto del marco CRT, según la forma del campo de juego
  hidePauseOverlay?: boolean; // true si el propio motor dibuja su overlay de pausa en el canvas
  fitViewport?: boolean; // true = el marco CRT se ajusta al alto disponible del viewport (letterbox)
  touchControls: TouchControlsConfig;
}

export const ENGINES: Record<string, GameEngineEntry> = {
  asteroides: {
    Canvas: AsteroidsCanvas,
    hudLabel: "VIDAS",
    initialStats: { score: 0, secondary: 3, level: 1, status: "playing" },
    crtAspect: "4 / 3",
    touchControls: {
      mode: "buttons",
      buttons: [
        { key: "ArrowLeft", label: "◀", area: "dpad" },
        { key: "ArrowRight", label: "▶", area: "dpad" },
        { key: "ArrowUp", label: "▲", area: "action" },
        { key: "Space", label: "●", area: "action" },
      ],
    },
  },
  tetris: {
    Canvas: TetrisCanvas,
    hudLabel: "LÍNEAS",
    initialStats: { score: 0, secondary: 0, level: 1, status: "playing" },
    crtAspect: "4 / 5",
    touchControls: {
      mode: "buttons",
      buttons: [
        { key: "ArrowLeft", label: "◀", area: "dpad", repeat: true },
        { key: "ArrowRight", label: "▶", area: "dpad", repeat: true },
        { key: "ArrowDown", label: "▼ BAJAR", area: "dpad", repeat: true },
        { key: "ArrowUp", label: "⟳", area: "action" },
        { key: "Space", label: "⤓", area: "action" },
      ],
    },
  },
  arkanoid: {
    Canvas: ArkanoidCanvas,
    hudLabel: "VIDAS",
    initialStats: { score: 0, secondary: 3, level: 1, status: "playing" },
    crtAspect: "4 / 3",
    hidePauseOverlay: true,
    touchControls: { mode: "drag", hint: "ARRASTRA PARA MOVER · TOCA PARA LANZAR" },
  },
  snake: {
    Canvas: SnakeCanvas,
    hudLabel: "LONGITUD",
    initialStats: { score: 0, secondary: 1, level: 1, status: "playing" },
    crtAspect: "15 / 16", // 600x640: banda de HUD (P6) sumada al tablero de 600x600
    touchControls: {
      mode: "buttons",
      buttons: [
        { key: "ArrowUp", label: "▲", area: "dpad" },
        { key: "ArrowDown", label: "▼", area: "dpad" },
        { key: "ArrowLeft", label: "◀", area: "dpad" },
        { key: "ArrowRight", label: "▶", area: "dpad" },
      ],
    },
  },
  frogger: {
    Canvas: FroggerCanvas,
    hudLabel: "VIDAS",
    initialStats: { score: 0, secondary: 3, level: 1, status: "playing" },
    crtAspect: "16 / 15",
    fitViewport: true,
    touchControls: {
      mode: "buttons",
      buttons: [
        { key: "ArrowUp", label: "▲", area: "dpad" },
        { key: "ArrowDown", label: "▼", area: "dpad" },
        { key: "ArrowLeft", label: "◀", area: "dpad" },
        { key: "ArrowRight", label: "▶", area: "dpad" },
      ],
    },
  },
};
