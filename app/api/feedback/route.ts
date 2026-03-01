import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const body = await req.json();

  logger.info("[FEEDBACK]", {
    userId: user?.id,
    feedback: body.feedback?.slice(0, 1000),
    page: body.page,
  });

  return NextResponse.json({ ok: true });
}
