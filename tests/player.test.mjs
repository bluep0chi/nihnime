import test from "node:test";
import assert from "node:assert/strict";
import { isDirectVideoServer, preferredServerIndex, safeMediaUrl } from "../lib/player.mjs";

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
