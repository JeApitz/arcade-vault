import { getGames } from "../lib/games";
import GamesLibrary from "./games-library";

export default async function GamesPage() {
  const games = await getGames();
  return <GamesLibrary games={games} />;
}
