import test from "node:test";
import assert from "node:assert/strict";

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

test("AnimeIn adapter maps real-shaped home, search, detail, pagination and stream responses", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.NIHNIME_DEMO;
  const calls = [];
  process.env.NIHNIME_DEMO = "0";
  globalThis.fetch = async (input, options = {}) => {
    const url = new URL(String(input));
    calls.push({ url, options });
    if (url.hostname === "gate.nextanimelist.com") return json({ data: { domain_api: { value: "https://api.animein.net/" } } });
    const payload = (data) => json({ status: 200, error: false, data });
    if (url.pathname === "/data/home/list") return payload({ update: [{ id: "341", title: "Naruto", image_poster: "/poster.jpg", image_cover: "//example.com/cover.jpg", genre: "Episode 500", key_time_update: "today", views: "1,200" }], hot: [], new: [], today: [], popular: [], waiting: [], random: [], slider: [] });
    if (url.pathname === "/3/2/explore/movie_year") return payload({ movie: [{ id: "8", title: "Winter Anime", status: "FINISHED" }] });
    if (url.pathname === "/3/2/schedule/data") return payload({ movie: [{ id: "9", title: "Scheduled Anime", status: "ONGOING", time: "tunda", key_time: "2026-11-13 10:00:00" }] });
    if (url.pathname === "/3/2/home/hot") return payload({ movie: [{ id: "10", title: "Hot Anime", status: "ONGOING" }] });
    if (url.pathname === "/3/2/movie/detail/341") return payload({ movie: { id: "341", title: "Naruto", genre: "Action", status: "FINISHED" }, episode: { id: "1", index: "1", title: "Episode 1", image: "/episode.jpg" }, season: [] });
    if (url.pathname === "/3/2/movie/episode/341") {
      const page = Number(url.searchParams.get("page") || 0);
      const entries = page === 0 ? Array.from({ length: 30 }, (_, i) => ({ id: String(5000 + i), index: String(500 - i), title: `Episode ${500 - i}`, id_movie: "341" })) : [{ id: "5018", index: "470", title: "Episode 470", id_movie: "341" }];
      return payload({ episode: entries });
    }
    if (url.pathname === "/3/2/episode/streamnew/5018") return payload({ episode: { id: "5018", index: "470", id_movie: "341", views: "18,868" }, episode_next: { id: "5017", index: "471" }, server: [{ server_id: "28", name: "Direct", quality: "720p", type: "direct", link: "https://cdn.example/720.mp4" }, { server_id: "1", name: "Embed", quality: "480p", type: "semi", link: "https://example/video.mp4?embed=true" }, { server_id: "28", name: "Direct", quality: "360p", type: "direct", link: "https://cdn.example/360.mp4" }] });
    throw new Error(`Unexpected URL ${url}`);
  };
  try {
    const adapter = await import(`../lib/animein.js?mapping=${Date.now()}`);
    const home = await adapter.getHome(8);
    assert.equal(home.episode_baru[0].latest_episode, "Episode 500");
    assert.equal(home.episode_baru[0].genre, null);
    assert.equal(home.episode_baru[0].views, 1200);
    assert.equal(home.episode_baru[0].image_poster, "https://api.animein.net/poster.jpg");
    assert.equal(home.episode_baru[0].image_cover, "https://example.com/cover.jpg");
    assert.equal(calls.find((entry) => entry.url.pathname === "/data/home/list").url.searchParams.get("limit"), "8");
    const list = await adapter.getList({ mode: "year", year: "2026", season: "winter", sort: "alphabet", page: 2 });
    assert.equal(list[0].title, "Winter Anime");
    const listCall = calls.find((entry) => entry.url.pathname === "/3/2/explore/movie_year");
    assert.equal(listCall.url.searchParams.get("season"), "winter");
    assert.equal(listCall.url.searchParams.get("page"), "2");
    assert.equal(listCall.options.headers["User-Agent"], "okhttp/4.9.3");
    const schedule = await adapter.getSchedule("SENIN");
    assert.deepEqual(Object.keys(schedule), ["SENIN"]);
    assert.equal(schedule.SENIN[0].time, "tunda");
    assert.equal(schedule.SENIN[0].key_time, "2026-11-13 10:00:00");
    assert.equal(calls.filter((entry) => entry.url.pathname === "/3/2/schedule/data").length, 1);
    assert.equal((await adapter.getHomeSection("sedang_hangat", { limit: 31 }))[0].title, "Hot Anime");
    assert.equal(calls.find((entry) => entry.url.pathname === "/3/2/home/hot").url.searchParams.get("limit"), "31");
    const detail = await adapter.getDetail("341");
    assert.equal(detail.episodes.length, 30);
    assert.equal(detail.episode_total, null);
    assert.equal(detail.episode_detail.image, "https://api.animein.net/episode.jpg");
    assert.equal((await adapter.getEpisodes("341", 1, "470"))[0].index, "470");
    const episodeCall = calls.find((entry) => entry.url.pathname === "/3/2/movie/episode/341" && entry.url.searchParams.get("page") === "1");
    assert.equal(episodeCall.url.searchParams.get("search"), "470");
    const stream = await adapter.getStream("5018");
    assert.equal(stream.episode_next.id, "5017");
    assert.deepEqual(stream.servers.map((server) => server.quality), ["360p", "480p", "720p"]);
    assert.equal(stream.servers[1].type, "semi");
    assert.equal(stream.episode.views, 18868);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnv === undefined) delete process.env.NIHNIME_DEMO; else process.env.NIHNIME_DEMO = originalEnv;
  }
});

test("a failed upstream returns an error instead of silently showing sample data", async () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env.NIHNIME_DEMO;
  const hosts = [];
  process.env.NIHNIME_DEMO = "0";
  globalThis.fetch = async (input) => {
    const url = new URL(String(input)); hosts.push(url.hostname);
    if (url.hostname === "gate.nextanimelist.com") return json({ data: { domain_api: { value: "https://untrusted.example" } } });
    return json({ status: 503 }, 503);
  };
  try {
    const adapter = await import(`../lib/animein.js?offline=${Date.now()}`);
    await assert.rejects(adapter.getHome(), /API AnimeIn tidak tersedia/i);
    await assert.rejects(adapter.getStream("5018"), /Server video tidak tersedia/i);
    assert.ok(hosts.includes("xyz-api.animein.net"));
    assert.ok(!hosts.includes("untrusted.example"));
  } finally {
    globalThis.fetch = originalFetch;
    if (originalEnv === undefined) delete process.env.NIHNIME_DEMO; else process.env.NIHNIME_DEMO = originalEnv;
  }
});
