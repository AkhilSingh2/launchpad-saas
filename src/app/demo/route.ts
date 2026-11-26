import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { DEMO_PASSWORD, DEMO_SIGN_IN, demoMode } from "@/lib/demo";

export const dynamic = "force-dynamic";

// One-click sign-in for the hosted demo. Visitors land in the seeded Northstar
// workspace without creating an account. Returns 404 everywhere else.
export async function GET(request: NextRequest) {
  if (!demoMode()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const as = request.nextUrl.searchParams.get("as") ?? "akhil";
  const email = DEMO_SIGN_IN[as as keyof typeof DEMO_SIGN_IN] ?? DEMO_SIGN_IN.akhil;

  const signIn = await auth.api.signInEmail({
    body: { email, password: DEMO_PASSWORD },
    headers: request.headers,
    asResponse: true,
  });

  if (!signIn.ok) {
    return NextResponse.redirect(new URL("/login?error=demo", request.url));
  }

  const response = NextResponse.redirect(new URL("/app", request.url));
  for (const cookie of signIn.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}
