"use client";

import { useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { Game } from "../../../data/games";
import { createClient } from "../../../lib/supabase/client";
import { ENGINES, type GameCanvasHandle, type GameStats } from "./engines";

export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const engine = ENGINES[game.id];

  const [paused, setPaused] = useState(false);
  const [name, setName] = useState("INVITADO");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [stats, setStats] = useState<GameStats>(
    engine?.initialStats ?? { score: 0, secondary: 0, level: 1, status: "playing" }
  );
  const canvasRef = useRef<GameCanvasHandle>(null);

  const { score, secondary, level } = stats;
  const showModal = stats.status === "gameover";

  const endGame = () => {
    canvasRef.current?.forceGameOver();
  };
  const restart = () => {
    setPaused(false);
    setSaved(false);
    setSaving(false);
    setSaveError(false);
    setName("INVITADO");
    if (engine) setStats(engine.initialStats);
    setResetKey((k) => k + 1);
  };

  const saveScore = async () => {
    setSaving(true);
    setSaveError(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("scores")
      .insert({ game_id: game.id, player_name: name, score });
    setSaving(false);
    if (error) {
      setSaveError(true);
      return;
    }
    setSaved(true);
  };

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: "var(--ink)" }}>
              {name.trim() || "INVITADO"}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString("es-ES")}</div>
          </div>
          <div className={`hud-stat${engine?.hudLabel === "VIDAS" ? " lives" : ""}`}>
            <div className="l">{engine?.hudLabel ?? ""}</div>
            <div className="v">
              {engine?.hudLabel === "VIDAS" ? "♥ ".repeat(secondary).trim() : secondary}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, "0")}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button className="btn magenta" onClick={endGame}>
            FIN
          </button>
          <button className="btn ghost" onClick={() => router.push(`/juegos/${game.id}`)}>
            SALIR
          </button>
        </div>
      </div>

      <div className="crt">
        <div
          className="crt-screen"
          style={{ "--crt-aspect": engine?.crtAspect ?? "4 / 3" } as CSSProperties}
        >
          {engine && (
            <engine.Canvas
              key={resetKey}
              ref={canvasRef}
              onStats={setStats}
              paused={paused}
              onPauseChange={setPaused}
            />
          )}
          {paused && !engine?.hidePauseOverlay && (
            <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    marginTop: 10,
                    letterSpacing: "0.16em",
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
        <div className="mono kbd-notice">▸ ESTE JUEGO REQUIERE TECLADO_</div>
      </div>

      {showModal && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 10))}
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={saveScore} disabled={saving}>
                  {saving ? "GUARDANDO…" : "GUARDAR PUNTUACIÓN"}
                </button>
                {saveError && (
                  <div
                    className="mono"
                    style={{ color: "var(--magenta)", fontSize: 11, marginTop: 8 }}
                  >
                    ▸ ERROR AL GUARDAR. INTENTA DE NUEVO_
                  </div>
                )}
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn gold" onClick={() => router.push(`/salon?juego=${game.id}`)}>
                VER RANKING
              </button>
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <button className="btn magenta" onClick={() => router.push("/")}>
                VOLVER AL VAULT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
