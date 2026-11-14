import { NextResponse } from "next/server";
import { getEpisodes } from "@/lib/animein";
export async function GET(req, { params }) {
  const { id } = await params;
  const p = new URL(req.url).searchParams;
  try { return NextResponse.json({ status: 200, data: await getEpisodes(id, Math.max(0, Math.min(10000, Math.floor(Number(p.get("page")) || 0))), p.get("search") || "") }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
