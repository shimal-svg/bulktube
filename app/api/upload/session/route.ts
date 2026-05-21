import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin
    .from("users")
    .select("active_youtube_channel_id, active_youtube_channel_name")
    .eq("id", session.user.id)
    .single();

  if (userError || !userData?.active_youtube_channel_id) {
    return NextResponse.json(
      { error: "No active YouTube channel. Please select one first." },
      { status: 400 }
    );
  }

  const { data: uploadSession, error: sessionError } = await admin
    .from("upload_sessions")
    .insert({
      user_id: session.user.id,
      youtube_channel_id: userData.active_youtube_channel_id,
      youtube_channel_name: userData.active_youtube_channel_name ?? "",
    })
    .select("id")
    .single();

  if (sessionError) {
    return NextResponse.json(
      { error: "Failed to create upload session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionId: uploadSession.id });
}
