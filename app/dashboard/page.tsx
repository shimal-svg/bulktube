import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import UploadZone from "./UploadZone";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [userResult, packsResult, params] = await Promise.all([
    supabase
      .from("users")
      .select("email, free_uploads_used, free_uploads_limit, active_youtube_channel_name, active_youtube_channel_thumbnail, google_sheets_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("credit_packs")
      .select("credits_remaining")
      .gt("expires_at", new Date().toISOString()),
    searchParams,
  ]);

  const userData = userResult.data;
  const packCredits = packsResult.data?.reduce(
    (sum, p) => sum + p.credits_remaining,
    0
  ) ?? 0;
  const paymentSuccess = params.payment === "success";

  const freeRemaining = Math.max(
    0,
    (userData?.free_uploads_limit ?? 3) - (userData?.free_uploads_used ?? 0)
  );

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-zinc-900">drrop.io</span>
        <div className="flex items-center gap-3">
          {userData?.active_youtube_channel_thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userData.active_youtube_channel_thumbnail}
              alt={userData.active_youtube_channel_name ?? ""}
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="text-sm text-zinc-600">
            {userData?.active_youtube_channel_name}
          </span>
          <form action="/auth/signout" method="POST">
            <button className="text-sm text-zinc-400 hover:text-zinc-700 transition">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {paymentSuccess && (
          <div className="mb-6 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
            Payment successful — your credits have been added to your account.
          </div>
        )}

        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Dashboard</h1>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <p className="text-zinc-500 text-sm">
              Free uploads:{" "}
              <strong className="text-zinc-900">
                {freeRemaining} remaining
              </strong>
            </p>
            {packCredits > 0 && (
              <p className="text-zinc-500 text-sm">
                Pack credits:{" "}
                <strong className="text-zinc-900">{packCredits} remaining</strong>
              </p>
            )}
            <Link
              href="/credits"
              className="text-sm font-medium text-zinc-400 hover:text-zinc-700 transition"
            >
              Buy credits →
            </Link>
          </div>
          {userData?.google_sheets_url && (
            <a
              href={userData.google_sheets_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
            >
              View Sheet →
            </a>
          )}
        </div>

        <UploadZone />
      </main>
    </div>
  );
}
