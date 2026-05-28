import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const admin = createAdminClient()
    await admin.from("users").update({
      google_access_token: null,
      google_refresh_token: null,
      google_token_expires_at: null,
      active_youtube_channel_id: null,
      active_youtube_channel_name: null,
      active_youtube_channel_thumbnail: null,
      google_sheets_id: null,
      google_sheets_url: null,
      google_ads_customer_id: null,
      google_ads_customer_name: null,
    }).eq("id", user.id)
  }

  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
