import { NextResponse } from "next/server";
import { TOOLS } from "@/lib/teacher-tools/tools";

export async function GET() {
  return NextResponse.json({
    total: TOOLS.length,
    items: TOOLS,
  });
}
