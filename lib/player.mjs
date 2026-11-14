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

export function preferredServerIndex(servers = []) {
  const valid = servers.map((server, index) => ({ server, index })).filter(({ server }) => safeMediaUrl(server?.url));
  const direct = valid.filter(({ server }) => isDirectVideoServer(server));
  const preferred = direct.find(({ server }) => parseInt(server.quality, 10) === 720)
    || direct.reduce((best, entry) => !best || (parseInt(entry.server.quality, 10) || 0) > (parseInt(best.server.quality, 10) || 0) ? entry : best, null)
    || valid[0];
  return preferred?.index ?? 0;
}
