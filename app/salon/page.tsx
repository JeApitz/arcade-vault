import { getGames } from "../lib/games";
import HallOfFame from "./hall-of-fame";

export default async function SalonPage() {
  const games = await getGames();
  return <HallOfFame games={games} />;
}
