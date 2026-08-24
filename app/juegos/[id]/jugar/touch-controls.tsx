"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { GameCanvasHandle, TouchButton, TouchControlsConfig } from "./engines";

const REPEAT_DELAY_MS = 200;
const REPEAT_INTERVAL_MS = 130;

interface TouchControlsProps {
  touchControls: TouchControlsConfig;
  handle: RefObject<GameCanvasHandle | null>;
}

interface TouchButtonProps {
  button: TouchButton;
  handle: RefObject<GameCanvasHandle | null>;
}

function TouchControlButton({ button, handle }: TouchButtonProps) {
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

  return (
    <button
      type="button"
      className={`touch-btn touch-btn-${button.area}`}
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

export default function TouchControls({ touchControls, handle }: TouchControlsProps) {
  if (touchControls.mode === "drag") {
    return (
      <div className="touch-controls">
        <span className="touch-hint">{touchControls.hint}</span>
      </div>
    );
  }

  const dpadButtons = touchControls.buttons.filter((b) => b.area === "dpad");
  const actionButtons = touchControls.buttons.filter((b) => b.area === "action");

  return (
    <div className="touch-controls">
      <div className="dpad">
        {dpadButtons.map((button) => (
          <TouchControlButton key={button.key} button={button} handle={handle} />
        ))}
      </div>
      <div className="actions">
        {actionButtons.map((button) => (
          <TouchControlButton key={button.key} button={button} handle={handle} />
        ))}
      </div>
    </div>
  );
}
