import test from "node:test";
import assert from "node:assert/strict";
import { findIntro, identifyEpisode, matchKitsuAnime, matchMalId, matchOpening, validVideoDuration } from "../lib/intro.mjs";

const anime = () => ({
  id: "6483", title: "Kusuriya no Hitorigoto 3rd Season", type: "SERIES", aired_start: "2026-10-02",
  episode_detail: { id: "321296", index: "1", title: "Episode 1" },
  episodes: [{ id: "322056", index: "7", title: "Episode 7", id_movie: "6483" }],
});
const stream = () => ({ episode: { id: "322056", id_movie: "6483", index: "7", title: "Episode 7" } });
const kitsu = (overrides = {}) => ({ id: "50021", attributes: {
  canonicalTitle: "Kusuriya no Hitorigoto 3rd Season", titles: { en: "The Apothecary Diaries Season 3" },
  startDate: "2026-10-02", subtype: "TV", episodeCount: 12, ...overrides,
} });
const opening = (overrides = {}) => ({ found: true, results: [{
  interval: { startTime: 1.0217702, endTime: 91.07529 }, skipType: "op", episodeLength: 1442.0288, ...overrides,
}] });

test("identify only an ordinary episode in the provider's actual season", () => {
  assert.deepEqual(identifyEpisode(stream(), anime(), "322056"), { number: 7, type: "TV" });
  assert.equal(identifyEpisode(stream(), anime(), "321800"), null);
  assert.equal(identifyEpisode({ episode: { ...stream().episode, id_movie: "5566" } }, anime(), "322056"), null);
  assert.equal(identifyEpisode({ episode: { ...stream().episode, index: "6.5" } }, anime(), "322056"), null);
  assert.equal(identifyEpisode({ episode: { ...stream().episode, title: "Special 7" } }, anime(), "322056"), null);
  assert.equal(identifyEpisode(stream(), { ...anime(), episode_detail: { id: "4", index: "25", title: "Episode 25" } }, "322056"), null);
  assert.equal(identifyEpisode(stream(), { ...anime(), episodes: [{ ...anime().episodes[0], id: "other" }] }, "322056"), null);
  assert.equal(identifyEpisode(stream(), { ...anime(), aired_start: null }, "322056"), null);
  assert.equal(identifyEpisode(stream(), { ...anime(), aired_start: "2026-02-31" }, "322056"), null);
  assert.equal(identifyEpisode({ ...stream(), demo: true }, anime(), "322056"), null);
  assert.equal(identifyEpisode(stream(), { ...anime(), type: "MOVIE" }, "322056"), null);
  // Old episodes need not occur on the newest page, but episode 1 must match
  // the provider's independently identified first episode.
  assert.notEqual(identifyEpisode(stream(), { ...anime(), episodes: [] }, "322056"), null);
  const one = { episode: { id: "321296", id_movie: "6483", index: "1", title: "Episode 1" } };
  assert.notEqual(identifyEpisode(one, { ...anime(), episodes: [] }, "321296"), null);
  assert.equal(identifyEpisode({ episode: { ...one.episode, id: "9" } }, { ...anime(), episodes: [] }, "9"), null);
});

test("match exact title, start date, subtype and episode count without choosing another season", () => {
  const identity = identifyEpisode(stream(), anime(), "322056");
  assert.equal(matchKitsuAnime([kitsu(), kitsu({ canonicalTitle: "Kusuriya no Hitorigoto 2nd Season", titles: {}, startDate: "2025-01-10" })], anime(), identity)?.id, "50021");
  assert.equal(matchKitsuAnime([kitsu({ startDate: "2026-10-03" })], anime(), identity), null);
  assert.equal(matchKitsuAnime([kitsu({ subtype: "movie" })], anime(), identity), null);
  assert.equal(matchKitsuAnime([kitsu({ episodeCount: 6 })], anime(), identity), null);
  assert.equal(matchKitsuAnime([kitsu(), { ...kitsu(), id: "50022" }], anime(), identity), null);
  assert.equal(matchKitsuAnime([kitsu({ canonicalTitle: "Kusuriya no Hitorigoto 3rd Season Part 2", titles: {} })], anime(), identity), null);
  assert.equal(matchKitsuAnime([kitsu({ episodeCount: null })], anime(), identity)?.id, "50021");
});

