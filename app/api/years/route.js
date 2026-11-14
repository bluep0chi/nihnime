import { NextResponse } from "next/server";
import { getYears } from "@/lib/animein";
export async function GET() {
  try { return NextResponse.json({ status: 200, data: await getYears() }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
