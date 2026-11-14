import test from "node:test";
import assert from "node:assert/strict";
import { isDirectVideoServer } from "../lib/player.mjs";

test("direct video and embedded/semi servers use different players", () => {
  assert.equal(isDirectVideoServer({ type: "direct", url: "https://cdn.example/video.mp4?token=1" }), true);
  assert.equal(isDirectVideoServer({ type: "semi", url: "https://example/video.mp4?embed=true" }), false);
  assert.equal(isDirectVideoServer({ type: "embed", url: "https://example/embed/1" }), false);
  assert.equal(isDirectVideoServer({ url: "https://example/video.WEBM?token=1" }), true);
  assert.equal(isDirectVideoServer({ url: "https://example/video.mp4?embed=true" }), false);
  assert.equal(isDirectVideoServer({ url: "https://example/embed/1" }), false);
  assert.equal(isDirectVideoServer(null), false);
});
