import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const COLUMNS: Record<string, Record<string, null>> = {
  youtube: {
    active_youtube_channel_id: null,
    active_youtube_channel_name: null,
    active_youtube_channel_thumbnail: null,
  },
  google_ads: {
    google_ads_customer_id: null,
    google_ads_customer_name: null,
  },
  sheets: {
    google_sheets_id: null,
    google_sheets_url: null,
  },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { service } = await request.json()
  const columns = COLUMNS[service]
  if (!columns) return NextResponse.json({ error: "Unknown service" }, { status: 400 })

  const admin = createAdminClient()
  await admin.from("users").update(columns).eq("id", user.id)

  return NextResponse.json({ success: true })
}
