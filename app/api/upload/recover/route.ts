import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { uploadUrl, fileSize } = await request.json();

  if (!uploadUrl || !fileSize) {
    return NextResponse.json(
      { error: "Missing uploadUrl or fileSize" },
      { status: 400 }
    );
  }

  // Guard against SSRF — only allow YouTube upload URLs
  if (!uploadUrl.startsWith("https://www.googleapis.com/upload/youtube/")) {
    return NextResponse.json({ error: "Invalid upload URL" }, { status: 400 });
  }

  // Query YouTube upload status server-side (no CORS restriction here).
  // Sending Content-Range: bytes */{size} with no body is YouTube's documented
  // way to ask "how much have you received?" — if complete it returns 200/201
  // with the full video resource.
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Range": `bytes */${fileSize}`,
      "Content-Length": "0",
    },
  });

  console.log("[upload/recover] YouTube status —", res.status);

  if (res.status === 200 || res.status === 201) {
    const video = await res.json();
    console.log("[upload/recover] upload confirmed complete — videoId:", video.id);
    return NextResponse.json({ videoId: video.id });
  }

  if (res.status === 308) {
    const range = res.headers.get("Range");
    console.log("[upload/recover] upload incomplete — Range:", range);
    return NextResponse.json({ videoId: null, incomplete: true });
  }

  const body = await res.text().catch(() => "");
  console.log("[upload/recover] unexpected status:", res.status, body.slice(0, 200));
  return NextResponse.json({ videoId: null });
}
