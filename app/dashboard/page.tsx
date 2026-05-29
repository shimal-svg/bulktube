import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import UploadZone from "./UploadZone";
import HeaderAuth from "./HeaderAuth";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; subscribed?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const paymentSuccess    = params.payment === "success";
  const subscribedSuccess = params.subscribed === "true";

  let userData: {
    email: string;
    free_uploads_used: number;
    free_uploads_limit: number;
    active_youtube_channel_name: string | null;
    active_youtube_channel_thumbnail: string | null;
    google_sheets_url: string | null;
    subscription_tier: string | null;
    subscription_status: string | null;
    monthly_uploads_used: number | null;
    monthly_upload_limit: number | null;
  } | null = null;
  let packCreditsRemaining = 0;

  if (user) {
    const [userResult, packsResult] = await Promise.all([
      supabase
        .from("users")
        .select(
          "email, free_uploads_used, free_uploads_limit, active_youtube_channel_name, active_youtube_channel_thumbnail, google_sheets_url, subscription_tier, subscription_status, monthly_uploads_used, monthly_upload_limit"
        )
        .eq("id", user.id)
        .single(),
      supabase
        .from("credit_packs")
        .select("credits_remaining")
        .gt("credits_remaining", 0),
    ]);
    userData = userResult.data;
    packCreditsRemaining =
      packsResult.data?.reduce(
        (sum: number, p: { credits_remaining: number }) => sum + p.credits_remaining,
        0
      ) ?? 0;
  }

  const freeUploadsRemaining = Math.max(
    0,
    (userData?.free_uploads_limit ?? 3) - (userData?.free_uploads_used ?? 0)
  );

  const hasActiveSub =
    !!userData?.subscription_tier && userData?.subscription_status === "active";

  const userEmail = userData?.email ?? user?.email ?? null;
  const userAvatar = (user?.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="min-h-screen bg-drrop">
      <header className="border-b border-drrop-border bg-surface px-6 py-4 flex items-center justify-between">
        <span className="font-display font-bold text-lg tracking-[-0.03em] text-lime">
          d<span className="text-drrop-orange">r</span><span className="text-drrop-purple">r</span>op.io
        </span>
        <HeaderAuth email={userEmail} avatar={userAvatar} />
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-10">
        {(paymentSuccess || subscribedSuccess) && (
          <div className="mb-6 rounded-lg bg-lime/10 border border-lime/30 px-4 py-3 text-sm text-lime">
            {subscribedSuccess
              ? "Subscription activated — welcome aboard!"
              : "Payment successful — your credits have been added to your account."}
          </div>
        )}

        <h1 className="font-display font-bold text-2xl tracking-[-0.04em] text-drrop-text mb-2">
          Dashboard
        </h1>

        {user && (
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              {hasActiveSub ? (
                <>
                  <p className="text-drrop-muted text-sm">
                    Monthly uploads:{" "}
                    <strong className="text-drrop-text font-semibold">
                      {userData?.monthly_uploads_used ?? 0} / {userData?.monthly_upload_limit} used
                    </strong>
                  </p>
                  <Link
                    href="/credits"
                    className="text-sm font-medium text-drrop-muted hover:text-lime transition"
                  >
                    Manage plan →
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-drrop-muted text-sm">
                    Free uploads:{" "}
                    <strong className="text-drrop-text font-semibold">
                      {freeUploadsRemaining} remaining
                    </strong>
                  </p>
                  <Link
                    href="/credits"
                    className="rounded-lg bg-lime text-drrop px-3 py-1.5 text-sm font-bold hover:bg-[#d9ff6a] transition"
                  >
                    Subscribe →
                  </Link>
                </>
              )}
            </div>
          </div>
        )}

        {!user && <div className="mb-8" />}

        <UploadZone
          channelName={userData?.active_youtube_channel_name}
          channelThumbnail={userData?.active_youtube_channel_thumbnail}
          sheetsUrl={userData?.google_sheets_url}
          subscriptionTier={userData?.subscription_tier}
          subscriptionStatus={userData?.subscription_status}
          monthlyUploadsUsed={userData?.monthly_uploads_used}
          monthlyUploadLimit={userData?.monthly_upload_limit}
          freeUploadsRemaining={freeUploadsRemaining}
          packCreditsRemaining={packCreditsRemaining}
        />
      </main>
    </div>
  );
}
