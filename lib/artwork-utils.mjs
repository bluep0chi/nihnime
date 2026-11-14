// AnimeIn's `year` is not necessarily the premiere year (it can reflect a
// later update). Only use an actual start date when matching artwork.
export function artworkYear(airedStart) {
  const match = String(airedStart || "").trim().match(/^(\d{4})(?:-|$)/);
  return match && Number(match[1]) > 0 ? match[1] : "";
}
