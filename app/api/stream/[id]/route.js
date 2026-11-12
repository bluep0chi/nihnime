import { NextResponse } from "next/server";
import { getStream } from "@/lib/animein";
export async function GET(_req, { params }) {
  const { id } = await params;
  try { return NextResponse.json({ status: 200, data: await getStream(id) }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
