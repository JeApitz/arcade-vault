// Puntaje pendiente de un invitado que aún no tiene sesión activa (spec 17).
// Lógica pura sobre localStorage, sin dependencias. Todo acceso en try/catch:
// un navegador con storage bloqueado degrada sin romper (no persiste).
//
// Clave: av:pending-score:v1, un registro por game_id.
// TTL: 7 días. Si ya hay pendiente para el juego, se conserva el de mayor score.

const KEY = "av:pending-score:v1";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

type PendingEntry = { score: number; savedAt: number };
type PendingScores = Record<string, PendingEntry>;

function readAll(): PendingScores {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as PendingScores;
  } catch {
    return {};
  }
}

function writeAll(map: PendingScores): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // storage bloqueado o lleno: se ignora, no se persiste.
  }
}

function isValid(entry: PendingEntry | undefined): entry is PendingEntry {
  return (
    !!entry &&
    typeof entry.score === "number" &&
    typeof entry.savedAt === "number" &&
    Date.now() - entry.savedAt <= TTL_MS
  );
}

export function savePending(gameId: string, score: number): void {
  const map = readAll();
  const current = map[gameId];
  if (isValid(current) && current.score >= score) return;
  map[gameId] = { score, savedAt: Date.now() };
  writeAll(map);
}

export function readPending(gameId: string): number | null {
  const map = readAll();
  const entry = map[gameId];
  if (!isValid(entry)) {
    if (entry) clearPending(gameId); // descarta el vencido
    return null;
  }
  return entry.score;
}

export function clearPending(gameId: string): void {
  const map = readAll();
  if (!(gameId in map)) return;
  delete map[gameId];
  writeAll(map);
}
