import test from "node:test";
import assert from "node:assert/strict";
import { availableEpisodeCount, dayLabel, episodeChoices, groupGenres, hasText, jakartaDay, scoreLabel, sortYears, statusLabel } from "../lib/display.mjs";

test("presentation hides unavailable data and labels known status without inventing a score", () => {
  assert.equal(hasText("UNKNOWN"), false);
  assert.equal(hasText("-"), false);
  assert.equal(statusLabel("ONGOING"), "Sedang Tayang");
  assert.equal(statusLabel("FINISHED"), "Selesai");
  assert.equal(statusLabel("UNKNOWN"), "");
  assert.equal(statusLabel("Hiatus"), "Hiatus");
  assert.equal(scoreLabel(null), "");
  assert.equal(scoreLabel("N/A"), "");
  assert.equal(scoreLabel("0"), "");
  assert.equal(scoreLabel("8.4"), "8.4");
});

test("genre groups and year categories remain distinct and ordered", () => {
  const groups = groupGenres([{ name: "School", group: "Theme" }, { name: "Shounen", group: "Demographic" }, { name: "Drama", group: "Genre" }, { name: "Action", group: "Genre" }, { name: "Other" }]);
  assert.deepEqual(groups.map((group) => group.label), ["Genre", "Tema", "Demografi", "Lainnya"]);
  assert.deepEqual(groups[0].items.map((genre) => genre.name), ["Action", "Drama"]);
  assert.deepEqual(sortYears([{ name: "UNKNOWN" }, { name: "2000an" }, { name: "2022" }, { name: "2026" }]).map((year) => year.name), ["2026", "2022", "2000an", "UNKNOWN"]);
});

test("episode choices distinguish a partial descending list from episode one", () => {
  const episodes = Array.from({ length: 30 }, (_, index) => ({ id: String(500 - index), index: 500 - index }));
  assert.equal(availableEpisodeCount({ episodes, episode_total: null }), "≥30");
  assert.equal(availableEpisodeCount({ episodes: [], episodes_error: "offline" }), null);
  assert.equal(availableEpisodeCount({ episodes: [], episode_total: 0 }), "0");
  assert.deepEqual(episodeChoices({ episodes }), { first: null, latest: episodes[0] });
  const first = { id: "1", index: 1 };
  assert.equal(episodeChoices({ episodes, episode_detail: first }).first, first);
  assert.equal(episodeChoices({ episodes: [episodes[0], first] }).first, first);
});

test("schedule uses Jakarta weekday and labels random separately", () => {
  assert.equal(jakartaDay(new Date("2026-11-13T18:00:00Z")), "SABTU");
  assert.equal(dayLabel("RANDOM"), "Acak");
  assert.equal(dayLabel("SENIN"), "Senin");
});
