"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/app/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"in" | "up">("in");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [email, setEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/");
      } else {
        setCheckingSession(false);
      }
    });
  }, [supabase, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === "in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: pass,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username: user },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCheckEmail(true);
  };

  const oauth = async (provider: "google" | "github") => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  const playAsGuest = () => {
    router.push("/games");
  };

  if (checkingSession) {
    return null;
  }

  if (checkEmail) {
    return (
      <div className="av-auth-wrap fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark"></div>
            <h2 className="neon-cyan">REVISA TU CORREO</h2>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: "var(--ink-faint)",
                letterSpacing: "0.16em",
                marginTop: 6,
              }}
            >
              CONFIRMACIÓN PENDIENTE
            </div>
          </div>
          <p
            className="mono"
            style={{ fontSize: 13, color: "var(--ink-dim)", textAlign: "center", marginTop: 16 }}
          >
            Enviamos un enlace de confirmación a <strong>{email}</strong>. Confirma tu correo antes
            de iniciar sesión.
          </p>
          <button
            className="btn ghost"
            style={{ width: "100%", marginTop: 18 }}
            type="button"
            onClick={() => {
              setCheckEmail(false);
              setTab("in");
            }}
          >
            VOLVER AL LOGIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark"></div>
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        <div className="auth-tabs">
          <button className={tab === "in" ? "on" : ""} onClick={() => setTab("in")}>
            INICIAR SESIÓN
          </button>
          <button className={tab === "up" ? "on" : ""} onClick={() => setTab("up")}>
            CREAR CUENTA
          </button>
        </div>

        <form onSubmit={submit}>
          {tab === "in" ? (
            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="jugador@vault.gg"
              />
            </div>
          ) : (
            <>
              <div className="field">
                <label>Usuario</label>
                <input
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  placeholder="px_kai"
                />
              </div>
              <div className="field slide-in">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                />
              </div>
            </>
          )}
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {tab === "in" && (
            <button
              className="btn ghost"
              type="button"
              style={{ marginTop: -4, marginBottom: 4, fontSize: 12 }}
              onClick={async () => {
                setError(null);
                if (!loginEmail) {
                  setError("Ingresa tu correo para recuperar la contraseña.");
                  return;
                }
                const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
                  redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
                });
                if (error) {
                  setError(error.message);
                } else {
                  setError("Te enviamos un correo para recuperar tu contraseña.");
                }
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && (
            <div
              className="mono"
              style={{ color: "var(--danger, #ff5566)", fontSize: 12, marginBottom: 8 }}
            >
              {error}
            </div>
          )}

          <button
            className="btn lg"
            type="submit"
            disabled={loading}
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading ? "PROCESANDO..." : tab === "in" ? "ENTRAR AL VAULT" : "CREAR Y JUGAR"}
          </button>
        </form>

        <button
          className="btn ghost"
          style={{ width: "100%", marginTop: 10 }}
          type="button"
          onClick={playAsGuest}
        >
          JUGAR COMO INVITADO
        </button>

        <div className="auth-divider">O CONTINÚA CON</div>
        <div className="social">
          <button className="btn ghost" type="button" onClick={() => oauth("google")}>
            ◆ GOOGLE
          </button>
          <button className="btn ghost" type="button" onClick={() => oauth("github")}>
            ▣ GITHUB
          </button>
        </div>

        <div
          style={{
            marginTop: 18,
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
