import test from "node:test";
import assert from "node:assert/strict";
import { findFirstInitialPage, startsWithInitial, titleInitial } from "../lib/az.mjs";

test("A–Z locates the first sorted page containing the initial, not just substring matches", async () => {
  const pages = [
    [{ title: "A-Z" }, { title: "Breeze" }],
    [{ title: "Fuzz" }, { title: "Jazz" }],
    [{ title: "Yozakura" }, { title: "Zatch" }],
    [{ title: "Zom 100" }, { title: "Zutto" }],
  ];
  let calls = 0;
  const first = await findFirstInitialPage(async (page) => { calls++; return pages[page] || []; }, "Z");
  assert.equal(first, 2);
  assert.deepEqual(pages[first].filter((item) => startsWithInitial(item, "z")).map((item) => item.title), ["Zatch"]);
  assert.ok(calls <= 6);
  assert.equal(titleInitial("  apple"), "A");
  assert.equal(startsWithInitial({ title: "A to Z" }, "Z"), false);
});

test("A–Z handles empty results and validates the initial", async () => {
  assert.equal(await findFirstInitialPage(async () => [], "A"), 0);
  assert.equal(await findFirstInitialPage(async (page) => page === 0 ? [{ title: "1 anime" }] : [], "0"), 0);
  await assert.rejects(() => findFirstInitialPage(async () => [], "!!"), /Huruf/);
});
