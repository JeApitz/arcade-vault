"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/app/lib/supabase/client";
import { isPasswordValid } from "@/app/lib/password";
import { PasswordChecklist } from "../password-checklist";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [pass, setPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(pass)) {
      setError("La contraseña no cumple los requisitos de seguridad.");
      return;
    }
    if (pass !== confirmPass) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="av-auth-wrap fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark"></div>
            <h2 className="neon-cyan">CONTRASEÑA ACTUALIZADA</h2>
          </div>
          <p
            className="mono"
            style={{ fontSize: 13, color: "var(--ink-dim)", textAlign: "center", marginTop: 16 }}
          >
            Ya podés iniciar sesión con tu nueva contraseña.
          </p>
          <button
            className="btn lg"
            style={{ width: "100%", marginTop: 18 }}
            type="button"
            onClick={() => router.push("/auth")}
          >
            IR AL LOGIN
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
          <h2 className="neon-cyan">NUEVA CONTRASEÑA</h2>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: "var(--ink-faint)",
              letterSpacing: "0.16em",
              marginTop: 6,
            }}
          >
            RECUPERACIÓN DE CUENTA
          </div>
        </div>

        {!ready ? (
          <p
            className="mono"
            style={{ fontSize: 13, color: "var(--ink-dim)", textAlign: "center", marginTop: 16 }}
          >
            Verificando el enlace de recuperación...
          </p>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <PasswordChecklist password={pass} />
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="••••••••"
              />
            </div>

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
              disabled={loading || !isPasswordValid(pass)}
              style={{ width: "100%", marginTop: 8 }}
            >
              {loading ? "GUARDANDO..." : "GUARDAR CONTRASEÑA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
