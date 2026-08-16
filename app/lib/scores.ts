import type { ScoreRow } from "../data/games";
import { createClient } from "./supabase/server";
import { formatDate } from "./format";

export { formatDate, timeAgo } from "./format";

export async function getTopScores(gameId: string, limit = 12): Promise<ScoreRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((row, i) => ({
    rank: i + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
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
    .select("player_name, score")
    .order("score", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  const best = new Map<string, number>();
  for (const row of data) {
    const current = best.get(row.player_name);
    if (current === undefined || row.score > current) {
      best.set(row.player_name, row.score);
    }
  }
  return Array.from(best.entries())
    .map(([playerName, score]) => ({ playerName, score }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
