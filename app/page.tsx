import { getGames } from "./lib/games";
import { getRecentScores, getTopPlayers } from "./lib/scores";
import HomeContent from "./home-content";

export default async function Home() {
  const [games, recentScores, topPlayers] = await Promise.all([
    getGames(),
    getRecentScores(7),
    getTopPlayers(5),
  ]);

  return <HomeContent games={games} recentScores={recentScores} topPlayers={topPlayers} />;
}
