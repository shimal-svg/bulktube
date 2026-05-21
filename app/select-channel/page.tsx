"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { YouTubeChannel } from "@/app/api/youtube/channels/route";

export default function SelectChannelPage() {
  const router = useRouter();
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/youtube/channels")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setChannels(data.channels);
        }
      })
      .catch(() => setError("Failed to load channels"))
      .finally(() => setLoading(false));
  }, []);

  async function selectChannel(channel: YouTubeChannel) {
    setSaving(channel.id);
    const res = await fetch("/api/user/channel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channelId: channel.id,
        channelName: channel.title,
        channelThumbnail: channel.thumbnail,
      }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save channel");
      setSaving(null);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">
            Select your YouTube channel
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Choose the channel you want to upload videos to.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
            {error.includes("sign in") && (
              <a href="/login" className="ml-2 underline font-medium">
                Sign in again
              </a>
            )}
          </div>
        )}

        {!loading && !error && channels.length === 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            No YouTube channels found on this Google account.
          </div>
        )}

        <ul className="space-y-3">
          {channels.map((channel) => (
            <li key={channel.id}>
              <button
                onClick={() => selectChannel(channel)}
                disabled={saving !== null}
                className="flex w-full items-center gap-4 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-zinc-400 hover:shadow disabled:opacity-60"
              >
                {channel.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={channel.thumbnail}
                    alt={channel.title}
                    className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-zinc-200 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">
                    {channel.title}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {Number(channel.subscriberCount).toLocaleString()} subscribers
                    &nbsp;·&nbsp;
                    {Number(channel.videoCount).toLocaleString()} videos
                  </p>
                </div>
                {saving === channel.id ? (
                  <Spinner />
                ) : (
                  <svg
                    className="text-zinc-300 flex-shrink-0"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5 text-zinc-400"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}
