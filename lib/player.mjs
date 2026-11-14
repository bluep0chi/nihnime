// Semi URLs may end in .mp4?embed=true while returning an HTML player.
export function isDirectVideoServer(server) {
  if (!server) return false;
  const type = String(server.type || "").trim().toLowerCase();
  if (type) return type === "direct";
  const url = String(server.url || "");
  if (/[?&]embed(?:=(?:true|1))?(?:[&#]|$)/i.test(url)) return false;
  return /\.(mp4|webm|m4v|ogg|m3u8)(?:[?#]|$)/i.test(url);
}

export function safeMediaUrl(value) {
  try {
    const raw = String(value || "");
    const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
    return /^(https?:)$/.test(url.protocol) ? url.href : "";
  } catch { return ""; }
}

export function isHlsUrl(value) {
  return /\.m3u8(?:[?#]|$)/i.test(String(value || ""));
}

export function formatPlayerTime(value) {
  if (!Number.isFinite(value) || value < 0) return "--:--";
  const total = Math.floor(value);
  const seconds = String(total % 60).padStart(2, "0");
  const minutes = String(Math.floor(total / 60) % 60).padStart(2, "0");
  const hours = Math.floor(total / 3600);
  return hours ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

// Keep the last position even in the final seconds; only a completed video
// starts over. Reject malformed or out-of-range data from browser storage.
export function resumablePosition(progress, duration) {
  const number = (value) => (typeof value === "number" || (typeof value === "string" && value.trim())) ? Number(value) : NaN;
  const position = number(progress);
  const length = number(duration);
  return Number.isFinite(position) && Number.isFinite(length) && position > 0 && length > 0 && position < length ? position : 0;
}

// Repeat the critical runtime/range checks in the browser. A late response or
// a changed video duration must never make an old interval seek this video.
export function usableIntro(intro, duration, episode) {
  const { start, end, episodeLength } = intro || {};
  return intro?.source === "AniSkip" && Number.isInteger(Number(episode)) && Number(episode) > 0
    && intro.episode === Number(episode)
    && [start, end, episodeLength, duration].every((n) => typeof n === "number" && Number.isFinite(n))
    && duration > 0 && episodeLength > 0 && Math.abs(episodeLength - duration) <= 1
    && start >= 0 && end <= duration && end > start && end - start >= 5 && end - start <= 180;
}

export function preferredServerIndex(servers = []) {
  const valid = servers.map((server, index) => ({ server, index })).filter(({ server }) => safeMediaUrl(server?.url));
  const direct = valid.filter(({ server }) => isDirectVideoServer(server));
  const preferred = direct.find(({ server }) => parseInt(server.quality, 10) === 720)
    || direct.reduce((best, entry) => !best || (parseInt(entry.server.quality, 10) || 0) > (parseInt(best.server.quality, 10) || 0) ? entry : best, null)
    || valid[0];
  return preferred?.index ?? 0;
}
