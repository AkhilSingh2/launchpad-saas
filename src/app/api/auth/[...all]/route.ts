import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

function limitAuth(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sensitive =
    request.method === "POST" && (path.includes("/sign-in") || path.includes("/sign-up"));
  if (!sensitive) return null;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const result = rateLimit({ key: `auth:${ip}`, limit: 30, windowMs: 10 * 60 * 1000 });
  if (result.ok) return null;

  return NextResponse.json(
    { message: "Too many attempts. Try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) },
    },
  );
}

export async function POST(request: NextRequest) {
  const blocked = limitAuth(request);
  if (blocked) return blocked;
  return handler.POST(request);
}

export const GET = handler.GET;
