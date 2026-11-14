import test from "node:test";
import assert from "node:assert/strict";
import { store } from "../lib/client.js";
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
