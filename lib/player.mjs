// Semi URLs may end in .mp4?embed=true while returning an HTML player.
export function isDirectVideoServer(server) {
  if (!server) return false;
  const type = String(server.type || "").trim().toLowerCase();
  if (type) return type === "direct";
  const url = String(server.url || "");
  if (/[?&]embed(?:=(?:true|1))?(?:[&#]|$)/i.test(url)) return false;
  return /\.(mp4|webm|m4v|ogg|m3u8)(?:[?#]|$)/i.test(url);
}
