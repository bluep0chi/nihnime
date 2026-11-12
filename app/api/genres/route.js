import { NextResponse } from "next/server";
import { getGenres } from "@/lib/animein";
export async function GET() {
  try { return NextResponse.json({ status: 200, data: await getGenres() }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
