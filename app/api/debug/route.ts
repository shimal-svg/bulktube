import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const cookies = request.cookies.getAll().map((c) => c.name);
  const sessionCookies = cookies.filter((n) => n.startsWith("sb-"));

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url ? `${url.slice(0, 10)}… (${url.length} chars)` : "NOT SET",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? `${key.slice(0, 10)}… (${key.length} chars)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
    all_cookie_names: cookies,
    session_cookies: sessionCookies,
    has_session: sessionCookies.some((n) => n.includes("-auth-token")),
  });
}
