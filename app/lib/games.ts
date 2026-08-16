import type { Game } from "../data/games";
import { createClient } from "./supabase/server";

// Catálogo real leído de Supabase (tabla `games`).
// `app/data/games.ts` solo aporta el tipo `Game`; sus constantes ya no
// alimentan la UI.

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").order("title");
  if (error || !data) return [];
  return data as Game[];
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as Game;
}
