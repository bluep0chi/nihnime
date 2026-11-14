import { NextResponse } from "next/server";
import { findArtwork } from "@/lib/artwork.mjs";

export async function GET(req) {
  const params = new URL(req.url).searchParams;
  const title = (params.get("title") || "").trim();
  const year = params.get("year") || "";
  if (!title || title.length > 160 || (year && !/^\d{4}$/.test(year))) {
    return NextResponse.json({ status: 400, message: "Judul atau tahun tidak valid." }, { status: 400 });
  }
  try {
    const data = await findArtwork(title, year);
    return NextResponse.json({ status: 200, data }, {
      // Keep total CDN + upstream cache time below the lifetime of signed images.
      headers: { "Cache-Control": "public, max-age=60, s-maxage=300" },
    });
  } catch {
    return NextResponse.json({ status: 503, message: "Layanan gambar cadangan tidak tersedia." }, { status: 503 });
  }
}
