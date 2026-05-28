// Direct Google OAuth helpers — bypasses Supabase's GoTrue so only the
// scopes we specify are ever sent to Google.

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in: number
}> {
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  })

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "")
    throw new Error(`Google token exchange failed (${res.status}): ${err}`)
  }

  return res.json()
}

// Decode the JWT payload of a Google id_token without signature verification.
// Safe here because Supabase re-validates the token server-side in signInWithIdToken.
export function decodeIdTokenPayload(idToken: string): {
  sub: string
  email: string
  name?: string
  picture?: string
} {
  const parts = idToken.split(".")
  if (parts.length !== 3) throw new Error("Invalid id_token format")
  const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/")
  return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"))
}
