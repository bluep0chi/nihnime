import { NextResponse } from "next/server";
import { getSchedule } from "@/lib/animein";
export async function GET(req) {
  try { return NextResponse.json({ status: 200, data: await getSchedule(new URL(req.url).searchParams.get("day") || "SEMUA") }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
