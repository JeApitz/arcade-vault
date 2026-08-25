"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { GameCanvasHandle, TouchButton, TouchControlsConfig } from "./engines";

const REPEAT_DELAY_MS = 200;
const REPEAT_INTERVAL_MS = 130;

// Texto accesible para los botones de acción que se muestran como solo ícono.
const ACTION_ARIA_LABELS: Record<string, Record<string, string>> = {
  asteroides: { ArrowUp: "Impulso", Space: "Disparo" },
  tetris: { ArrowUp: "Rotar", Space: "Caer" },
};

// Posición dentro de la cruz del d-pad, inferida del key (SPEC 12).
const DPAD_POSITION_CLASS: Record<string, string> = {
  ArrowUp: "touch-dpad-up",
  ArrowDown: "touch-dpad-down",
  ArrowLeft: "touch-dpad-left",
  ArrowRight: "touch-dpad-right",
};

interface TouchControlsProps {
  gameId: string;
  touchControls: TouchControlsConfig;
  handle: RefObject<GameCanvasHandle | null>;
}

interface TouchButtonProps {
  gameId: string;
  button: TouchButton;
  handle: RefObject<GameCanvasHandle | null>;
  extraClassName?: string;
}

function TouchControlButton({ gameId, button, handle, extraClassName }: TouchButtonProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => clearTimers, []);

  const press = () => {
    handle.current?.setKey?.(button.key, true);
    if (button.repeat) {
      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          handle.current?.setKey?.(button.key, true);
        }, REPEAT_INTERVAL_MS);
      }, REPEAT_DELAY_MS);
    }
  };

  const release = () => {
    clearTimers();
    handle.current?.setKey?.(button.key, false);
  };

  const ariaLabel = ACTION_ARIA_LABELS[gameId]?.[button.key];
  const icon = button.label.split(" ")[0];

  return (
    <button
      type="button"
      className={`touch-btn touch-btn-${button.area}${extraClassName ? ` ${extraClassName}` : ""}`}
      aria-label={ariaLabel}
      data-icon={icon}
      onPointerDown={(e) => {
        e.preventDefault();
        press();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      {button.label}
    </button>
  );
}

export default function TouchControls({ gameId, touchControls, handle }: TouchControlsProps) {
  if (touchControls.mode === "drag") {
    return (
      <div className="touch-controls">
        <span className="touch-hint">{touchControls.hint}</span>
      </div>
    );
  }

  const dpadButtons = touchControls.buttons.filter((b) => b.area === "dpad");
  const actionButtons = touchControls.buttons.filter((b) => b.area === "action");
  const isGamepad = dpadButtons.length > 0 && actionButtons.length > 0;
  const isCross = isGamepad && dpadButtons.length >= 3;

  return (
    <div className={`touch-controls${isGamepad ? " touch-controls--gamepad" : ""}`}>
      <div className={`dpad${isCross ? " dpad--cross" : ""}`}>
        {dpadButtons.map((button) => (
          <TouchControlButton
            key={button.key}
            gameId={gameId}
            button={button}
            handle={handle}
            extraClassName={DPAD_POSITION_CLASS[button.key]}
          />
        ))}
        {isCross && <div className="dpad-hub" aria-hidden="true" />}
      </div>
      <div className="actions">
        {actionButtons.map((button, index) => (
          <TouchControlButton
            key={button.key}
            gameId={gameId}
            button={button}
            handle={handle}
            extraClassName={isGamepad ? `touch-btn-action-${index}` : undefined}
          />
        ))}
      </div>
    </div>
  );
}
