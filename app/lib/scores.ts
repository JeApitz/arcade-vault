import type { ScoreRow } from "../data/games";
import { createClient } from "./supabase/server";
import { formatDate } from "./format";

export { formatDate, timeAgo } from "./format";

export async function getTopScores(gameId: string, limit = 12): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at, user_id")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row, i) => ({
    rank: i + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
    registered: row.user_id !== null,
  }));
}

export interface RecentScore {
  playerName: string;
  gameId: string;
  score: number;
  createdAt: string;
}

export async function getRecentScores(limit = 7): Promise<RecentScore[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, game_id, score, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row) => ({
    playerName: row.player_name,
    gameId: row.game_id,
    score: row.score,
    createdAt: row.created_at,
  }));
}

export interface TopPlayer {
  playerName: string;
  score: number;
}

export async function getTopPlayers(limit = 5): Promise<TopPlayer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, user_id")
    .order("score", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  const best = new Map<string, { playerName: string; score: number }>();
  for (const row of data) {
    const key = row.user_id ?? `guest:${row.player_name}`;
    const current = best.get(key);
    if (current === undefined || row.score > current.score) {
      best.set(key, { playerName: row.player_name, score: row.score });
    }
  }
  return Array.from(best.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
