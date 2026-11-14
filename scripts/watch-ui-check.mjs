// Run against a local Next.js server; API and media responses are fixtures.
// See README.md for installing Chromium or selecting an existing executable.
import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

const base = (process.env.WATCH_TEST_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const origin = new URL(base).origin;
const fixture = await readFile(new URL("../tests/fixtures/watch-sample.mp4", import.meta.url));
const episode = (number) => ({ id: String(1000 + number), id_movie: "201", index: String(number), title: `Episode ${number}` });
let animeTitle = "Anime Uji";
let noServers = false;
const servers = [
  { server_id: "a", name: "Server A", quality: "720p", type: "direct", url: `${base}/__watch-test__/sample.mp4` },
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
await page.route("**/api/genres", (route) => route.fulfill({ json: { status: 200, data: [] } }));
await page.route("**/api/list?**", (route) => route.fulfill({ json: { status: 200, data: [] } }));
await page.route("**/api/artwork?**", (route) => route.fulfill({ json: { status: 200, data: null } }));
await page.route("**/api/intro/**", (route) => {
  const url = new URL(route.request().url());
  const number = Number(url.pathname.split("/").at(-1)) - 1000;
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
  assert.equal(await page.getByRole("button", { name: "Lewati Intro" }).count(), 0, "skip must not appear before the opening");
  await video().evaluate((element) => { element.currentTime = 3; });
  await page.getByRole("button", { name: "Lewati Intro" }).waitFor();
  assert.equal(await page.getByRole("link", { name: "Dihadirkan oleh NIHNIME" }).count(), 1);
  assert.equal(await page.locator(".ni-player-brand img").getAttribute("src"), "/images/logo.png");
  for (const link of await page.locator(".watch-episode-link").all()) assert.equal(await link.locator("svg").count(), 1, "episode navigation has a visible icon");

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
        const allEpisodes = document.querySelector(".watch-episode-all strong");
        const controls = [...toolbar.children].filter((element) => getComputedStyle(element).display !== "none" && element.matches("button, .ni-player-speed-wrap"));
        return {
          scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth,
          toolbarScroll: toolbar.scrollWidth, toolbarWidth: toolbar.clientWidth,
          player: rect(player), controls: controls.map(rect), center: rect(document.querySelector(".ni-player-center")), skip: rect(document.querySelector(".ni-player-skip")),
          allScroll: allEpisodes.scrollWidth, allWidth: allEpisodes.clientWidth,
        };
      });
      const label = `${theme} at ${width}px`;
      assert.equal(layout.scrollWidth, layout.clientWidth, `page overflow: ${label}`);
      assert.ok(layout.toolbarScroll <= layout.toolbarWidth + 1, `player toolbar clipped: ${label}`);
      assert.ok(layout.controls.every((control) => control.left >= layout.player.left - 1 && control.right <= layout.player.right + 1), `control outside player: ${label}`);
      assert.ok(layout.allScroll <= layout.allWidth + 1, `episode list label clipped: ${label}`);
      const { center, skip } = layout;
      assert.ok(center.right <= skip.left || center.left >= skip.right || center.bottom <= skip.top || center.top >= skip.bottom, `play and skip overlap: ${label}`);
    }
  }
  console.log("PASS light/dark layouts at 320–1200px, visible icons, branding, and unobstructed controls");

  await page.setViewportSize({ width: 320, height: 860 });
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
  await page.getByText("Pemutar eksternal", { exact: true }).waitFor();
  await page.getByText("progres dan lewati intro tidak dapat dikendalikan NIHNIME", { exact: false }).waitFor();
  await page.locator("#servers").selectOption("2");
  await page.getByRole("alert").getByText("Server video tidak dapat diputar", { exact: false }).waitFor();
  await page.getByRole("button", { name: "Muat ulang pemutar" }).tap();
  await page.getByRole("alert").getByText("Server video tidak dapat diputar", { exact: false }).waitFor();
  await page.locator("#servers").selectOption("0");
  await metadata();
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
  assert.equal(await page.getByText("Server tidak tersedia", { exact: true }).count(), 1);
  const longTitleLayout = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: document.documentElement.clientWidth }));
  assert.equal(longTitleLayout.scroll, longTitleLayout.width, "long unbroken titles and empty server state do not overflow");
  await page.getByRole("link", { name: "Semua Episode" }).tap();
  await page.waitForURL("**/anime/201");
  assert.deepEqual(errors, [], "no browser runtime errors");
  console.log("PASS embed limitation, retry, episode navigation, long titles, empty server, and no page errors");
} finally {
  await browser.close();
}
