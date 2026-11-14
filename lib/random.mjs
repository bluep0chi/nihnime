import { hasText } from "./display.mjs";

// The detail route accepts numeric provider IDs and explicitly marked demo IDs.
// Do not turn malformed provider data into arbitrary navigation URLs.
function animeId(item) {
  const value = item?.id;
  if (typeof value !== "string" && typeof value !== "number") return "";
  if (typeof value === "number" && !Number.isSafeInteger(value)) return "";
  const id = String(value).trim();
  if (/^\d+$/.test(id)) return id.replace(/^0+/, "");
  if (item?.demo === true && /^demo-[1-9]\d*$/.test(id)) return id;
  return "";
}

export function randomCandidates(data) {
  if (!Array.isArray(data)) return [];
  const seen = new Set();
  const result = [];
  for (const item of data) {
    const id = animeId(item);
    const title = typeof item?.title === "string" ? item.title.trim() : "";
    if (!id || !hasText(title) || seen.has(id)) continue;
    seen.add(id);
    result.push({ ...item, id, title });
  }
  return result;
}

// Draw from the provider's current pool and avoid an immediate repeat whenever
// there is another valid choice. A single-title pool still remains usable.
export function chooseRandomAnime(candidates, previousId = "", random = Math.random) {
  if (!Array.isArray(candidates) || !candidates.length) return null;
  const alternatives = candidates.filter((anime) => anime.id !== String(previousId));
  const pool = alternatives.length ? alternatives : candidates;
  const value = random();
  const index = Number.isFinite(value) ? Math.max(0, Math.min(pool.length - 1, Math.floor(value * pool.length))) : 0;
  return pool[index];
}
