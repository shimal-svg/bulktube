import { createClient } from "@/lib/supabase/server"
import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"
import { exchangeGoogleCode } from "@/lib/google/direct-oauth"
import { saveGoogleTokens } from "@/lib/google/token"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "youtube", error: "No code" }, pendingCookies)
  }

  try {
    const tokens = await exchangeGoogleCode(code, `${origin}/auth/callback/youtube`)

    let userId: string

    if (tokens.id_token) {
      const supabase = createCallbackClient(request, pendingCookies)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: tokens.id_token,
      })
      if (error || !data?.user) {
        return popupResponse({ type: "oauth_complete", service: "youtube", error: error?.message ?? "Auth failed" }, pendingCookies)
      }
      userId = data.user.id
    } else {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return popupResponse({ type: "oauth_complete", service: "youtube", error: "No session" }, pendingCookies)
      }
      userId = user.id
    }

    await saveGoogleTokens(userId, tokens.access_token, tokens.refresh_token, tokens.expires_in)

    try {
      const ytRes = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${tokens.access_token}` } }
      )
      if (ytRes.ok) {
        const ytData = await ytRes.json()
        const ch = ytData.items?.[0]
        if (ch) {
          const admin = createAdminClient()
          await admin
            .from("users")
            .update({
              active_youtube_channel_id: ch.id,
              active_youtube_channel_name: ch.snippet.title,
              active_youtube_channel_thumbnail: ch.snippet.thumbnails?.default?.url ?? null,
            })
            .eq("id", userId)

          return popupResponse(
            {
              type: "oauth_complete",
              service: "youtube",
              channelName: ch.snippet.title,
              channelThumbnail: ch.snippet.thumbnails?.default?.url ?? null,
            },
            pendingCookies
          )
        }
      }
    } catch {
      // Non-fatal: session is set, channel just wasn't auto-saved
    }

    return popupResponse({ type: "oauth_complete", service: "youtube" }, pendingCookies)
  } catch (err) {
    return popupResponse({ type: "oauth_complete", service: "youtube", error: String(err) }, pendingCookies)
  }
}
