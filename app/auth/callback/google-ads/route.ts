import { createClient } from "@/lib/supabase/server"
import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"
import { exchangeGoogleCode } from "@/lib/google/direct-oauth"
import { saveGoogleTokens } from "@/lib/google/token"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "google_ads", error: "No code" }, pendingCookies)
  }

  try {
    const tokens = await exchangeGoogleCode(code, `${origin}/auth/callback/google-ads`)

    let userId: string

    if (tokens.id_token) {
      const supabase = createCallbackClient(request, pendingCookies)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: tokens.id_token,
      })
      if (error || !data?.user) {
        return popupResponse({ type: "oauth_complete", service: "google_ads", error: error?.message ?? "Auth failed" }, pendingCookies)
      }
      userId = data.user.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return popupResponse({ type: "oauth_complete", service: "google_ads", error: "No session" }, pendingCookies)
      }
      userId = user.id
    }

    await saveGoogleTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expires_in)

    return popupResponse({ type: "oauth_complete", service: "google_ads" }, pendingCookies)
  } catch (err) {
    return popupResponse({ type: "oauth_complete", service: "google_ads", error: String(err) }, pendingCookies)
  }
}
