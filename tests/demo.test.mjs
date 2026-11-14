import test from "node:test";
import assert from "node:assert/strict";
import { demoDetail, demoEpisodes, demoHome, demoList, demoSchedule, demoStream } from "../lib/demo.js";

test("demo uses explicit IDs, coherent episodes and a clearly marked sample", () => {
  const home = demoHome();
  assert.equal(home.demo, true);
  assert.ok(home.episode_baru.every((item) => String(item.id).startsWith("demo-") && item.demo));
  const detail = demoDetail("demo-1");
  assert.equal(detail.episodes.length, 24);
  assert.equal(detail.episodes[0].index, 24);
  assert.deepEqual(demoEpisodes("demo-1", 0, "Episode 2").map((ep) => ep.index), [24, 23, 22, 21, 20, 2]);
  assert.equal(demoEpisodes("demo-1", 1).length, 0);
  const stream = demoStream("demo-1001");
  assert.equal(stream.episode.id_movie, "demo-1");
  assert.equal(stream.episode_next.index, 2);
  assert.equal(stream.demo, true);
  assert.throws(() => demoDetail("341"), /tidak tersedia/);
  assert.throws(() => demoEpisodes("341"), /tidak tersedia/);
  assert.throws(() => demoStream("5018"), /tidak tersedia/);
  assert.throws(() => demoStream("demo-1099"), /tidak tersedia/);
});

test("demo listing supports search, pagination and known filters", () => {
  assert.deepEqual(demoList({ keyword: "naruto" }).map((item) => item.id), ["demo-1"]);
  assert.equal(demoList({ page: 1 }).length, 0);
  assert.notEqual(demoSchedule("SENIN").SENIN[0].id, demoSchedule("SELASA").SELASA[0].id);
  assert.ok(demoList({ id_genre: "1" }).every((item) => item.genre.includes("Action")));
  assert.ok(demoList({ mode: "year", year: "2024" }).every((item) => item.year === 2024));
});

test("demo IDs require opt-in; opting in never rewrites real IDs to demo IDs", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.NIHNIME_DEMO;
  try {
    process.env.NIHNIME_DEMO = "0";
    const adapter = await import(`../lib/animein.js?demo-test=${Date.now()}`);
    await assert.rejects(adapter.getDetail("demo-1"), /demo tidak diaktifkan/i);
    await assert.rejects(adapter.getStream("demo-1001"), /demo tidak diaktifkan/i);
    await assert.rejects(adapter.getDetail("not-a-valid-id-341"), /ID tidak valid/i);
    await assert.rejects(adapter.getEpisodes("bad-341"), /ID anime tidak valid/i);
    await assert.rejects(adapter.getStream("bad-5018"), /ID episode tidak valid/i);
    await assert.rejects(adapter.getSchedule("INVALID"), /Hari tidak valid/i);
    process.env.NIHNIME_DEMO = "1";
    assert.equal((await adapter.getDetail("demo-1")).id, "demo-1");
    assert.equal((await adapter.getStream("demo-1001")).episode.id, "demo-1001");
    globalThis.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(adapter.getDetail("341"), /tidak tersedia untuk judul ini/i);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnv === undefined) delete process.env.NIHNIME_DEMO; else process.env.NIHNIME_DEMO = originalEnv;
  }
});
