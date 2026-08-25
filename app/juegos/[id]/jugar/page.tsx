import type { Viewport } from "next";
import { notFound } from "next/navigation";
import { getGame } from "../../../lib/games";
import GamePlayer from "./game-player";

// M12 (mobile-porter): el bloqueo de zoom vive solo aquí, no en el layout
// raíz, porque en esta ruta hay botones táctiles que un doble-tap
// accidental rompería. Ver references/mobile-readiness.md.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default async function GamePlayerPage(props: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await props.params;
  const game = await getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
