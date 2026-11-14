import { resumablePosition } from "./player.mjs";

// Episode IDs come from the provider, but local storage may contain older or
// malformed data. Never use objects, booleans, or empty values as identifiers.
export function historyId(value) {
  if (typeof value !== "string" && typeof value !== "number") return "";
  if (typeof value === "number" && !Number.isFinite(value)) return "";
  return String(value).trim();
}

function number(value) {
  return (typeof value === "number" || (typeof value === "string" && value.trim())) ? Number(value) : NaN;
}

export function isCompletedHistory(item) {
  const progress = number(item?.progress);
  const duration = number(item?.duration);
  // The player records the exact duration at the end. Reject out-of-range
  // values rather than interpreting corrupted browser storage as completed.
  return Number.isFinite(progress) && Number.isFinite(duration) && duration > 0 && progress === duration;
}

// History is newest first. Only the most recently visited episode of a series
// may be offered, so an older unfinished episode cannot reappear after the user
// has visited or finished a newer one. An embed or a zero position is not a
// resumable direct video and must not be presented as one.
export function continueWatching(history, limit = 4) {
  if (!Array.isArray(history) || !Number.isInteger(limit) || limit <= 0) return [];
  const seen = new Set();
  const result = [];
  for (const item of history) {
    const episodeId = historyId(item?.episodeId);
    if (!episodeId) continue;
    const animeId = historyId(item?.animeId);
    const key = animeId ? `anime:${animeId}` : `episode:${episodeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!resumablePosition(item.progress, item.duration)) continue;
    result.push(item);
    if (result.length === limit) break;
  }
  return result;
}
