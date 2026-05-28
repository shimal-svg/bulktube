import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"
import { exchangeGoogleCode } from "@/lib/google/direct-oauth"
import { saveGoogleTokens } from "@/lib/google/token"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "sheets", error: "No code" }, pendingCookies)
  }

  try {
    const tokens = await exchangeGoogleCode(code, `${origin}/auth/callback/sheets`)

    const supabase = createCallbackClient(request, pendingCookies)
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: tokens.id_token,
    })

    if (error || !data?.user) {
      return popupResponse({ type: "oauth_complete", service: "sheets", error: error?.message ?? "Auth failed" }, pendingCookies)
    }

    await saveGoogleTokens(data.user.id, tokens.access_token, tokens.refresh_token, tokens.expires_in)

    return popupResponse({ type: "oauth_complete", service: "sheets" }, pendingCookies)
  } catch (err) {
    return popupResponse({ type: "oauth_complete", service: "sheets", error: String(err) }, pendingCookies)
  }
}
