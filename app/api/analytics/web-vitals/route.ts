import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const metric = await req.json();
    logger.info("[WEB_VITALS]", {
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
