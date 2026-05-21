import { createClient } from "@/lib/supabase/server";
import { saveGoogleTokens } from "@/lib/google/token";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createClient();
  const { data: exchangeData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  // provider_token is only present immediately after exchange — save it now
  // before any subsequent session refresh can drop it from the cookie.
  const oauthSession = exchangeData?.session;
  if (oauthSession?.provider_token && oauthSession.user?.id) {
    await saveGoogleTokens(
      oauthSession.user.id,
      oauthSession.provider_token,
      oauthSession.provider_refresh_token,
      3600
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Check if user has already selected a channel
  const { data: userData } = await supabase
    .from("users")
    .select("active_youtube_channel_id")
    .eq("id", user.id)
    .single();

  if (userData?.active_youtube_channel_id) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  return NextResponse.redirect(`${origin}/select-channel`);
}
