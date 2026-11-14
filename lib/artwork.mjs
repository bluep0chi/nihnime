// Kitsu is only a fallback when the provider's own artwork cannot load.
// Match the exact title (and year when known) to avoid substituting another season.
const KITSU_API = "https://kitsu.io/api/edge/anime";
const ALLOWED_HOSTS = new Set([
  "media.kitsu.app",
  "media.kitsu.io",
  "kitsu-production-media.s3.us-west-002.backblazeb2.com",
]);

function normalizeTitle(value) {
  return String(value || "").normalize("NFKC").toLocaleLowerCase("en-US")
    .replace(/[\p{P}\p{Z}\p{M}\s]/gu, "");
}

function imageUrl(image, sizes) {
  for (const size of sizes) {
    try {
      const url = new URL(image?.[size]);
      if (url.protocol === "https:" && ALLOWED_HOSTS.has(url.hostname)) return url.href;
    } catch { /* Missing or malformed URL; try the next size. */ }
  }
  return null;
}

export function matchArtwork(results, title, year) {
  const expected = normalizeTitle(title);
  if (!expected) return null;
  const expectedYear = /^\d{4}$/.test(String(year || "")) ? String(year) : null;
  const matches = [];
  for (const result of results || []) {
    const attributes = result?.attributes || {};
    const titles = [attributes.canonicalTitle, ...Object.values(attributes.titles || {})];
    if (!titles.some((candidate) => normalizeTitle(candidate) === expected)) continue;
    if (expectedYear && String(attributes.startDate || "").slice(0, 4) !== expectedYear) continue;
    const poster = imageUrl(attributes.posterImage, ["medium", "large", "small", "original"]);
    const cover = imageUrl(attributes.coverImage, ["large", "small", "original"]);
    if (poster || cover) matches.push({ poster, cover: cover || poster });
  }
  // Without a unique match, a remake or another season might use a different poster.
  return matches.length === 1 ? matches[0] : null;
}

export async function findArtwork(title, year, fetcher = fetch) {
  const url = new URL(KITSU_API);
  url.searchParams.set("filter[text]", title);
  url.searchParams.set("page[limit]", "10");
  url.searchParams.set("fields[anime]", "titles,canonicalTitle,startDate,posterImage,coverImage");
  const response = await fetcher(url, {
    headers: { Accept: "application/vnd.api+json", "User-Agent": "NIHNIME/2.2 (+https://github.com/bluep0chi/nihnime)" },
    // Some Kitsu URLs are signed for 15 minutes, so never cache them for a day.
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Layanan gambar cadangan tidak tersedia.");
  const body = await response.json();
  return matchArtwork(body?.data, title, year);
}
