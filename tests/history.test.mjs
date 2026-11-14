import test from "node:test";
import assert from "node:assert/strict";
import { store } from "../lib/client.js";
import { continueWatching, historyId, isCompletedHistory } from "../lib/history.mjs";
import { resumablePosition } from "../lib/player.mjs";

test("resume accepts the last seconds of a video but not completed or invalid positions", () => {
  assert.equal(resumablePosition(17, 20), 17);
  assert.equal(resumablePosition(119, 120), 119);
  assert.equal(resumablePosition("15", "20"), 15);
  assert.equal(resumablePosition(20, 20), 0);
  assert.equal(resumablePosition(21, 20), 0);
  assert.equal(resumablePosition(0, 20), 0);
  assert.equal(resumablePosition(-1, 20), 0);
  assert.equal(resumablePosition(NaN, 20), 0);
  assert.equal(resumablePosition(true, 20), 0);
  assert.equal(resumablePosition(5, null), 0);
});

test("history retains episode metadata and saves exact whole-second progress", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } });
  t.after(() => original ? Object.defineProperty(globalThis, "localStorage", original) : delete globalThis.localStorage);

  store.pushHistory({ episodeId: "12", animeId: "3", animeTitle: "Anime Uji", episodeIndex: 4 });
  store.saveProgress("12", 19.9, 20);
  assert.equal(store.getProgress("12"), 19, "the last seconds still resume");
  store.pushHistory({ episodeId: "12", animeId: "3", animeTitle: "Anime Uji", episodeIndex: 4 });
  assert.equal(store.getProgress("12"), 19, "visiting the episode does not erase its progress");
  assert.equal(store.read("history")[0].animeTitle, "Anime Uji");

  store.saveProgress("12", 20, 20);
  assert.equal(store.getProgress("12"), 0, "a completed video starts again");
  assert.equal(store.read("history")[0].progress, 20);
  store.saveProgress("12", 0, 20);
  assert.equal(store.getProgress("12"), 0, "seeking to the start clears the old position");
  store.saveProgress("12", NaN, 20);
  assert.equal(store.read("history")[0].progress, 0);

  store.saveProgress("12", 20.1, 20.2);
  assert.equal(store.getProgress("12"), 20, "fractional-duration media can resume in its final second");
  assert.equal(store.read("history")[0].duration, 20.2, "history displays the same duration as the player");
  store.saveProgress("12", 20.2, 20.2);
  assert.equal(store.getProgress("12"), 0, "a fractional-duration video is complete at its actual end");
  assert.equal(store.read("history")[0].progress, 20.2);
});

test("continue watching uses the latest episode per anime and only resumable direct progress", () => {
  const history = [
    { episodeId: "a2", animeId: "a", progress: 20, duration: 20 },
    { episodeId: "a1", animeId: "a", progress: 10, duration: 20 },
    { episodeId: "b2", animeId: "b" }, // recently opened embed or not yet played
    { episodeId: "b1", animeId: "b", progress: 8, duration: 20 },
    { episodeId: "c1", animeId: "c", progress: 19, duration: 20 },
    { episodeId: "d1", animeId: "d", progress: "8", duration: "20" },
    { episodeId: "e1", progress: 4, duration: 20 },
    { episodeId: "f1", animeId: "f", progress: 1, duration: 20 },
    { episodeId: "g1", animeId: "g", progress: 3, duration: 20 },
    null,
    { episodeId: {}, animeId: "bad", progress: 3, duration: 20 },
  ];
  assert.deepEqual(continueWatching(history).map((item) => item.episodeId), ["c1", "d1", "e1", "f1"]);
  assert.deepEqual(continueWatching(history, 2).map((item) => item.episodeId), ["c1", "d1"]);
  assert.deepEqual(continueWatching(history, 0), []);
  assert.deepEqual(continueWatching(null), []);
  assert.equal(historyId(true), "");
  assert.equal(historyId({}), "");
  assert.equal(historyId(" 123 "), "123");
  assert.equal(isCompletedHistory({ progress: 20.2, duration: 20.2 }), true);
  assert.equal(isCompletedHistory({ progress: "20", duration: "20" }), true);
  assert.equal(isCompletedHistory({ progress: 21, duration: 20 }), false);
  assert.equal(isCompletedHistory({ progress: 0, duration: 0 }), false);
  assert.equal(isCompletedHistory({ progress: true, duration: 1 }), false);
});

test("completion marks survive replay and history trimming, while deletion clears them", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } });
  t.after(() => original ? Object.defineProperty(globalThis, "localStorage", original) : delete globalThis.localStorage);

  store.pushHistory({ episodeId: "1", animeId: "a", animeTitle: "Anime" });
  store.saveProgress("1", 19, 20);
  assert.equal(store.completedEpisodeIds().has("1"), false, "partial playback is not completed");
  store.saveProgress("1", 20, 20);
  assert.equal(store.completedEpisodeIds().has("1"), true);
  store.saveProgress("1", 3, 20);
  assert.equal(store.completedEpisodeIds().has("1"), true, "replaying does not erase completion");
  assert.equal(store.getProgress("1"), 3, "replay can still be resumed");

  for (let number = 2; number <= 70; number += 1) store.pushHistory({ episodeId: String(number), animeId: "a" });
  assert.equal(store.read("history").length, 60);
  assert.equal(store.read("history").some((item) => item.episodeId === "1"), false);
  assert.equal(store.completedEpisodeIds().has("1"), true, "old completion survives the history cap");
  store.removeHistory("1");
  assert.equal(store.completedEpisodeIds().has("1"), false);

  store.pushHistory({ episodeId: "71", animeId: "a" });
  store.saveProgress("71", 20, 20);
  store.clearHistory();
  assert.deepEqual(store.read("history"), []);
  assert.equal(store.completedEpisodeIds().size, 0, "clearing history also clears completion marks");
});

test("legacy completed progress becomes a lasting mark before replay or trimming", (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  } });
  t.after(() => original ? Object.defineProperty(globalThis, "localStorage", original) : delete globalThis.localStorage);

  store.write("history", [
    { episodeId: "old-1", animeId: "a", progress: 20, duration: 20 },
    { episodeId: "old-2", animeId: "a", progress: 24.5, duration: 24.5 },
  ]);
  assert.deepEqual([...store.completedEpisodeIds()].sort(), ["old-1", "old-2"]);
  store.saveProgress("old-1", 0, 20);
  assert.equal(store.completedEpisodeIds().has("old-1"), true, "legacy completion survives replay");
  store.pushHistory({ episodeId: "new", animeId: "a" });
  assert.equal(store.read("watched").includes("old-2"), true, "legacy completion is migrated before history trimming");
  store.removeHistory("old-2");
  assert.equal(store.completedEpisodeIds().has("old-2"), false);
});
