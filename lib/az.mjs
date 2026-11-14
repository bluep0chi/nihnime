// AnimeIn search matches substrings, so locate the first alphabetically sorted
// page that can contain the requested first letter, then filter its results.
export function titleInitial(title) { return String(title || "").trim().charAt(0).toUpperCase(); }
export function startsWithInitial(item, initial) { return titleInitial(item?.title) === initial.toUpperCase(); }
export async function findFirstInitialPage(fetchPage, initial, maxPage = 256) {
  const target = String(initial).toUpperCase();
  if (!/^[A-Z0-9]$/.test(target)) throw new Error("Huruf A-Z atau angka diperlukan.");
  const before = async (page) => { const items = await fetchPage(page); return items.length > 0 && titleInitial(items[items.length - 1]?.title) < target; };
  if (!(await before(0))) return 0;
  let low = 0, high = 1;
  while (high < maxPage && await before(high)) { low = high; high = Math.min(high * 2, maxPage); }
  if (high === maxPage && await before(high)) return high;
  while (low + 1 < high) { const mid = Math.floor((low + high) / 2); if (await before(mid)) low = mid; else high = mid; }
  return high;
}