test("require a single valid Kitsu to MAL mapping", () => {
  const entry = (id, site = "myanimelist/anime") => ({ attributes: { externalSite: site, externalId: id } });
  assert.equal(matchMalId([entry("61987"), entry("61987"), entry("55", "anilist/anime")]), "61987");
  assert.equal(matchMalId([entry("61987"), entry("61988")]), null);
  assert.equal(matchMalId([entry("https://evil.example/")]), null);
});

test("accept only a plausible opening matched within one second of actual runtime", () => {
  assert.deepEqual(matchOpening(opening(), 1442.029), { start: 1.0217702, end: 91.07529, episodeLength: 1442.0288 });
  assert.equal(matchOpening(opening(), 1444), null); // AniSkip itself allows +/-20s
  assert.equal(matchOpening(opening({ episodeLength: 0 }), 1442.029), null);
  assert.equal(matchOpening(opening({ episodeLength: null }), 1442.029), null);
  assert.equal(matchOpening(opening({ skipType: "mixed-op" }), 1442.029), null);
  assert.equal(matchOpening(opening({ interval: { startTime: -1, endTime: 90 } }), 1442.029), null);
  assert.equal(matchOpening(opening({ interval: { startTime: 70, endTime: 69 } }), 1442.029), null);
  assert.equal(matchOpening(opening({ interval: { startTime: 1400, endTime: 1500 } }), 1442.029), null);
  assert.equal(matchOpening(opening({ interval: { startTime: 0, endTime: 200 } }), 1442.029), null);
  const conflicting = opening();
  conflicting.results.push({ ...conflicting.results[0], interval: { startTime: 2, endTime: 92 } });
  assert.equal(matchOpening(conflicting, 1442.029), null);
  assert.equal(validVideoDuration(Infinity), false);
  assert.equal(validVideoDuration(0), false);
});

test("look up an episode and its runtime with fixed hosts and no guessed fallback", async () => {
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push([url, options]);
    if (url.host === "kitsu.io" && !url.pathname.endsWith("/mappings")) return { ok: true, json: async () => ({ data: [kitsu()] }) };
    if (url.host === "kitsu.io") return { ok: true, json: async () => ({ data: [{ attributes: { externalSite: "myanimelist/anime", externalId: "61987" } }] }) };
    return { ok: true, json: async () => opening() };
  };
  assert.deepEqual(await findIntro({ stream: stream(), anime: anime(), episodeId: "322056", duration: 1442.029, fetcher }), {
    start: 1.0217702, end: 91.07529, episodeLength: 1442.0288, source: "AniSkip", episode: 7,
  });
  assert.deepEqual(calls.map(([url]) => url.origin), ["https://kitsu.io", "https://kitsu.io", "https://api.aniskip.com"]);
  assert.equal(calls[0][0].searchParams.get("filter[text]"), anime().title);
  assert.equal(calls[2][0].pathname, "/v2/skip-times/61987/7");
  assert.equal(calls[2][0].searchParams.get("types[]"), "op");
  assert.equal(calls[2][0].searchParams.get("episodeLength"), "1442.029");
  assert.equal(calls[0][1].next.revalidate, 3600);
  calls.length = 0;
  assert.equal(await findIntro({ stream: stream(), anime: anime(), episodeId: "322056", duration: 1444, fetcher }), null);
  calls.length = 0;
  assert.equal(await findIntro({ stream: stream(), anime: anime(), episodeId: "not-an-id", duration: 1442, fetcher }), null);
  assert.equal(calls.length, 0);
  await assert.rejects(() => findIntro({ stream: stream(), anime: anime(), episodeId: "322056", duration: 1442, fetcher: async () => ({ ok: false, status: 503 }) }), /tidak tersedia/);
});
