import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"
import { saveGoogleTokens } from "@/lib/google/token"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "youtube", error: "No code" }, pendingCookies)
  }

  const supabase = createCallbackClient(request, pendingCookies)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.session) {
    return popupResponse({ type: "oauth_complete", service: "youtube", error: error?.message ?? "Auth failed" }, pendingCookies)
  }

  const session = data.session
  const userId = session.user.id

  if (session.provider_token) {
    await saveGoogleTokens(userId, session.provider_token, session.provider_refresh_token, 3600)

    // Auto-save the user's primary YouTube channel
    try {
      const ytRes = await fetch(
        "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
        { headers: { Authorization: `Bearer ${session.provider_token}` } }
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
      // Non-fatal: session is still set, channel just wasn't auto-saved
    }
  }

  return popupResponse({ type: "oauth_complete", service: "youtube" }, pendingCookies)
}
