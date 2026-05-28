import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const SERVICE_SCOPES: Record<string, string> = {
  youtube: "https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/drive.file",
  google_ads: "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/drive.file",
}

const CALLBACK_PATH: Record<string, string> = {
  youtube: "youtube",
  google_ads: "google-ads",
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const service = searchParams.get("service") ?? ""

  const serviceScopes = SERVICE_SCOPES[service]
  const callbackPath = CALLBACK_PATH[service]

  if (!serviceScopes || !callbackPath) {
    return new Response("Invalid service", { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const scope = user
    ? serviceScopes
    : `openid email profile ${serviceScopes}`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/auth/callback/${callbackPath}`,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: service,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
