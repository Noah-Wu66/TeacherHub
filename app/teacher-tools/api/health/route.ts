import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "teacher-tools-next",
    timestamp: new Date().toISOString(),
  });
}
