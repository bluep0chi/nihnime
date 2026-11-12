import { NextResponse } from "next/server";
import { getExplore } from "@/lib/animein";
export async function GET() {
  try { return NextResponse.json({ status: 200, data: await getExplore() }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
