import { NextResponse, type NextRequest } from "next/server";
import { demoMode } from "@/lib/demo";
import { resetDemo } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

// Called once a day by a Vercel cron on the hosted demo. Vercel sends
// CRON_SECRET as a bearer token, so nobody else can trigger a reset.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!demoMode() || !secret) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  await resetDemo();
  return NextResponse.json({ ok: true, resetAt: new Date().toISOString() });
}
