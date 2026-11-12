import { NextResponse } from "next/server";
import { getHome } from "@/lib/animein";
export async function GET() {
  try { return NextResponse.json({ status: 200, data: await getHome() }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
