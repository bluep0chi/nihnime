import { NextResponse } from "next/server";
import { getDetail } from "@/lib/animein";
export async function GET(_req, { params }) {
  const { id } = await params;
  try { return NextResponse.json({ status: 200, data: await getDetail(id) }); }
  catch (e) { return NextResponse.json({ status: 500, message: e.message }, { status: 500 }); }
}
