import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { channelId, channelName, channelThumbnail } = body;

  if (!channelId || !channelName) {
    return NextResponse.json({ error: "Missing channelId or channelName" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({
      active_youtube_channel_id: channelId,
      active_youtube_channel_name: channelName,
      active_youtube_channel_thumbnail: channelThumbnail ?? null,
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
