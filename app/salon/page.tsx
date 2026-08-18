import { getGames } from "../lib/games";
import HallOfFame from "./hall-of-fame";

export default async function SalonPage(props: PageProps<"/salon">) {
  const games = await getGames();
  const { juego } = await props.searchParams;
  const initialTab = games.some((g) => g.id === juego) ? (juego as string) : "";
  return <HallOfFame games={games} initialTab={initialTab} />;
}
