import test from "node:test";
import assert from "node:assert/strict";
import { demoHome } from "../lib/demo.js";
import { chooseRandomAnime, randomCandidates } from "../lib/random.mjs";

test("random candidates use valid provider IDs, deduplicate and retain marked demo titles", () => {
  const candidates = randomCandidates([
    null, {}, { id: 0, title: "Zero" }, { id: -1, title: "Negative" },
    { id: "../123", title: "Invalid path" }, { id: "abc", title: "Invalid ID" },
    { id: 123.5, title: "Not an integer" }, { id: Number.MAX_SAFE_INTEGER + 1, title: "Unsafe number" },
    { id: "4", title: " " }, { id: "5", title: "Unknown" }, { id: "6", title: { text: "Not a title" } },
    { id: "demo-1", title: "Unmarked demo" }, { id: "demo-0", title: "Invalid demo", demo: true },
    { id: 123, title: "  Anime pertama  ", genre: "Action" },
    { id: "123", title: "Duplicate" }, { id: "00123", title: "Duplicate with leading zeroes" },
    { id: "456", title: "Anime kedua" },
    { id: "demo-2", title: "Contoh", demo: true },
  ]);
  assert.deepEqual(candidates.map(({ id, title }) => [id, title]), [
    ["123", "Anime pertama"], ["456", "Anime kedua"], ["demo-2", "Contoh"],
  ]);
  assert.equal(candidates[0].genre, "Action");
  assert.deepEqual(randomCandidates(null), []);
  assert.deepEqual(randomCandidates({ data: [] }), []);
});

test("random selection draws across the pool and avoids the previous title when possible", () => {
  const candidates = randomCandidates([{ id: "1", title: "Satu" }, { id: "2", title: "Dua" }, { id: "3", title: "Tiga" }]);
  assert.equal(chooseRandomAnime(candidates, "", () => 0).id, "1");
  assert.equal(chooseRandomAnime(candidates, "", () => 0.999).id, "3");
  assert.equal(chooseRandomAnime(candidates, "1", () => 0).id, "2");
  assert.equal(chooseRandomAnime(candidates, 1, () => 0.999).id, "3");
  assert.equal(chooseRandomAnime([candidates[0]], "1", () => 0).id, "1");
  assert.equal(chooseRandomAnime([], "1", () => 0), null);
  assert.equal(chooseRandomAnime(null), null);
  assert.equal(chooseRandomAnime(candidates, "", () => 1).id, "3");
  assert.equal(chooseRandomAnime(candidates, "", () => -1).id, "1");
  assert.equal(chooseRandomAnime(candidates, "", () => NaN).id, "1");
});

test("the demo random pool is explicitly marked and links to demo IDs", () => {
  const pool = randomCandidates(demoHome().acak);
  assert.ok(pool.length > 1);
  assert.ok(pool.every((anime) => anime.demo === true && /^demo-\d+$/.test(anime.id)));
  const first = chooseRandomAnime(pool, "", () => 0);
  const next = chooseRandomAnime(pool, first.id, () => 0);
  assert.notEqual(first.id, next.id);
});
