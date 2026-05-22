import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getValidGoogleToken } from "@/lib/google/token";
import { ensureSheet, appendUploadRow } from "@/lib/google/sheets";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  console.log("[upload/complete] ▶ route hit");

  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log("[upload/complete] session found:", !!session?.user, "| userId:", session?.user?.id ?? "none");

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { uploadId, youtubeVideoId } = body;

    console.log("[upload/complete] uploadId:", uploadId, "| youtubeVideoId:", youtubeVideoId);

    if (!uploadId || !youtubeVideoId) {
      console.log("[upload/complete] ✗ missing required fields");
      return NextResponse.json(
        { error: "Missing uploadId or youtubeVideoId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const userId = session.user.id;

    // Mark upload as succeeded; select fields needed for Sheets row
    const { data: updated, error: updateError } = await admin
      .from("uploads")
      .update({
        youtube_video_id: youtubeVideoId,
        youtube_url: `https://youtu.be/${youtubeVideoId}`,
        status: "success",
        credit_used: true,
      })
      .eq("id", uploadId)
      .eq("user_id", userId)
      .select("id, filename, title, orientation, duration, privacy, created_at");

    console.log(
      "[upload/complete] DB update — rowsMatched:", updated?.length ?? 0,
      "| error:", updateError ? JSON.stringify(updateError) : "none"
    );

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to record upload", detail: updateError.message },
        { status: 500 }
      );
    }

    if (!updated || updated.length === 0) {
      console.log("[upload/complete] ⚠ 0 rows updated — uploadId may not exist or userId mismatch");
    }

    // Deduct credit: free uploads first, then oldest non-expired credit pack
    const { data: userData, error: userError } = await admin
      .from("users")
      .select("free_uploads_used, free_uploads_limit")
      .eq("id", userId)
      .single();

    console.log(
      "[upload/complete] credits — used:", userData?.free_uploads_used,
      "| limit:", userData?.free_uploads_limit,
      "| fetchError:", userError ? JSON.stringify(userError) : "none"
    );

    if (userData && userData.free_uploads_used < userData.free_uploads_limit) {
      const { error: deductError } = await admin
        .from("users")
        .update({ free_uploads_used: userData.free_uploads_used + 1 })
        .eq("id", userId);
      console.log("[upload/complete] free upload deducted | error:", deductError ? JSON.stringify(deductError) : "none");
    } else {
      const { data: pack, error: packError } = await admin
        .from("credit_packs")
        .select("id, credits_remaining")
        .eq("user_id", userId)
        .gt("credits_remaining", 0)
        .order("purchased_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      console.log("[upload/complete] credit pack — found:", !!pack, "| error:", packError ? JSON.stringify(packError) : "none");

      if (pack) {
        const { error: packDeductError } = await admin
          .from("credit_packs")
          .update({ credits_remaining: pack.credits_remaining - 1 })
          .eq("id", pack.id);
        console.log("[upload/complete] pack deducted | error:", packDeductError ? JSON.stringify(packDeductError) : "none");
      }
    }

    // Best-effort: append row to Google Sheet — never fails the response
    try {
      const accessToken = await getValidGoogleToken(userId);
      console.log("[upload/complete] sheets — accessToken present:", !!accessToken);

      if (!accessToken) {
        console.log("[upload/complete] skipping sheets — no access token");
      } else {
        // Use updated record if available; otherwise fetch it (handles 0-row-update edge case)
        let uploadRecord = updated?.[0];
        if (!uploadRecord) {
          console.log("[upload/complete] updated[] empty — fetching upload record directly");
          const { data: fetched } = await admin
            .from("uploads")
            .select("id, filename, title, orientation, duration, privacy, created_at")
            .eq("id", uploadId)
            .single();
          uploadRecord = fetched ?? undefined as typeof uploadRecord;
        }

        console.log("[upload/complete] uploadRecord found:", !!uploadRecord);

        if (uploadRecord) {
          const { sheetId } = await ensureSheet(userId, accessToken);
          const createdAt = new Date(uploadRecord.created_at);
          const yyyy = createdAt.getUTCFullYear();
          const dd = String(createdAt.getUTCDate()).padStart(2, "0");
          const mm = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
          await appendUploadRow(sheetId, accessToken, {
            uploadDate: `${yyyy}${dd}${mm}`,
            filename: uploadRecord.filename,
            title: uploadRecord.title,
            orientation: uploadRecord.orientation,
            duration: uploadRecord.duration,
            privacy: uploadRecord.privacy,
            videoId: youtubeVideoId,
            youtubeUrl: `https://youtu.be/${youtubeVideoId}`,
            status: "success",
          });
          console.log("[upload/complete] sheet row appended");
        }
      }
    } catch (sheetErr) {
      console.log("[upload/complete] sheet append failed (non-fatal):", sheetErr);
    }

    console.log("[upload/complete] ✓ returning ok");
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.log("[upload/complete] ✗ unhandled exception:", err);
    return NextResponse.json(
      { error: "Internal server error", detail: String(err) },
      { status: 500 }
    );
  }
}
