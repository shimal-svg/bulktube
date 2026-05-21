import { createAdminClient } from "@/lib/supabase/admin";

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh 5 min before expiry

export async function getValidGoogleToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();

  const { data: user, error } = await admin
    .from("users")
    .select("google_access_token, google_refresh_token, google_token_expires_at")
    .eq("id", userId)
    .single();

  if (error || !user) return null;

  // Token is still fresh — return it directly
  const expiresAt = user.google_token_expires_at
    ? new Date(user.google_token_expires_at).getTime()
    : 0;

  if (user.google_access_token && expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return user.google_access_token;
  }

  // Token missing or expiring — try to refresh
  if (!user.google_refresh_token) return null;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    refresh_token: user.google_refresh_token,
    grant_type: "refresh_token",
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!res.ok) return null;

  const { access_token, expires_in } = await res.json();
  const newExpiry = new Date(Date.now() + (expires_in ?? 3600) * 1000);

  await admin
    .from("users")
    .update({
      google_access_token: access_token,
      google_token_expires_at: newExpiry.toISOString(),
    })
    .eq("id", userId);

  return access_token as string;
}

export async function saveGoogleTokens(
  userId: string,
  accessToken: string,
  refreshToken: string | null | undefined,
  expiresIn: number = 3600
) {
  const admin = createAdminClient();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const update: Record<string, string | null> = {
    google_access_token: accessToken,
    google_token_expires_at: expiresAt.toISOString(),
  };

  // Only overwrite the refresh token when Google provides a new one.
  // Google only issues refresh tokens on the first consent — don't null it out.
  if (refreshToken) {
    update.google_refresh_token = refreshToken;
  }

  await admin.from("users").update(update).eq("id", userId);
}
