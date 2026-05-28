import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"
import { saveGoogleTokens } from "@/lib/google/token"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "google_ads", error: "No code" }, pendingCookies)
  }

  const supabase = createCallbackClient(request, pendingCookies)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.session) {
    return popupResponse({ type: "oauth_complete", service: "google_ads", error: error?.message ?? "Auth failed" }, pendingCookies)
  }

  const session = data.session
  if (session.provider_token) {
    await saveGoogleTokens(session.user.id, session.provider_token, session.provider_refresh_token, 3600)
  }

  return popupResponse({ type: "oauth_complete", service: "google_ads" }, pendingCookies)
}
