import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import PricingSection from "./PricingSection";

export default async function CreditsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/dashboard");

  const { data: userData } = await supabase
    .from("users")
    .select("subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  const priceIds = {
    starterMonthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
    starterAnnual:  process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
    agencyMonthly:  process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID!,
    agencyAnnual:   process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID!,
  };

  return (
    <div className="min-h-screen bg-drrop">
      <header className="border-b border-drrop-border bg-surface px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-drrop-muted hover:text-drrop-text transition"
        >
          ← Dashboard
        </Link>
        <span className="font-display font-bold text-drrop-text tracking-[-0.03em]">
          Plans
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-2xl tracking-[-0.04em] text-drrop-text mb-2 text-center">
          Choose a plan
        </h1>
        <PricingSection
          priceIds={priceIds}
          currentTier={userData?.subscription_tier ?? null}
          currentStatus={userData?.subscription_status ?? null}
        />

        <div className="mt-12 rounded-xl border border-drrop-border bg-surface px-5 py-4">
          <p className="text-xs text-drrop-muted text-center">
            <strong className="text-drrop-text">Free tier:</strong> 3 lifetime uploads included with every account.
          </p>
        </div>
      </main>
    </div>
  );
}
