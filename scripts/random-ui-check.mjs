// Run against a local Next.js server. Provider responses are fixtures;
// RANDOM_TEST_DEMO=1 also exercises the server's actual explicit demo mode.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";

const base = (process.env.RANDOM_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const origin = new URL(base).origin;
const image = "/images/poster-unavailable.svg";
const longTitle = `Judul Anime ${"Panjang".repeat(35)}`;
const items = [
  { id: "101", title: "Anime Pertama", image_poster: image, type: "SERIES", year: "2026", aired_start: "2012-04-01", status: "FINISHED", genre: "Action, Adventure", synopsis: "Sebuah cerita untuk pengujian." },
  { id: "102", title: longTitle, image_poster: image, type: "MOVIE", status: "ONGOING", genre: "Comedy, Fantasy", synopsis: "Sinopsis panjang untuk memastikan kartu tetap nyaman dibaca pada layar kecil dan dalam kedua tema." },
  { id: "103", title: "Anime Ketiga", image_poster: image },
  { id: "101", title: "Duplikat" }, { id: "bad/id", title: "ID tidak valid" }, { id: "104", title: "" },
];
const home = { episode_baru: [{ id: "201", title: "Anime Beranda", image_cover: image, latest_episode: "Episode 2" }], paling_populer: [], sedang_hangat: [], judul_baru: [] };
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 320, height: 860 }, isMobile: true, hasTouch: true });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.addInitScript(() => { Math.random = () => 0; });

let mode = "delayed";
let randomRequests = 0;
let homeError = false;
let releaseDelayed;
const delayed = new Promise((resolve) => { releaseDelayed = resolve; });
let releaseCanceled;
const canceled = new Promise((resolve) => { releaseCanceled = resolve; });

// Do not rely on provider hosts, images, or fonts in these UI tests.
await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
await page.route("**/api/artwork?**", (route) => route.fulfill({ json: { status: 200, data: null } }));
await page.route("**/api/home", (route) => homeError ? route.fulfill({ status: 503, json: { status: 503, message: "Beranda tidak tersedia" } }) : route.fulfill({ json: { status: 200, data: home } }));
await page.route("**/api/genres", (route) => route.fulfill({ json: { status: 200, data: [] } }));
await page.route("**/api/years", (route) => route.fulfill({ json: { status: 200, data: [] } }));
await page.route("**/api/detail/**", (route) => {
  const id = new URL(route.request().url()).pathname.split("/").at(-1);
  const anime = items.find((item) => item.id === id);
  return route.fulfill({ json: { status: 200, data: { ...anime, episodes: [], seasons: [] } } });
});
await page.route("**/api/home-section?**", async (route) => {
  const url = new URL(route.request().url());
  assert.equal(url.searchParams.get("section"), "acak");
  assert.equal(url.searchParams.get("limit"), "100");
  randomRequests++;
  if (mode === "delayed") await delayed;
  if (mode === "cancel") {
    await canceled;
    try { await route.fulfill({ json: { status: 200, data: items } }); } catch { /* request was aborted on navigation */ }
    return;
  }
  if (mode === "error") return route.fulfill({ status: 503, json: { status: 503, message: "Provider down" } });
  if (mode === "malformed") return route.fulfill({ json: { status: 200, data: { unexpected: true } } });
  const result = mode === "empty" ? [] : mode === "invalid" ? [{ id: "../bad", title: "Tidak valid" }] : mode === "single" ? [items[0]] : items;
  return route.fulfill({ json: { status: 200, data: result } });
});

const section = () => page.getByRole("region", { name: "Anime Acak" });
const detailLink = () => section().getByRole("link", { name: "Lihat Detail" });
const action = (name) => section().getByRole("button", { name, exact: true });
const selectedHref = () => detailLink().getAttribute("href");

