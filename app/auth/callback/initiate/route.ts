import { NextResponse } from "next/server"

const SCOPES: Record<string, string> = {
  login: "openid email profile",
  youtube: "openid email https://www.googleapis.com/auth/youtube",
  google_ads: "openid email https://www.googleapis.com/auth/adwords",
  sheets: "openid email https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file",
}

const CALLBACK_PATH: Record<string, string> = {
  login: "login",
  youtube: "youtube",
  google_ads: "google-ads",
  sheets: "sheets",
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const service = searchParams.get("service") ?? ""

  const scopes = SCOPES[service]
  const callbackPath = CALLBACK_PATH[service]

  if (!scopes || !callbackPath) {
    return new Response("Invalid service", { status: 400 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return new Response("GOOGLE_CLIENT_ID not configured", { status: 500 })
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/auth/callback/${callbackPath}`,
    response_type: "code",
    scope: scopes,
    access_type: "offline",
    prompt: "consent",
    state: service,
  })

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  )
}
