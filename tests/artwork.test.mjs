import test from "node:test";
import assert from "node:assert/strict";
import { findArtwork, matchArtwork } from "../lib/artwork.mjs";
import { artworkYear } from "../lib/artwork-utils.mjs";

function entry(title, year, poster = "https://media.kitsu.app/anime/1/medium.jpg", cover = null) {
  return { attributes: { canonicalTitle: title, titles: { en_jp: title }, startDate: `${year}-10-01`, posterImage: { medium: poster }, coverImage: cover ? { large: cover } : null } };
}

test("artwork fallback matches title and known year without mixing seasons or lookalikes", () => {
  const results = [entry("Keroro Gunsou", "2004"), entry("Keroro Gunsou☆", "2026"), entry("Keroro Gunsou☆ 2", "2028")];
  assert.deepEqual(matchArtwork(results, "Keroro Gunsou☆", "2026"), { poster: "https://media.kitsu.app/anime/1/medium.jpg", cover: "https://media.kitsu.app/anime/1/medium.jpg" });
  assert.equal(matchArtwork(results, "Keroro Gunsou☆", "2004"), null);
  assert.equal(matchArtwork(results, "Keroro Gunsou", "2026"), null);
  assert.equal(matchArtwork([entry("Anime 2nd Season", "2025")], "Anime 3rd Season", "2025"), null);
});

test("artwork fallback ignores untrusted image hosts and handles alternate titles", () => {
  const results = [{ attributes: {
    canonicalTitle: "The Example", titles: { en_jp: "Example: Third Season" }, startDate: "2026-01-01",
    posterImage: { medium: "https://evil.example/poster.jpg", original: "https://media.kitsu.app/anime/1/original.jpg" },
    coverImage: { large: "https://media.kitsu.app/anime/1/cover.jpg" },
  } }];
  assert.deepEqual(matchArtwork(results, "Example Third Season", "2026"), { poster: "https://media.kitsu.app/anime/1/original.jpg", cover: "https://media.kitsu.app/anime/1/cover.jpg" });
  assert.equal(matchArtwork([entry("Example", "2026", "http://media.kitsu.app/no.jpg")], "Example", "2026"), null);
});

test("use the first airing year rather than AnimeIn's later update year", () => {
  const examples = [
    { title: "Black Clover", year: "2021", aired_start: "2017-10-03" },
    { title: "Naruto: Shippuuden", year: "2025", aired_start: "2007-02-15" },
    { title: "Boruto: Naruto Next Generations", year: "2024", aired_start: "2017-04-05" },
  ];
  assert.deepEqual(examples.map((anime) => artworkYear(anime.aired_start)), ["2017", "2007", "2017"]);
  assert.equal(artworkYear(null), "");
  assert.equal(artworkYear("0000-00-00"), "");
  assert.equal(artworkYear("unknown"), "");
});

test("an unknown release year never chooses between same-title remakes", () => {
  const results = [entry("Same Title", "2001"), entry("Same Title", "2026")];
  assert.equal(matchArtwork(results, "Same Title", ""), null);
  assert.notEqual(matchArtwork(results, "Same Title", "2001"), null);
  assert.notEqual(matchArtwork([entry("Unique Title", "2001")], "Unique Title", ""), null);
});

test("artwork lookup queries the fixed metadata service and handles upstream errors", async () => {
  const calls = [];
  const fetcher = async (url, options) => { calls.push([url, options]); return { ok: true, json: async () => ({ data: [entry("Sample", "2026")] }) }; };
  const found = await findArtwork("Sample", "2026", fetcher);
  assert.equal(found.poster, "https://media.kitsu.app/anime/1/medium.jpg");
  assert.equal(calls[0][0].origin, "https://kitsu.io");
  assert.equal(calls[0][0].searchParams.get("filter[text]"), "Sample");
  assert.equal(calls[0][1].next.revalidate, 300);
  await assert.rejects(() => findArtwork("Sample", "2026", async () => ({ ok: false })), /tidak tersedia/);
});