try {
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await action("Cari Anime Acak").waitFor();
  assert.equal(randomRequests, 0, "the random pool is fetched only on request");
  const requestStarted = page.waitForRequest((request) => request.url().includes("/api/home-section?"));
  await action("Cari Anime Acak").tap();
  await requestStarted;
  await action("Mencari...").waitFor();
  assert.equal(await action("Mencari...").isDisabled(), true);
  await section().getByText("Mencari anime untukmu...").waitFor();
  await action("Mencari...").evaluate((button) => button.click());
  assert.equal(randomRequests, 1, "a pending request cannot be duplicated");
  releaseDelayed();
  await section().getByRole("heading", { name: "Anime Pertama" }).waitFor();
  assert.equal(await selectedHref(), "/anime/101");
  assert.equal(await section().locator("img").getAttribute("src"), image);
  assert.equal(await section().getByText("SERIES · Tayang 2012 · Selesai").count(), 1, "the airing date, not the provider's update-year category, is shown");
  assert.equal(await section().getByText("Data demo", { exact: false }).count(), 0);
  assert.equal(await section().locator('[aria-live="polite"]').textContent(), "Pilihan anime: Anime Pertama");

  await action("Acak Lagi").focus();
  await page.keyboard.press("Enter");
  await section().getByRole("heading", { name: longTitle }).waitFor();
  assert.equal(await selectedHref(), "/anime/102", "a different valid title is selected on repeat");

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; document.documentElement.style.colorScheme = value; }, theme);
    for (const width of [320, 360, 375, 520, 768, 1024, 1200]) {
      await page.setViewportSize({ width, height: 860 });
      const layout = await section().evaluate((element) => {
        const rect = (node) => { const { left, right } = node.getBoundingClientRect(); return { left, right }; };
        return {
          scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
          section: rect(element), button: rect(element.querySelector("button")), title: rect(element.querySelector("h3")),
        };
      });
      const label = `${theme} at ${width}px`;
      assert.equal(layout.scrollWidth, layout.clientWidth, `page overflow: ${label}`);
      assert.ok(layout.button.left >= layout.section.left && layout.button.right <= layout.section.right, `button outside card: ${label}`);
      assert.ok(layout.title.left >= layout.section.left && layout.title.right <= layout.section.right, `title outside card: ${label}`);
    }
  }
  await page.setViewportSize({ width: 320, height: 860 });
  let previous = await selectedHref();
  for (let i = 0; i < 12; i++) {
    await action("Acak Lagi").tap();
    const next = await selectedHref();
    assert.notEqual(next, previous, "consecutive selections must differ when alternatives exist");
    previous = next;
  }
  await page.evaluate(() => { Math.random = () => 0.999; });
  await action("Acak Lagi").tap();
  assert.equal(await selectedHref(), "/anime/103", "later candidates are reachable");
  assert.equal(randomRequests, 1, "repeated draws reuse the fetched pool");
  console.log("PASS lazy loading, mobile and keyboard actions, no immediate repeats, and responsive light/dark layouts");

  mode = "error";
  await page.reload({ waitUntil: "domcontentloaded" });
  await action("Cari Anime Acak").tap();
  await section().getByText("Anime acak belum bisa dimuat. Coba lagi.").waitFor();
  assert.equal(await detailLink().count(), 0);
  mode = "empty";
  await action("Coba Lagi").tap();
  await section().getByText("Belum ada anime acak yang tersedia. Coba lagi nanti.").waitFor();
  mode = "invalid";
  const invalidResponse = page.waitForResponse((response) => response.url().includes("/api/home-section?"));
  await action("Coba Lagi").tap();
  await invalidResponse;
  await section().getByText("Belum ada anime acak yang tersedia. Coba lagi nanti.").waitFor();
  mode = "malformed";
  await action("Coba Lagi").tap();
  await section().getByText("Anime acak belum bisa dimuat. Coba lagi.").waitFor();
  mode = "valid";
  await action("Coba Lagi").tap();
  await section().getByRole("heading", { name: "Anime Pertama" }).waitFor();
  assert.equal(await section().getByText("Anime acak belum bisa dimuat. Coba lagi.").count(), 0);
  await detailLink().tap();
  await page.waitForURL("**/anime/101");
  await page.getByRole("heading", { name: "Anime Pertama", level: 1 }).waitFor();
  console.log("PASS error, empty and malformed responses, retry, and detail navigation");

  mode = "single";
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await action("Cari Anime Acak").tap();
  await section().getByRole("heading", { name: "Anime Pertama" }).waitFor();
  await section().getByText("Saat ini hanya satu pilihan yang tersedia.").waitFor();
  await action("Acak Lagi").tap();
  assert.equal(await selectedHref(), "/anime/101", "a single valid candidate remains usable");

  mode = "cancel";
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.setViewportSize({ width: 1200, height: 860 });
  const canceledRequest = page.waitForEvent("requestfailed", { predicate: (request) => request.url().includes("/api/home-section?"), timeout: 10000 });
  const requestBeforeLeaving = page.waitForRequest((request) => request.url().includes("/api/home-section?"));
  await action("Cari Anime Acak").click();
  await requestBeforeLeaving;
  await page.locator('#navbar a[href="/history"]').click();
  await page.waitForURL("**/history");
  assert.match((await canceledRequest).failure().errorText, /aborted/i, "leaving the page cancels an outstanding random request");
  releaseCanceled();

  await page.evaluate(() => localStorage.setItem("nihnime:history", JSON.stringify([{ animeId: "201", episodeId: "1001", episodeIndex: "1", animeTitle: "Anime Riwayat", progress: 30, duration: 90 }])));
  homeError = true;
  mode = "valid";
  await page.goto(`${base}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("alert").getByText("Beranda tidak tersedia").waitFor();
  await page.getByRole("link", { name: "Lanjutkan Anime Riwayat, Episode 1, dari 00:30" }).waitFor();
  await action("Cari Anime Acak").tap();
  await section().getByRole("heading", { name: "Anime Pertama" }).waitFor();
  homeError = false;
  await page.getByRole("alert").getByRole("button", { name: "Coba lagi" }).tap();
  await page.getByRole("heading", { name: "Episode Terbaru" }).waitFor();
  await page.getByRole("link", { name: "Lanjutkan Anime Riwayat, Episode 1, dari 00:30" }).waitFor();
  console.log("PASS single-title pool, canceled requests, and discovery plus local continue-watching when the home feed fails");

  assert.deepEqual(errors, [], "no browser runtime errors");
  if (process.env.RANDOM_TEST_DEMO === "1") {
    const demoContext = await browser.newContext({ viewport: { width: 375, height: 850 } });
    const demo = await demoContext.newPage();
    const demoErrors = [];
    demo.on("pageerror", (error) => demoErrors.push(error.message));
    await demo.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    await demo.route("**/api/artwork?**", (route) => route.fulfill({ json: { status: 200, data: null } }));
    await demo.goto(`${base}/`, { waitUntil: "domcontentloaded" });
    await demo.getByText("Mode demo aktif", { exact: false }).waitFor();
    const demoSection = demo.getByRole("region", { name: "Anime Acak" });
    await demoSection.getByRole("button", { name: "Cari Anime Acak" }).click();
    await demoSection.getByText("Data demo · contoh anime").waitFor();
    const demoLink = demoSection.getByRole("link", { name: "Lihat Detail" });
    assert.match(await demoLink.getAttribute("href"), /^\/anime\/demo-\d+$/);
    const demoTitle = await demoSection.locator("h3").innerText();
    await demoLink.click();
    await demo.waitForURL("**/anime/demo-*");
    await demo.getByRole("heading", { name: demoTitle, level: 1 }).waitFor();
    await demo.getByText("Mode demo aktif", { exact: false }).waitFor();
    assert.deepEqual(demoErrors, []);
    await demoContext.close();
    console.log("PASS actual demo API, sample labeling, and demo detail navigation");
  }
} finally {
  await browser.close();
}
