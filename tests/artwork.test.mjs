import test from "node:test";
import assert from "node:assert/strict";
import { findArtwork, matchArtwork } from "../lib/artwork.mjs";

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
