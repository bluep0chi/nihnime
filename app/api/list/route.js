import { NextResponse } from "next/server";
import { getList } from "@/lib/animein";
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  try {
    const data = await getList({
      mode: p.get("mode") || "search", keyword: p.get("q") || "",
      genre: (p.get("genre") || "").split(",").filter(Boolean),
      sort: p.get("sort") || "views", page: Number(p.get("page") || 0),
      id_genre: p.get("id_genre") || "", studio: p.get("studio") || "",
      year: p.get("year") || "", season: p.get("season") || "", type: p.get("type") || "",
    });
    return NextResponse.json({ status: 200, data });
  } catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
