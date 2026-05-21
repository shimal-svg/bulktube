import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: string;
  videoCount: string;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providerToken = session.provider_token;
  if (!providerToken) {
    return NextResponse.json(
      { error: "No Google access token. Please sign in again." },
      { status: 401 }
    );
  }

  const res = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
    {
      headers: { Authorization: `Bearer ${providerToken}` },
    }
  );

  if (!res.ok) {
    const body = await res.json();
    return NextResponse.json(
      { error: "YouTube API error", details: body },
      { status: res.status }
    );
  }

  const data = await res.json();
  interface YTItem {
    id: string;
    snippet: { title: string; description: string; thumbnails?: { default?: { url?: string } } };
    statistics?: { subscriberCount?: string; videoCount?: string };
  }
  const channels: YouTubeChannel[] = (data.items ?? []).map((item: YTItem) => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    thumbnail: item.snippet.thumbnails?.default?.url ?? "",
    subscriberCount: item.statistics?.subscriberCount ?? "0",
    videoCount: item.statistics?.videoCount ?? "0",
  }));

  return NextResponse.json({ channels });
}
