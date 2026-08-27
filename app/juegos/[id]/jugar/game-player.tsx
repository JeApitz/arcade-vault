"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Game } from "../../../data/games";
import { createClient } from "../../../lib/supabase/client";
import { getDisplayName } from "../../../components/user-avatar";
import { ENGINES, type GameCanvasHandle, type GameStats } from "./engines";
import { DEFAULT_SKIN, SKIN_IDS, SKIN_LABELS, readSkinId, writeSkinId, type SkinId } from "./skins";
import TouchControls from "./touch-controls";

export default function GamePlayer({ game }: { game: Game }) {
  const router = useRouter();
  const engine = ENGINES[game.id];
  const supabase = createClient();

  const [paused, setPaused] = useState(false);
  const [skinId, setSkinId] = useState<SkinId | null>(null); // null = pre-hidratación
  useEffect(() => {
    setSkinId(readSkinId(game.id));
  }, [game.id]);

  const selectSkin = (id: SkinId) => {
    setSkinId(id);
    writeSkinId(game.id, id);
  };
  const [name, setName] = useState("INVITADO");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [stats, setStats] = useState<GameStats>(
    engine?.initialStats ?? { score: 0, secondary: 0, level: 1, status: "playing" }
  );
  const canvasRef = useRef<GameCanvasHandle>(null);

  const [user, setUser] = useState<User | null>(null);
  const [authTab, setAuthTab] = useState<"in" | "up">("in");
  const [authUser, setAuthUser] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authCheckEmail, setAuthCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && name === "INVITADO") {
      setName(getDisplayName(user).toUpperCase().slice(0, 10));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const authSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    if (authTab === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPass,
      });
      setAuthLoading(false);
      if (error) {
        setAuthError(error.message);
        return;
      }
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPass,
      options: {
        data: { username: authUser },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth`,
      },
    });
    setAuthLoading(false);
    if (error) {
      setAuthError(error.message);
      return;
    }
    setAuthCheckEmail(true);
  };

  const [skipAuth, setSkipAuth] = useState(false);

  const { score, secondary, level } = stats;
  const showModal = stats.status === "gameover";
  const showInlineAuth = !user && !saved && !skipAuth;

  const endGame = () => {
    canvasRef.current?.forceGameOver();
  };
  const restart = () => {
    setPaused(false);
    setSaved(false);
    setSaving(false);
    setSaveError(false);
    setName("INVITADO");
    setAuthTab("in");
    setAuthUser("");
    setAuthEmail("");
    setAuthPass("");
    setAuthError(null);
    setAuthCheckEmail(false);
    setSkipAuth(false);
    if (engine) setStats(engine.initialStats);
    setResetKey((k) => k + 1);
  };

  const saveScore = async () => {
    setSaving(true);
    setSaveError(false);
    const {
      data: { user: current },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("scores")
      .insert({ game_id: game.id, player_name: name, score, user_id: current?.id ?? null });
    setSaving(false);
    if (error) {
      setSaveError(true);
      return;
    }
    setSaved(true);
  };

  return (
    <div className={`av-player fade-in${engine?.fitViewport ? " av-player--fit" : ""}`}>
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
        <div className="hud-skins" role="group" aria-label="Skin">
          <div className="l">Skin</div>
          {SKIN_IDS.map((id) => (
            <button
              key={id}
              className={`btn ghost${(skinId ?? DEFAULT_SKIN) === id ? " active" : ""}`}
              aria-pressed={(skinId ?? DEFAULT_SKIN) === id}
              onClick={(e) => {
                selectSkin(id);
                e.currentTarget.blur();
              }}
            >
              {SKIN_LABELS[id]}
            </button>
          ))}
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
        {(() => {
          const screen = (
            <div
              className="crt-screen"
              style={{ "--crt-aspect": engine?.crtAspect ?? "4 / 3" } as CSSProperties}
            >
              {engine && skinId !== null && (
                <engine.Canvas
                  key={resetKey}
                  ref={canvasRef}
                  onStats={setStats}
                  paused={paused}
                  onPauseChange={setPaused}
                  skinId={skinId}
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
                        fontSize: 12,
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
          );
          // fitViewport (solo Frogger): envuelve crt-screen en un contenedor
          // dimensionado por flex para que su aspect-ratio se resuelva como
          // bloque normal, dejando lugar a crt-bottom y el panel táctil.
          return engine?.fitViewport ? <div className="crt-viewport">{screen}</div> : screen;
        })()}
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
        {engine && (
          <TouchControls gameId={game.id} touchControls={engine.touchControls} handle={canvasRef} />
        )}
      </div>

      {showModal && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString("es-ES")}</div>
            {showInlineAuth ? (
              authCheckEmail ? (
                <div style={{ margin: "18px 0", textAlign: "left" }}>
                  <p className="mono" style={{ fontSize: 12, color: "var(--ink-dim)" }}>
                    Enviamos un enlace de confirmación a <strong>{authEmail}</strong>. Confirma tu
                    correo y luego iniciá sesión para guardar este puntaje.
                  </p>
                </div>
              ) : (
                <form onSubmit={authSubmit} style={{ margin: "18px 0", textAlign: "left" }}>
                  <div className="auth-tabs">
                    <button
                      type="button"
                      className={authTab === "in" ? "on" : ""}
                      onClick={() => setAuthTab("in")}
                    >
                      INICIAR SESIÓN
                    </button>
                    <button
                      type="button"
                      className={authTab === "up" ? "on" : ""}
                      onClick={() => setAuthTab("up")}
                    >
                      CREAR CUENTA
                    </button>
                  </div>
                  {authTab === "in" ? (
                    <div className="field">
                      <label>Correo electrónico</label>
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="jugador@vault.gg"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="field">
                        <label>Usuario</label>
                        <input
                          value={authUser}
                          onChange={(e) => setAuthUser(e.target.value)}
                          placeholder="px_kai"
                        />
                      </div>
                      <div className="field">
                        <label>Correo electrónico</label>
                        <input
                          type="email"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          placeholder="jugador@vault.gg"
                        />
                      </div>
                    </>
                  )}
                  <div className="field">
                    <label>Contraseña</label>
                    <input
                      type="password"
                      value={authPass}
                      onChange={(e) => setAuthPass(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  {authError && (
                    <div
                      className="mono"
                      style={{ color: "var(--magenta)", fontSize: 11, marginBottom: 8 }}
                    >
                      ▸ {authError}
                    </div>
                  )}
                  <button
                    className="btn yellow"
                    type="submit"
                    disabled={authLoading}
                    style={{ width: "100%" }}
                  >
                    {authLoading
                      ? "PROCESANDO…"
                      : authTab === "in"
                        ? "INICIAR SESIÓN Y GUARDAR"
                        : "CREAR CUENTA"}
                  </button>
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => setSkipAuth(true)}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    GUARDAR COMO INVITADO
                  </button>
                </form>
              )
            ) : !saved ? (
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
