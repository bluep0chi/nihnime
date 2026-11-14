import test from "node:test";
import assert from "node:assert/strict";
import { formatPlayerTime, isDirectVideoServer, isHlsUrl, preferredServerIndex, safeMediaUrl, usableIntro } from "../lib/player.mjs";

test("direct video and embedded/semi servers use different players", () => {
  assert.equal(isDirectVideoServer({ type: "direct", url: "https://cdn.example/video.mp4?token=1" }), true);
  assert.equal(isDirectVideoServer({ type: "semi", url: "https://example/video.mp4?embed=true" }), false);
  assert.equal(isDirectVideoServer({ type: "embed", url: "https://example/embed/1" }), false);
  assert.equal(isDirectVideoServer({ url: "https://example/video.WEBM?token=1" }), true);
  assert.equal(isDirectVideoServer({ url: "https://example/video.mp4?embed=true" }), false);
  assert.equal(isDirectVideoServer({ url: "https://example/embed/1" }), false);
  assert.equal(isDirectVideoServer(null), false);
});

test("player prefers 720p direct and falls back to a valid embed when necessary", () => {
  assert.equal(safeMediaUrl("javascript:alert(1)"), "");
  assert.equal(safeMediaUrl("//example.com/embed"), "https://example.com/embed");
  assert.equal(preferredServerIndex([{ url: "" }, { type: "semi", url: "https://example.com/embed" }]), 1);
  assert.equal(preferredServerIndex([{ type: "direct", quality: "1080p", url: "https://example.com/1080.mp4" }, { type: "direct", quality: "720p", url: "https://example.com/720.mp4" }]), 1);
  assert.equal(preferredServerIndex([{ type: "direct", quality: "360p", url: "https://example.com/360.mp4" }, { type: "direct", quality: "480p", url: "https://example.com/480.mp4" }]), 1);
});

test("player identifies HLS and formats real media time", () => {
  assert.equal(isHlsUrl("https://cdn.example/episode.M3U8?token=1"), true);
  assert.equal(isHlsUrl("https://cdn.example/episode.mp4"), false);
  assert.equal(formatPlayerTime(0), "00:00");
  assert.equal(formatPlayerTime(125.8), "02:05");
  assert.equal(formatPlayerTime(3601), "1:00:01");
  assert.equal(formatPlayerTime(Infinity), "--:--");
});

test("a stale intro cannot be reused for another episode or a different video duration", () => {
  const intro = { source: "AniSkip", episode: 7, start: 1.0217702, end: 91.07529, episodeLength: 1442.0288 };
  assert.equal(usableIntro(intro, 1442.029, "7"), true);
  assert.equal(usableIntro(intro, 1442.029, "6"), false);
  assert.equal(usableIntro(intro, 1444, "7"), false);
  assert.equal(usableIntro({ ...intro, end: 1443 }, 1442.029, "7"), false);
  assert.equal(usableIntro({ ...intro, source: "guess" }, 1442.029, "7"), false);
  assert.equal(usableIntro(null, 1442.029, "7"), false);
});
