"use client";

// Deduplicate lookups and keep a small concurrency limit when a page has many
// unavailable posters. Failed lookups may be retried; signed URLs expire.
const cache = new Map();
const queue = [];
let active = 0;

function drain() {
  while (active < 3 && queue.length) {
    const task = queue.shift();
    active++;
    fetch(`/api/artwork?${task.params}`)
      .then(async (response) => response.ok ? (await response.json()).data || null : null)
      .catch(() => null)
      .then((result) => {
        if (result) cache.set(task.key, { promise: Promise.resolve(result), expires: Date.now() + 120000 });
        else cache.delete(task.key);
        task.resolve(result);
      })
      .finally(() => { active--; drain(); });
  }
}

export function fallbackArtwork(title, year) {
  const name = String(title || "").trim();
  if (!name || name.length > 160) return Promise.resolve(null);
  const validYear = /^\d{4}$/.test(String(year || "")) ? String(year) : "";
  const key = `${name}\n${validYear}`;
  const existing = cache.get(key);
  if (existing && existing.expires > Date.now()) return existing.promise;
  const params = new URLSearchParams({ title: name });
  if (validYear) params.set("year", validYear);
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  cache.set(key, { promise, expires: Infinity });
  queue.push({ key, params, resolve });
  drain();
  return promise;
}
