import { NextResponse } from "next/server";
import { getHome } from "@/lib/animein";
export async function GET(req) {
  try { return NextResponse.json({ status: 200, data: await getHome(Math.max(1, Math.min(100, Number(new URL(req.url).searchParams.get("limit")) || 24))) }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
