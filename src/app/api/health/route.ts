import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    replicate: !!process.env.REPLICATE_API_TOKEN,
  });
}
