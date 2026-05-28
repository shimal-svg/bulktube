import { NextResponse } from "next/server"
import { createCallbackClient } from "@/lib/auth/popup-response"

type PendingCookie = { name: string; value: string; options: Record<string, unknown> }

export async function POST(request: Request) {
  const { credential } = await request.json()

  if (!credential) {
    return NextResponse.json({ error: "No credential" }, { status: 400 })
  }

  const pendingCookies: PendingCookie[] = []
  const supabase = createCallbackClient(request, pendingCookies)

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: credential,
  })

  if (error || !data?.user) {
    console.error("[OneTap] server signInWithIdToken error:", error?.message)
    return NextResponse.json({ error: error?.message ?? "Auth failed" }, { status: 401 })
  }

  const res = NextResponse.json({
    email: data.user.email,
    avatar: data.user.user_metadata?.avatar_url ?? null,
  })

  pendingCookies.forEach(({ name, value, options }) =>
    res.cookies.set(name, value, options as Parameters<typeof res.cookies.set>[2])
  )

  return res
}
