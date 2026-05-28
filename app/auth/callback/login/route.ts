import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"
import { exchangeGoogleCode, decodeIdTokenPayload } from "@/lib/google/direct-oauth"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "login", error: "No code" }, pendingCookies)
  }

  try {
    const tokens = await exchangeGoogleCode(code, `${origin}/auth/callback/login`)
    const payload = decodeIdTokenPayload(tokens.id_token)

    const supabase = createCallbackClient(request, pendingCookies)
    const { error } = await supabase.auth.signInWithIdToken({
      provider: "google",
      token: tokens.id_token,
    })

    if (error) {
      return popupResponse({ type: "oauth_complete", service: "login", error: error.message }, pendingCookies)
    }

    return popupResponse(
      {
        type: "oauth_complete",
        service: "login",
        email: payload.email,
        avatar: payload.picture ?? null,
      },
      pendingCookies
    )
  } catch (err) {
    return popupResponse({ type: "oauth_complete", service: "login", error: String(err) }, pendingCookies)
  }
}
