// AnimeIn does not offer a status filter. Scan a bounded number of catalog
// pages, retaining the exact raw position so matches are not skipped between
// UI pages. The upstream popularity order may still change between requests.
const RAW_PAGE_SIZE = 30;
const MAX_RAW_PAGE = 10000;

export function parseStatusCursor(value) {
  const match = String(value || "").match(/^(\d{1,5})\.(\d{1,2})$/);
  if (!match) return null;
  const page = Number(match[1]);
  const offset = Number(match[2]);
  return page <= MAX_RAW_PAGE && offset < RAW_PAGE_SIZE ? { page, offset } : null;
}

export function formatStatusCursor({ page, offset }) { return `${page}.${offset}`; }

export function parseStatusTrail(value) {
  if (!value) return [];
  const parts = String(value).split(",");
  if (parts.length > 512) return [];
  const cursors = parts.map(parseStatusCursor);
  return cursors.every(Boolean) ? cursors : [];
}

export function matchesStatus(item, kind) {
  const status = String(item?.status || "").trim();
  return kind === "ongoing" ? /^ONGOING$/i.test(status) : /^(FINISHED|COMPLETED|END)$/i.test(status);
}

export async function collectStatusPage(fetchPage, kind, start = { page: 0, offset: 0 }, { size = 30, maxPages = 6 } = {}) {
  if (kind !== "ongoing" && kind !== "completed") throw new Error("Status tidak valid.");
  let { page, offset } = start;
  const items = [];
  for (let scanned = 0; scanned < maxPages; scanned++) {
    const raw = await fetchPage(page);
    let index = Math.min(offset, raw.length);
    while (index < raw.length && items.length < size) {
      const item = raw[index++];
      if (matchesStatus(item, kind)) items.push(item);
    }
    if (index < raw.length) return { items, nextCursor: { page, offset: index }, scanLimitReached: false };
    if (raw.length < RAW_PAGE_SIZE || page >= MAX_RAW_PAGE) return { items, nextCursor: null, scanLimitReached: false };
    page++;
    offset = 0;
    if (items.length >= size) return { items, nextCursor: { page, offset }, scanLimitReached: false };
  }
  return { items, nextCursor: { page, offset }, scanLimitReached: true };
}
