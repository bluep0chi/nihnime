// Presentation helpers for fields actually returned by AnimeIn.
export function hasText(value) {
  if (value == null) return false;
  const text = String(value).trim();
  return Boolean(text) && !/^(?:-|unknown|n\/?a|null)$/i.test(text);
}

export function statusLabel(value) {
  if (!hasText(value)) return "";
  const status = String(value).trim();
  if (/^ongoing$/i.test(status)) return "Sedang Tayang";
  if (/^(?:finished|completed|end)$/i.test(status)) return "Selesai";
  if (/^(?:upcoming|not yet aired)$/i.test(status)) return "Akan Tayang";
  return status;
}

export function scoreLabel(value) {
  const score = Number(value);
  return hasText(value) && Number.isFinite(score) && score > 0 ? String(value).trim() : "";
}

export function groupGenres(genres = []) {
  const labels = new Map([["genre", "Genre"], ["theme", "Tema"], ["demographic", "Demografi"]]);
  const grouped = new Map();
  for (const genre of genres) {
    if (!genre || !hasText(genre.name)) continue;
    const key = String(genre.group || "").trim().toLowerCase();
    const label = labels.get(key) || (hasText(genre.group) ? String(genre.group).trim() : "Lainnya");
    if (!grouped.has(label)) grouped.set(label, []);
    grouped.get(label).push(genre);
  }
  const order = ["Genre", "Tema", "Demografi"];
  return [...grouped.entries()]
    .sort(([a], [b]) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)))
    .map(([label, items]) => ({ label, items: [...items].sort((a, b) => a.name.localeCompare(b.name)) }));
}

// AnimeIn's year is a catalog category, not necessarily the original air year.
export function sortYears(years = []) {
  return [...years].sort((a, b) => {
    const rank = (value) => {
      const match = String(value || "").match(/^(\d{4})(an)?$/i);
      return match ? Number(match[1]) : -1;
    };
    return rank(b.name) - rank(a.name) || String(a.name).localeCompare(String(b.name));
  });
}

export function availableEpisodeCount(anime) {
  if (anime?.episodes_error) return null;
  if (anime?.episode_total != null && Number.isInteger(Number(anime.episode_total)) && Number(anime.episode_total) >= 0) return String(anime.episode_total);
  if (!Array.isArray(anime?.episodes)) return null;
  return anime.episodes.length >= 30 ? `≥${anime.episodes.length}` : String(anime.episodes.length);
}

export function episodeChoices(anime) {
  const episodes = Array.isArray(anime?.episodes) ? anime.episodes : [];
  const latest = episodes[0]?.id ? episodes[0] : null;
  // A partial descending list's last item is not the first episode.
  const first = anime?.episode_detail?.id ? anime.episode_detail : !anime?.episodes_error && episodes.length < 30 && episodes.at(-1)?.id ? episodes.at(-1) : null;
  return { first, latest };
}

export const SCHEDULE_DAYS = ["SENIN", "SELASA", "RABU", "KAMIS", "JUMAT", "SABTU", "MINGGU", "RANDOM"];
export function jakartaDay(date = new Date()) {
  return new Intl.DateTimeFormat("id-ID", { weekday: "long", timeZone: "Asia/Jakarta" }).format(date).toUpperCase();
}
export function dayLabel(day) {
  const value = String(day || "");
  return value === "RANDOM" ? "Acak" : value.charAt(0) + value.slice(1).toLowerCase();
}
