// Run against a local Next.js server; API and media responses are fixtures.
// See README.md for installing Chromium or selecting an existing executable.
import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = (process.env.WATCH_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const origin = new URL(base).origin;
const fixture = await readFile(new URL("../tests/fixtures/watch-sample.mp4", import.meta.url));
const episode = (number) => ({ id: String(1000 + number), id_movie: "201", index: String(number), title: `Episode ${number}` });
const allEpisodes = Array.from({ length: 35 }, (_, index) => episode(35 - index));
let animeTitle = "Anime Uji";
let noServers = false;
let failFirstPage = false;
let failNextPage = false;
const servers = [
  { server_id: "a", name: "Server A Dengan Nama Sumber Yang Sangat Panjang", quality: "720p", type: "direct", url: `${base}/__watch-test__/sample.mp4` },
  { server_id: "b", name: "Embed", quality: "480p", type: "semi", url: `${base}/__watch-test__/embed` },
  { server_id: "c", name: "Rusak", quality: "360p", type: "direct", url: `${base}/__watch-test__/broken.mp4` },
];
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
const context = await browser.newContext({
  viewport: { width: 320, height: 860 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: "light",
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));

// Block external fonts/images and other third-party requests; the page still
// uses the local logo and an actual, tiny MP4 rather than a mocked video API.
await page.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
await page.route("**/api/stream/**", (route) => {
  const number = Number(new URL(route.request().url()).pathname.split("/").at(-1)) - 1000;
  return route.fulfill({ json: { status: 200, data: { episode: episode(number), episode_next: number < 3 ? episode(number + 1) : null, servers: noServers ? [] : servers } } });
});
await page.route("**/api/detail/**", (route) => route.fulfill({ json: { status: 200, data: {
  id: "201", title: animeTitle, type: "SERIES", episodes: [episode(3), episode(2), episode(1)], seasons: [],
} } }));
await page.route("**/api/episodes/**", async (route) => {
  const url = new URL(route.request().url());
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const pageNumber = Number(url.searchParams.get("page") || 0);
  if ((pageNumber === 0 && failFirstPage) || (pageNumber === 1 && failNextPage)) {
    failFirstPage = false;
    failNextPage = false;
    return route.fulfill({ status: 500, json: { status: 500, message: "Gagal memuat episode" } });
  }
  if (search === "1") await new Promise((resolve) => setTimeout(resolve, 1000));
  const filtered = allEpisodes.filter((item) => item.title.toLowerCase().includes(search));
  const result = filtered.slice(pageNumber * 30, (pageNumber + 1) * 30);
  // An upstream update may repeat the final item of the previous page.
  if (!search && pageNumber === 1 && result.length) result.unshift(filtered[pageNumber * 30 - 1]);
  try { return await route.fulfill({ json: { status: 200, data: result } }); }
  catch { /* A new search or navigation may cancel this request. */ }
});
await page.route("**/api/genres", (route) => route.fulfill({ json: { status: 200, data: [] } }));
await page.route("**/api/list?**", (route) => route.fulfill({ json: { status: 200, data: [] } }));
await page.route("**/api/artwork?**", (route) => route.fulfill({ json: { status: 200, data: null } }));
await page.route("**/api/intro/**", (route) => {
  const url = new URL(route.request().url());
  const number = Number(url.pathname.split("/").at(-1)) - 1000;
  if (number === 6) return route.fulfill({ json: { status: 200, data: null } });
  if (number === 7) return route.fulfill({ status: 500, json: { status: 500, message: "Intro unavailable" } });
  return route.fulfill({ json: { status: 200, data: {
    source: "AniSkip", episode: number, start: 2, end: 8, episodeLength: Number(url.searchParams.get("duration")),
  } } });
});
await page.route("**/__watch-test__/sample.mp4", (route) => {
  const range = route.request().headers().range?.match(/bytes=(\d+)-(\d*)/);
  const headers = { "accept-ranges": "bytes", "content-type": "video/mp4" };
  if (!range) return route.fulfill({ status: 200, headers, body: fixture });
  const start = Number(range[1]);
  const end = range[2] ? Math.min(Number(range[2]), fixture.length - 1) : fixture.length - 1;
  return route.fulfill({ status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${fixture.length}`, "content-length": String(end - start + 1) }, body: fixture.subarray(start, end + 1) });
});
await page.route("**/__watch-test__/embed", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<p>Embed pihak ketiga</p>" }));
await page.route("**/__watch-test__/broken.mp4", (route) => route.abort("failed"));

const video = () => page.locator("#video-player-video");
const metadata = () => page.waitForFunction(() => Number.isFinite(document.querySelector("#video-player-video")?.duration) && document.querySelector("#video-player-video").duration > 0);

try {
  await page.goto(`${base}/episode/1002?anime=201`, { waitUntil: "domcontentloaded" });
  await metadata();
  await page.getByText("Intro dari", { exact: false }).waitFor();
  assert.equal(await page.getByText("Progres video langsung disimpan di browser ini.", { exact: false }).count(), 0);
  assert.equal(await page.getByText("Intro belum tersedia atau tidak cocok", { exact: false }).count(), 0);
  assert.equal(await page.getByRole("button", { name: "Lewati Intro" }).count(), 0, "skip must not appear before the opening");
  await video().evaluate((element) => { element.currentTime = 3; });
  await page.getByRole("button", { name: "Lewati Intro" }).waitFor();
  assert.equal(await page.getByText("Sedang ditonton", { exact: true }).count(), 0);
  assert.equal(await page.locator(".watch-heading svg, .watch-credit-brand").count(), 0);
  const brand = page.locator(".ni-player-brand");
  assert.equal(await brand.count(), 1, "the NIHNIME branding is inside the player");
  assert.equal((await brand.innerText()).trim(), "NIHNIME", "the logo is labeled NIHNIME without PLAYER");
  assert.equal(await brand.locator("img").getAttribute("src"), "/images/logo.png");
  await page.waitForFunction(() => document.querySelector(".ni-player-brand img")?.naturalWidth > 0);
  assert.equal(await page.getByText("Dihadirkan oleh", { exact: false }).count(), 1);
  for (const link of await page.locator(".watch-episode-link").all()) assert.equal(await link.locator("svg").count(), 1, "episode navigation has a visible icon");
  await page.locator(".watch-episode-option.is-current").waitFor();

  for (const theme of ["light", "dark"]) {
    await page.evaluate((value) => { document.documentElement.dataset.theme = value; document.documentElement.style.colorScheme = value; }, theme);
    for (const width of [320, 360, 375, 520, 600, 768, 1024, 1200]) {
      await page.setViewportSize({ width, height: 860 });
      const layout = await page.evaluate(() => {
        const rect = (element) => {
          const { left, right, top, bottom } = element.getBoundingClientRect();
          return { left, right, top, bottom };
        };
        const player = document.querySelector(".ni-player");
        const toolbar = document.querySelector(".ni-player-toolbar");
        const brand = document.querySelector(".ni-player-brand");
        const source = document.querySelector(".ni-player-source");
        const allEpisodes = document.querySelector(".watch-episode-all strong");
        const currentTitle = document.querySelector(".watch-episode-option.is-current > span");
        const controls = [...toolbar.children].filter((element) => getComputedStyle(element).display !== "none" && element.matches("button, .ni-player-speed-wrap"));
        return {
          scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
          toolbarScroll: toolbar.scrollWidth, toolbarWidth: toolbar.clientWidth,
          player: rect(player), brand: rect(brand), source: rect(source), controls: controls.map(rect), center: rect(document.querySelector(".ni-player-center")), skip: rect(document.querySelector(".ni-player-skip")),
          allScroll: allEpisodes.scrollWidth, allWidth: allEpisodes.clientWidth, currentScroll: currentTitle.scrollWidth, currentWidth: currentTitle.clientWidth,
        };
      });
      const label = `${theme} at ${width}px`;
      assert.equal(layout.scrollWidth, layout.clientWidth, `page overflow: ${label}`);
      assert.ok(layout.toolbarScroll <= layout.toolbarWidth + 1, `player toolbar clipped: ${label}`);
      assert.ok(layout.controls.every((control) => control.left >= layout.player.left - 1 && control.right <= layout.player.right + 1), `control outside player: ${label}`);
      assert.ok(layout.brand.left >= layout.player.left && layout.source.right <= layout.player.right && layout.brand.right <= layout.source.left, `branding and server label overlap: ${label}`);
      assert.ok(layout.allScroll <= layout.allWidth + 1, `episode list label clipped: ${label}`);
      assert.ok(layout.currentScroll <= layout.currentWidth + 1, `current episode label clipped: ${label}`);
      const { center, skip } = layout;
      assert.ok(center.right <= skip.left || center.left >= skip.right || center.bottom <= skip.top || center.top >= skip.bottom, `play and skip overlap: ${label}`);
    }
  }
  console.log("PASS restored player branding, removed captions, and light/dark layouts at 320–1200px");

  await page.setViewportSize({ width: 320, height: 860 });
  await page.getByRole("link", { name: "Semua Episode" }).tap();
  await page.waitForFunction(() => location.hash === "#daftar-episode");
  await page.locator('.watch-episodes-grid a[href="/episode/1035?anime=201"]').waitFor();
  assert.equal(await page.locator('.watch-episodes-grid a[aria-current="page"]').count(), 1, "current episode remains visible even outside the first page");
  assert.equal(await page.locator(".watch-episode-option").count(), 31);
  failNextPage = true;
  await page.getByRole("button", { name: "Muat episode lainnya" }).tap();
  await page.getByRole("alert").getByText("Gagal memuat episode").waitFor();
  await page.getByRole("button", { name: "Coba lagi" }).tap();
  await page.locator('.watch-episodes-grid a[href="/episode/1001?anime=201"]').waitFor();
  assert.equal(await page.locator(".watch-episode-option").count(), 35, "loading the next page does not duplicate the pinned current episode");
  const search = page.getByLabel("Cari episode");
  const slowSearch = page.waitForRequest((request) => request.url().includes("/api/episodes/") && new URL(request.url()).searchParams.get("search") === "1");
  await search.fill("1");
  await slowSearch;
  await search.fill("35");
  await page.locator('.watch-episodes-grid a[href="/episode/1035?anime=201"]').waitFor();
  await page.waitForTimeout(1100);
  assert.equal(await page.locator(".watch-episode-option").count(), 1, "a stale search response must not replace newer results");
  failFirstPage = true;
  await search.fill("tidak ada");
  await page.getByRole("alert").getByText("Gagal memuat episode").waitFor();
  await page.getByRole("button", { name: "Coba lagi" }).tap();
  await page.getByText("Episode tidak ditemukan.").waitFor();
  await search.fill("");
  await page.locator('.watch-episodes-grid a[href="/episode/1035?anime=201"]').waitFor();
  console.log("PASS in-page episode list, deduplication, retries, and search races");

  await page.locator(".ni-player-center").tap(); // The transparent control gradient must not intercept this tap.
  await page.waitForFunction(() => !document.querySelector("#video-player-video").paused);
  await page.getByRole("button", { name: "Jeda video" }).tap();
  assert.equal(await video().evaluate((element) => element.paused), true);
  await video().evaluate((element) => { element.currentTime = 3; });
  await page.getByRole("button", { name: "Lewati Intro" }).tap();
  assert.ok(Math.abs(await video().evaluate((element) => element.currentTime) - 8) < 0.5, "skip lands at the fixture opening end");
  await page.getByLabel("Kecepatan video").selectOption("0.75");
  assert.equal(await video().evaluate((element) => element.playbackRate), 0.75);
  await page.getByRole("button", { name: "Bisukan suara" }).tap();
  assert.equal(await video().evaluate((element) => element.muted), true);
  await page.locator("#video-player-wrapper").focus();
  await page.keyboard.press("k");
  await page.waitForFunction(() => !document.querySelector("#video-player-video").paused);
  await page.keyboard.press("k");
  await page.waitForFunction(() => document.querySelector("#video-player-video").paused);
  console.log("PASS mobile tap, exact intro skip, speed, mute, and keyboard playback");

  await video().evaluate((element) => { element.currentTime = 17; });
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("nihnime:history") || "[]").some((item) => item.episodeId === "1002" && item.progress === 17));
  await page.goto(`${base}/history`, { waitUntil: "domcontentloaded" });
  await page.getByText("Terakhir di 00:17 / 00:20").waitFor();
  await page.getByText("Ditonton 85%").waitFor();
  const resumeLink = page.getByRole("link", { name: /Lanjutkan dari 00:17/ });
  assert.equal(await resumeLink.getAttribute("href"), "/episode/1002?anime=201");
  await resumeLink.tap();
  await page.waitForURL("**/episode/1002?anime=201");
  await metadata();
  await page.waitForFunction(() => Math.abs(document.querySelector("#video-player-video").currentTime - 17) < 0.5);
  await page.getByRole("link", { name: "Episode selanjutnya: Episode 3" }).tap();
  await page.waitForURL("**/episode/1003?anime=201");
  await metadata();
  assert.ok(await video().evaluate((element) => element.currentTime) < 1, "another episode does not inherit the previous episode's position");
  await page.getByRole("link", { name: "Episode sebelumnya: Episode 2" }).tap();
  await page.waitForURL("**/episode/1002?anime=201");
  await metadata();
  await page.waitForFunction(() => Math.abs(document.querySelector("#video-player-video").currentTime - 17) < 0.5);
  console.log("PASS history returns to the correct episode and timestamp, including the final seconds");

  await page.locator("#servers").selectOption("1");
  await page.locator("#video-player-iframe").waitFor();
  assert.equal(await video().count(), 0);
  const embedLayout = await page.evaluate(() => {
    const frame = document.querySelector("#video-player-iframe").getBoundingClientRect();
    const wrapper = document.querySelector("#video-player-wrapper").getBoundingClientRect();
    return { scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth, frame: { left: frame.left, right: frame.right, top: frame.top, bottom: frame.bottom }, wrapper: { left: wrapper.left, right: wrapper.right, top: wrapper.top, bottom: wrapper.bottom } };
  });
  assert.equal(embedLayout.scroll, embedLayout.client, "embed does not overflow a 320px screen");
  assert.ok(embedLayout.frame.left >= embedLayout.wrapper.left - 1 && embedLayout.frame.right <= embedLayout.wrapper.right + 1 && embedLayout.frame.top >= embedLayout.wrapper.top - 1 && embedLayout.frame.bottom <= embedLayout.wrapper.bottom + 1, "iframe fits its player wrapper");
  await page.getByText("progres dan lewati intro tidak dapat dikendalikan NIHNIME", { exact: false }).waitFor();
  await page.locator("#servers").selectOption("2");
  await page.getByRole("alert").getByText("Server video tidak dapat diputar", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Muat ulang pemutar" }).tap();
  await page.getByRole("alert").getByText("Server video tidak dapat diputar", { exact: false }).waitFor();
  await page.locator("#servers").selectOption("0");
  await metadata();
  await page.waitForFunction(() => Math.abs(document.querySelector("#video-player-video").currentTime - 17) < 0.5);
  await page.getByRole("link", { name: "Episode sebelumnya: Episode 1" }).tap();
  await page.waitForURL("**/episode/1001?**");
  await page.getByRole("link", { name: "Episode selanjutnya: Episode 2" }).waitFor();
  const allLabel = await page.locator(".watch-episode-all strong").evaluate((element) => ({ scroll: element.scrollWidth, width: element.clientWidth }));
  assert.ok(allLabel.scroll <= allLabel.width + 1, "all episodes label fits when there is no previous episode");

  animeTitle = "JudulAnimePanjangTanpaSpasi".repeat(8);
  noServers = true;
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator(".watch-empty-player").waitFor();
  await page.getByRole("heading", { name: `${animeTitle} Episode 1` }).waitFor();
  assert.equal(await page.locator("#servers").isDisabled(), true);
  await page.getByText("Server Tidak Tersedia", { exact: true }).last().waitFor();
  const longTitleLayout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  assert.equal(longTitleLayout.scroll, longTitleLayout.width, "long unbroken titles and empty server state do not overflow");
  await page.getByRole("link", { name: "Semua Episode" }).tap();
  await page.waitForFunction(() => location.hash === "#daftar-episode");
  await page.locator('.watch-episodes-grid a[href="/episode/1035?anime=201"]').tap();
  await page.waitForURL("**/episode/1035?anime=201");
  console.log("PASS embed limitation, retry, episode navigation, long titles, and empty server");

  animeTitle = "Anime Uji";
  noServers = false;
  await page.goto(`${base}/episode/1004?anime=201`, { waitUntil: "domcontentloaded" });
  await metadata();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("nihnime:history") || "[]").some((item) => item.episodeId === "1004"));
  await video().evaluate((element) => { element.currentTime = element.duration - 0.2; return element.play(); });
  await page.waitForFunction(() => document.querySelector("#video-player-video").ended);
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("nihnime:history") || "[]").some((item) => item.episodeId === "1004" && item.progress >= item.duration));
  await page.goto(`${base}/history`, { waitUntil: "domcontentloaded" });
  const completed = page.getByRole("link", { name: /Tonton ulang/ });
  await completed.waitFor();
  assert.equal(await completed.getAttribute("href"), "/episode/1004?anime=201");
  await completed.getByText("Ditonton 100%").waitFor();
  await completed.tap();
  await page.waitForURL("**/episode/1004?anime=201");
  await metadata();
  assert.ok(await video().evaluate((element) => element.currentTime) < 1, "a completed video replays from the beginning");
  console.log("PASS finished videos are marked complete and replay from the beginning");

  await page.setViewportSize({ width: 1200, height: 860 });
  await page.goto(`${base}/episode/1005?anime=201`, { waitUntil: "domcontentloaded" });
  await metadata();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("nihnime:history") || "[]").some((item) => item.episodeId === "1005"));
  await video().evaluate((element) => { element.playbackRate = 2; return element.play(); });
  await page.waitForFunction(() => document.querySelector("#video-player-video").currentTime > 2.2);
  const beforeSwitch = await video().evaluate((element) => element.currentTime);
  await page.locator("#servers").selectOption("1");
  await page.locator("#video-player-iframe").waitFor();
  const savedOnSwitch = await page.evaluate(() => JSON.parse(localStorage.getItem("nihnime:history")).find((item) => item.episodeId === "1005").progress);
  assert.ok(savedOnSwitch >= Math.floor(beforeSwitch), `switching servers saves its position: ${beforeSwitch} -> ${savedOnSwitch}`);
  await page.locator("#servers").selectOption("0");
  await metadata();
  await page.waitForFunction((value) => Math.abs(document.querySelector("#video-player-video").currentTime - value) < 0.5, savedOnSwitch);
  await video().evaluate((element) => { element.playbackRate = 2; return element.play(); });
  await page.waitForFunction((value) => document.querySelector("#video-player-video").currentTime > value + 1.2, savedOnSwitch);
  const beforeNavigation = await video().evaluate((element) => element.currentTime);
  await page.getByRole("link", { name: "History", exact: true }).first().click();
  await page.waitForURL("**/history");
  const savedOnNavigation = await page.evaluate(() => JSON.parse(localStorage.getItem("nihnime:history")).find((item) => item.episodeId === "1005").progress);
  assert.ok(savedOnNavigation >= Math.floor(beforeNavigation), `leaving a playing video saves its position: ${beforeNavigation} -> ${savedOnNavigation}`);
  await page.locator('a[href="/episode/1005?anime=201"]').click();
  await page.waitForURL("**/episode/1005?anime=201");
  await metadata();
  await page.waitForFunction((value) => Math.abs(document.querySelector("#video-player-video").currentTime - value) < 0.5, savedOnNavigation);
  console.log("PASS switching servers and navigating away during playback save the latest position");

  for (const number of [6, 7]) {
    const introResponse = page.waitForResponse((response) => new URL(response.url()).pathname === `/api/intro/${1000 + number}`);
    await page.goto(`${base}/episode/${1000 + number}?anime=201`, { waitUntil: "domcontentloaded" });
    await metadata();
    await introResponse;
    await page.waitForFunction(() => {
      const live = document.querySelector('.ni-player-block > [aria-live="polite"]');
      return live && !live.textContent.trim();
    });
    assert.equal(await page.getByText("Progres video langsung disimpan di browser ini.", { exact: false }).count(), 0);
    assert.equal(await page.getByText("Intro belum tersedia atau tidak cocok", { exact: false }).count(), 0);
    assert.equal(await page.locator('.ni-player-block > [aria-live="polite"]').evaluate((element) => element.getBoundingClientRect().height), 0, "empty intro status leaves no blank space");
    await video().evaluate((element) => { element.currentTime = 3; });
    assert.equal(await page.getByRole("button", { name: "Lewati Intro" }).count(), 0, "unavailable intro has no skip button");
  }
  console.log("PASS removed captions stay hidden when intro data is missing or the request fails");

  // Some streams initially expose an unknown duration. A pause/timeupdate in
  // that state must not overwrite the saved position before duration settles.
  await page.addInitScript(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "duration");
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      ...descriptor,
      get() { const value = descriptor.get.call(this); return window.__holdDuration && Number.isFinite(value) && value > 0 ? Infinity : value; },
    });
    window.__holdDuration = true;
  });
  await page.goto(`${base}/episode/1002?anime=201`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#video-player-video")?.readyState >= 2);
  await video().evaluate((element) => { element.dispatchEvent(new Event("timeupdate")); element.dispatchEvent(new Event("pause")); });
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("nihnime:history")).find((item) => item.episodeId === "1002").progress), 17, "unknown duration does not erase saved progress");
  await page.evaluate(() => { window.__holdDuration = false; document.querySelector("#video-player-video").dispatchEvent(new Event("durationchange")); });
  await page.waitForFunction(() => Math.abs(document.querySelector("#video-player-video").currentTime - 17) < 0.5);
  console.log("PASS delayed-duration streams resume without overwriting progress");

  await video().evaluate((element) => element.play());
  await page.waitForFunction(() => document.querySelector("#video-player-video").currentTime > 18.2);
  const beforeClose = await video().evaluate((element) => element.currentTime);
  await page.close();
  const historyPage = await context.newPage();
  await historyPage.route("**/*", (route) => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  await historyPage.goto(`${base}/history`, { waitUntil: "domcontentloaded" });
  const savedOnClose = await historyPage.evaluate(() => JSON.parse(localStorage.getItem("nihnime:history")).find((item) => item.episodeId === "1002").progress);
  assert.ok(savedOnClose >= Math.floor(beforeClose), `closing a playing video saves its position: ${beforeClose} -> ${savedOnClose}`);
  assert.deepEqual(errors, [], "no browser runtime errors");
  await historyPage.close();
  console.log("PASS closing the tab saves playback progress; no browser errors");
} finally {
  await browser.close();
}
