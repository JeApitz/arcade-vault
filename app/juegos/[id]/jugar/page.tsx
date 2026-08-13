import { notFound } from "next/navigation";
import { GAMES } from "../../../data/games";
import GamePlayer from "./game-player";

export default async function GamePlayerPage(props: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await props.params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
