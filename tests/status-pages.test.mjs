import test from "node:test";
import assert from "node:assert/strict";
import { collectStatusPage, formatStatusCursor, matchesStatus, parseStatusCursor, parseStatusTrail } from "../lib/status-pages.mjs";

const rawPage = (page, matchEvery = 3) => Array.from({ length: 30 }, (_, offset) => ({ id: page * 30 + offset, status: (page * 30 + offset) % matchEvery === 0 ? "ONGOING" : "FINISHED" }));

test("status pages fill across upstream pages without skipping or repeating matches", async () => {
  const fetchPage = async (page) => page < 5 ? rawPage(page) : [];
  const first = await collectStatusPage(fetchPage, "ongoing");
  assert.equal(first.items.length, 30);
  assert.deepEqual(first.nextCursor, { page: 2, offset: 28 });
  const second = await collectStatusPage(fetchPage, "ongoing", first.nextCursor);
  assert.equal(second.items.length, 20);
  assert.equal(second.nextCursor, null);
  assert.deepEqual([...first.items, ...second.items].map((item) => item.id), Array.from({ length: 50 }, (_, i) => i * 3));
});

test("a bounded sparse scan gives a resumable cursor and accepts known status aliases", async () => {
  const seen = [];
  const result = await collectStatusPage(async (page) => { seen.push(page); return rawPage(page).map((item) => ({ ...item, status: "UNKNOWN" })); }, "completed", { page: 4, offset: 0 }, { maxPages: 2 });
  assert.deepEqual(seen, [4, 5]);
  assert.deepEqual(result, { items: [], nextCursor: { page: 6, offset: 0 }, scanLimitReached: true });
  assert.equal(matchesStatus({ status: "COMPLETED" }, "completed"), true);
  assert.equal(matchesStatus({ status: "UNKNOWN" }, "completed"), false);
});

test("cursor and navigation trail validation", () => {
  assert.deepEqual(parseStatusCursor("12.4"), { page: 12, offset: 4 });
  assert.equal(formatStatusCursor({ page: 12, offset: 4 }), "12.4");
  assert.equal(parseStatusCursor("1.30"), null);
  assert.equal(parseStatusCursor("-1.0"), null);
  assert.deepEqual(parseStatusTrail("0.0,2.28"), [{ page: 0, offset: 0 }, { page: 2, offset: 28 }]);
  assert.deepEqual(parseStatusTrail("0.0,bad"), []);
});
