import { NextResponse } from "next/server";
import { getHomeSection } from "@/lib/animein";
export async function GET(req) {
  const p = new URL(req.url).searchParams;
  try {
    const data = await getHomeSection(p.get("section") || "sedang_hangat", {
      limit: Math.max(1, Math.min(301, Number(p.get("limit")) || 24)),
      page: Math.max(1, Math.min(10000, Math.floor(Number(p.get("page")) || 1))),
      genre: (p.get("genre") || "").split(",").filter(Boolean),
    });
    return NextResponse.json({ status: 200, data });
  } catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
