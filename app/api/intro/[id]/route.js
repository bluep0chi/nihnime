import { NextResponse } from "next/server";
import { getDetail, getStream } from "@/lib/animein";
import { findIntro, validVideoDuration } from "@/lib/intro.mjs";

export const maxDuration = 60;

export async function GET(req, { params }) {
  const { id } = await params;
  const query = new URL(req.url).searchParams;
  const animeId = query.get("anime") || "";
  const rawDuration = query.get("duration") || "";
  const duration = Number(rawDuration);
  if (!/^[1-9]\d{0,9}$/.test(id) || !/^[1-9]\d{0,9}$/.test(animeId)
      || !/^\d{1,5}(?:\.\d{1,3})?$/.test(rawDuration) || !validVideoDuration(duration)) {
    return NextResponse.json({ status: 400, message: "Episode atau durasi video tidak valid." }, { status: 400 });
  }
  try {
    // Fetch both records ourselves and cross-check them; a URL parameter cannot
    // silently make one season use another season's opening.
    const [stream, anime] = await Promise.all([getStream(id), getDetail(animeId)]);
    const data = await findIntro({ stream, anime, episodeId: id, duration });
    return NextResponse.json({ status: 200, data }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ status: 503, message: "Data intro sedang tidak tersedia." }, { status: 503 });
  }
}
