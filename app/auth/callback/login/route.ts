import { createCallbackClient, popupResponse } from "@/lib/auth/popup-response"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = []

  if (!code) {
    return popupResponse({ type: "oauth_complete", service: "login", error: "No code" }, pendingCookies)
  }

  const supabase = createCallbackClient(request, pendingCookies)
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.session) {
    return popupResponse({ type: "oauth_complete", service: "login", error: error?.message ?? "Auth failed" }, pendingCookies)
  }

  const user = data.session.user
  return popupResponse(
    {
      type: "oauth_complete",
      service: "login",
      email: user.email ?? null,
      avatar: (user.user_metadata?.avatar_url as string) ?? null,
    },
    pendingCookies
  )
}
