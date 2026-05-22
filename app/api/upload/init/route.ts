import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGoogleToken } from "@/lib/google/token";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("[upload/init] session found:", !!session?.user, "userId:", session?.user?.id ?? "none");

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const userId = session.user.id;

  // Fetch from DB (and auto-refresh if expiring) rather than reading from the
  // session cookie, which loses provider_token after the first JWT refresh.
  const providerToken = await getValidGoogleToken(userId);
  console.log("[upload/init] google token retrieved:", !!providerToken, "length:", providerToken?.length ?? 0);

  if (!providerToken) {
    return NextResponse.json(
      {
        error:
          "Google access token unavailable. Please sign out and sign in again to reconnect your YouTube account.",
      },
      { status: 401 }
    );
  }

  // Credit pre-check: free uploads or credit packs
  const { data: userData } = await admin
    .from("users")
    .select("free_uploads_used, free_uploads_limit")
    .eq("id", userId)
    .single();

  const hasFreeUpload =
    userData != null && userData.free_uploads_used < userData.free_uploads_limit;

  if (!hasFreeUpload) {
    const { data: pack } = await admin
      .from("credit_packs")
      .select("id")
      .eq("user_id", userId)
      .gt("credits_remaining", 0)
      .limit(1)
      .maybeSingle();

    if (!pack) {
      return NextResponse.json(
        { error: "No uploads remaining. Please purchase more credits." },
        { status: 402 }
      );
    }
  }

  const body = await request.json();
  const {
    title,
    filename,
    orientation,
    duration,
    privacy,
    madeForKids,
    fileSize,
    contentType,
    sessionId,
  } = body;

  if (!title || !filename || !sessionId) {
    return NextResponse.json(
      { error: "Missing required fields: title, filename, sessionId" },
      { status: 400 }
    );
  }

  // Initiate YouTube resumable upload — server gets the URI, client uploads directly
  const youtubeRes = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerToken}`,
        "Content-Type": "application/json",
        "X-Upload-Content-Type": contentType ?? "video/mp4",
        "X-Upload-Content-Length": String(fileSize ?? 0),
      },
      body: JSON.stringify({
        snippet: {
          title,
          description: "",
          categoryId: "22",
        },
        status: {
          privacyStatus: privacy ?? "unlisted",
          selfDeclaredMadeForKids: madeForKids ?? false,
        },
      }),
    }
  );

  if (!youtubeRes.ok) {
    const errBody = await youtubeRes.json().catch(() => ({}));
    console.log("[upload/init] YouTube API error — status:", youtubeRes.status, "body:", JSON.stringify(errBody));
    return NextResponse.json(
      { error: "YouTube API error", details: errBody },
      { status: youtubeRes.status }
    );
  }

  const uploadUrl = youtubeRes.headers.get("location");
  if (!uploadUrl) {
    return NextResponse.json(
      { error: "YouTube did not return an upload URL" },
      { status: 500 }
    );
  }

  // Create the uploads record (status: pending — credited only on completion)
  const { data: uploadRecord, error: insertError } = await admin
    .from("uploads")
    .insert({
      session_id: sessionId,
      user_id: userId,
      filename,
      title,
      orientation: orientation ?? null,
      duration: duration ?? null,
      privacy: privacy ?? "unlisted",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create upload record" },
      { status: 500 }
    );
  }

  return NextResponse.json({ uploadUrl, uploadId: uploadRecord.id });
}
