// Intro times are community submissions, not a fixed-length guess. We only
// offer an opening when the provider's episode and a single Kitsu/MAL season
// can be matched and AniSkip's submitted runtime is very close to the video.
// Even an equal runtime cannot prove that two releases have the same edit.
const KITSU_API = "https://kitsu.io/api/edge/anime";
const ANISKIP_API = "https://api.aniskip.com/v2/skip-times";
export const INTRO_RUNTIME_TOLERANCE = 1; // seconds, not AniSkip's wider 20s filter

const TYPES = { SERIES: "TV", ONA: "ONA", OVA: "OVA" };
const isId = (value) => /^[1-9]\d{0,9}$/.test(String(value ?? ""));
const episodeNumber = (value) => {
  const text = String(value ?? "").trim();
  return /^[1-9]\d{0,3}$/.test(text) ? Number(text) : null;
};
const normalTitle = (value) => String(value || "").normalize("NFKC").toLocaleLowerCase("en-US")
  .replace(/[\p{P}\p{Z}\p{M}\s]/gu, "");
const validDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const standardEpisodeTitle = (title, number) => {
  const match = String(title || "").trim().match(/^episode\s*0*([1-9]\d*)$/i);
  return Boolean(match && Number(match[1]) === number);
};

export function validVideoDuration(duration) {
  return typeof duration === "number" && Number.isFinite(duration) && duration > 0 && duration <= 43200;
}

// AnimeIn's stream identity is authoritative; season starts at episode 1,
// and fractional/named specials are excluded rather than remapped by guess.
export function identifyEpisode(stream, anime, requestedId) {
  const episode = stream?.episode;
  const number = episodeNumber(episode?.index);
  const first = anime?.episode_detail;
  if (stream?.demo || anime?.demo || !isId(requestedId) || !isId(episode?.id)
      || String(episode.id) !== String(requestedId) || !isId(episode?.id_movie)
      || String(episode.id_movie) !== String(anime?.id) || !number
      || !standardEpisodeTitle(episode?.title, number)
      || !isId(first?.id) || episodeNumber(first?.index) !== 1
      || !standardEpisodeTitle(first?.title, 1)
      || (number === 1 && String(first.id) !== String(episode.id))
      || !TYPES[String(anime?.type || "").toUpperCase()]
      || !validDate(anime?.aired_start)
      || !anime?.title || String(anime.title).length > 160) return null;

  // Details contain only the newest page for long series. If the current
  // episode is on that page, require its ID and number to agree uniquely.
  const episodes = Array.isArray(anime.episodes) ? anime.episodes : [];
  const related = episodes.filter((item) => String(item?.id) === String(episode.id) || episodeNumber(item?.index) === number);
  if (related.length && (related.length !== 1 || String(related[0]?.id) !== String(episode.id)
      || episodeNumber(related[0]?.index) !== number
      || String(related[0]?.id_movie) !== String(anime.id))) return null;
  return { number, type: TYPES[String(anime.type).toUpperCase()] };
}

export function matchKitsuAnime(results, anime, identity) {
  const expected = normalTitle(anime?.title);
  if (!expected || !identity || !validDate(anime?.aired_start)) return null;
  const matches = (Array.isArray(results) ? results : []).filter((item) => {
    const attrs = item?.attributes || {};
    const titles = [attrs.canonicalTitle, ...Object.values(attrs.titles || {})];
    return isId(item?.id) && attrs.startDate === anime.aired_start
      && String(attrs.subtype || "").toUpperCase() === identity.type
      && titles.some((title) => normalTitle(title) === expected);
  });
  // Do not choose a remake, part, special, or other season when ambiguous.
  if (matches.length !== 1) return null;
  const count = matches[0].attributes.episodeCount;
  if (count != null && (!Number.isInteger(count) || count < 1 || identity.number > count)) return null;
  return matches[0];
}

export function matchMalId(results) {
  const ids = new Set((Array.isArray(results) ? results : [])
    .filter((item) => item?.attributes?.externalSite === "myanimelist/anime" && isId(item?.attributes?.externalId))
    .map((item) => String(item.attributes.externalId)));
  return ids.size === 1 ? [...ids][0] : null;
}

export function matchOpening(body, duration) {
  if (!validVideoDuration(duration) || body?.found !== true || !Array.isArray(body.results)) return null;
  const ranges = new Map();
  for (const item of body.results) {
    const start = item?.interval?.startTime;
    const end = item?.interval?.endTime;
    const length = item?.episodeLength;
    if (item?.skipType !== "op" || ![start, end, length].every((n) => typeof n === "number" && Number.isFinite(n))
        || length <= 0 || Math.abs(length - duration) > INTRO_RUNTIME_TOLERANCE
        || start < 0 || end > duration || end <= start || end - start < 5 || end - start > 180) continue;
    ranges.set(`${start}:${end}`, { start, end, episodeLength: length });
  }
  // Contradictory submissions are not resolved by guessing.
  return ranges.size === 1 ? [...ranges.values()][0] : null;
}

async function getJson(url, fetcher, { allowNotFound = false } = {}) {
  const response = await fetcher(url, {
    headers: { Accept: url.hostname === "kitsu.io" ? "application/vnd.api+json" : "application/json", "User-Agent": "NIHNIME/2.2 (+https://github.com/bluep0chi/nihnime)" },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (allowNotFound && response.status === 404) return null;
  if (!response.ok) throw new Error("Layanan data intro tidak tersedia.");
  return response.json();
}

export async function findIntro({ stream, anime, episodeId, duration, fetcher = fetch }) {
  const identity = identifyEpisode(stream, anime, episodeId);
  if (!identity || !validVideoDuration(duration)) return null;

  const search = new URL(KITSU_API);
  search.searchParams.set("filter[text]", anime.title);
  search.searchParams.set("page[limit]", "20");
  search.searchParams.set("fields[anime]", "titles,canonicalTitle,startDate,subtype,episodeCount");
  const searchBody = await getJson(search, fetcher);
  const kitsu = matchKitsuAnime(searchBody?.data, anime, identity);
  if (!kitsu) return null;

  const mappings = new URL(`${KITSU_API}/${kitsu.id}/mappings`);
  mappings.searchParams.set("filter[externalSite]", "myanimelist/anime");
  const mappingBody = await getJson(mappings, fetcher);
  const malId = matchMalId(mappingBody?.data);
  if (!malId) return null;

  const skip = new URL(`${ANISKIP_API}/${malId}/${identity.number}`);
  skip.searchParams.append("types[]", "op"); // mixed openings can include story; never request them
  skip.searchParams.set("episodeLength", duration.toFixed(3));
  const skipBody = await getJson(skip, fetcher, { allowNotFound: true });
  const opening = matchOpening(skipBody, duration);
  return opening ? { ...opening, source: "AniSkip", episode: identity.number } : null;
}
