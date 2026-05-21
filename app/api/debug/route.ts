import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url ? `${url.slice(0, 10)}… (${url.length} chars)` : "NOT SET",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: key ? `${key.slice(0, 10)}… (${key.length} chars)` : "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
