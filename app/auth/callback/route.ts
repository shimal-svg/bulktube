import { createServerClient } from "@supabase/ssr";
import { saveGoogleTokens } from "@/lib/google/token";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  // Collect cookies written during exchangeCodeForSession so they can be
  // applied to the final redirect response. The shared createClient() from
  // lib/supabase/server writes to next/headers cookies(), which is a
  // different object from NextResponse — cookies set there never reach the
  // browser when we return NextResponse.redirect().
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers
            .get("cookie")
            ?.split(";")
            .map((c) => {
              const [name, ...rest] = c.trim().split("=");
              return { name: name.trim(), value: rest.join("=").trim() };
            }) ?? [];
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            pendingCookies.push({ name, value, options: options ?? {} })
          );
        },
      },
    }
  );

  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const oauthSession = exchangeData?.session;

  if (oauthSession?.provider_token && oauthSession.user?.id) {
    await saveGoogleTokens(
      oauthSession.user.id,
      oauthSession.provider_token,
      oauthSession.provider_refresh_token,
      3600
    );
  }

  // Determine destination before building the response
  let destination = `${origin}/select-channel`;

  if (oauthSession?.user?.id) {
    const { data: userData } = await supabase
      .from("users")
      .select("active_youtube_channel_id")
      .eq("id", oauthSession.user.id)
      .single();

    if (userData?.active_youtube_channel_id) {
      destination = `${origin}/dashboard`;
    }
  }

  const response = NextResponse.redirect(destination);

  // Apply all session cookies onto the redirect response so the browser
  // receives them and subsequent requests are authenticated.
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
  );

  return response;
}
