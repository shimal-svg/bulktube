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
      .select("credits_remaining"),
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
    <div className="min-h-screen bg-drrop">
      <header className="border-b border-drrop-border bg-surface px-6 py-4 flex items-center justify-between">
        <span className="font-display font-bold text-lg tracking-[-0.03em] text-lime">
          d<span className="text-drrop-orange">r</span><span className="text-drrop-purple">r</span>op.io
        </span>
        <div className="flex items-center gap-3">
          {userData?.active_youtube_channel_thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={userData.active_youtube_channel_thumbnail}
              alt={userData.active_youtube_channel_name ?? ""}
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="text-sm text-drrop-subtle">
            {userData?.active_youtube_channel_name}
          </span>
          <form action="/auth/signout" method="POST">
            <button className="text-sm text-drrop-muted hover:text-drrop-text transition">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {paymentSuccess && (
          <div className="mb-6 rounded-lg bg-lime/10 border border-lime/30 px-4 py-3 text-sm text-lime">
            Payment successful — your credits have been added to your account.
          </div>
        )}

        <h1 className="font-display font-bold text-2xl tracking-[-0.04em] text-drrop-text mb-2">
          Dashboard
        </h1>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <p className="text-drrop-muted text-sm">
              Free uploads:{" "}
              <strong className="text-drrop-text font-semibold">
                {freeRemaining} remaining
              </strong>
            </p>
            {packCredits > 0 && (
              <p className="text-drrop-muted text-sm">
                Pack credits:{" "}
                <strong className="text-drrop-text font-semibold">{packCredits} remaining</strong>
              </p>
            )}
            <Link
              href="/credits"
              className="text-sm font-medium text-drrop-muted hover:text-lime transition"
            >
              Buy credits →
            </Link>
          </div>
          {userData?.google_sheets_url && (
            <a
              href={userData.google_sheets_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-lime hover:text-[#d9ff6a] transition"
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
