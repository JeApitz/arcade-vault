"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Game, ScoreRow } from "../data/games";
import { createClient } from "../lib/supabase/client";
import { formatDate } from "../lib/format";

export default function HallOfFame({ games }: { games: Game[] }) {
  const [tab, setTab] = useState(games[0]?.id ?? "");

  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "few" | "empty" | "error">("loading");

  useEffect(() => {
    if (!tab) return;
    let cancelled = false;
    setState("loading");
    const supabase = createClient();
    supabase
      .from("scores")
      .select("player_name, score, created_at")
      .eq("game_id", tab)
      .order("score", { ascending: false })
      .limit(12)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setState("error");
          return;
        }
        const mapped: ScoreRow[] = data.map((row, i) => ({
          rank: i + 1,
          name: row.player_name,
          score: row.score,
          date: formatDate(row.created_at),
        }));
        setRows(mapped);
        setState(mapped.length === 0 ? "empty" : mapped.length < 3 ? "few" : "ready");
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const showPodium = state === "ready";
  const showTable = state === "ready" || state === "few";

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>
          LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA
        </p>
      </div>

      <div className="hall-tabs">
        {games.map((g) => (
          <button
            key={g.id}
            className={"chip" + (tab === g.id ? " active" : "")}
            onClick={() => setTab(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {!showTable ? (
        <div className="hall-empty" style={{ textAlign: "center", padding: "48px 0" }}>
          <p className="pixel" style={{ fontSize: 12, color: "var(--ink-dim)" }}>
            {state === "loading"
              ? "CARGANDO PUNTUACIONES…"
              : state === "error"
                ? "NO SE PUDO CARGAR EL RANKING_"
                : "AÚN NO HAY PUNTUACIONES GUARDADAS_"}
          </p>
        </div>
      ) : (
        <>
          {showPodium && (
            <div className="podium">
              <div className="podium-slot silver">
                <div className="rank-num">02</div>
                <div className="name">{rows[1].name}</div>
                <div className="score">{rows[1].score.toLocaleString("es-ES")}</div>
                <div className="date">{rows[1].date}</div>
              </div>
              <div className="podium-slot gold">
                <div
                  className="pixel"
                  style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}
                >
                  CAMPEÓN
                </div>
                <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>
                  01
                </div>
                <div className="name">{rows[0].name}</div>
                <div className="score" style={{ fontSize: 20 }}>
                  {rows[0].score.toLocaleString("es-ES")}
                </div>
                <div className="date">{rows[0].date}</div>
              </div>
              <div className="podium-slot bronze">
                <div className="rank-num">03</div>
                <div className="name">{rows[2].name}</div>
                <div className="score">{rows[2].score.toLocaleString("es-ES")}</div>
                <div className="date">{rows[2].date}</div>
              </div>
            </div>
          )}

          <div className="hall-table">
            <div className="th">
              <div>RANGO</div>
              <div>JUGADOR</div>
              <div>PUNTUACIÓN</div>
              <div>FECHA</div>
            </div>
            {rows.map((r, i) => (
              <div
                key={r.name + i}
                className={"tr" + (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "")}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="rk">#{String(r.rank).padStart(2, "0")}</div>
                <div className="pl">{r.name}</div>
                <div className="sc">{r.score.toLocaleString("es-ES")}</div>
                <div className="dt">{r.date}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/games" className="btn lg">
          VOLVER A LA BIBLIOTECA
        </Link>
      </div>
    </div>
  );
}
