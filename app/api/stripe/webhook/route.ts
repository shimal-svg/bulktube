import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Stripe requires the raw body for signature verification — do not parse JSON.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe/webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();

  // ── One-time credit pack purchase ────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode !== "payment") {
      return NextResponse.json({ received: true });
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const userId  = session.metadata?.user_id ?? session.client_reference_id;
    const credits = Number(session.metadata?.credits ?? 0);

    if (!userId || !credits) {
      console.error("[stripe/webhook] missing userId or credits — session:", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const stripePaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.id;

    const { data: existing } = await admin
      .from("credit_packs")
      .select("id")
      .eq("stripe_payment_id", stripePaymentId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ received: true });
    }

    const { error } = await admin.from("credit_packs").insert({
      user_id:           userId,
      credits_total:     credits,
      credits_remaining: credits,
      stripe_payment_id: stripePaymentId,
    });

    if (error) {
      console.error("[stripe/webhook] DB insert failed:", error);
      return NextResponse.json({ error: "DB insert failed" }, { status: 500 });
    }
  }

  // ── Subscription created or renewed ─────────────────────────────────────
  if (
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;

    if (!userId) {
      console.error("[stripe/webhook] no user_id in subscription metadata:", subscription.id);
      return NextResponse.json({ received: true });
    }

    const priceId = subscription.items.data[0]?.price?.id;
    const { tier, uploadLimit } = tierFromPrice(priceId);

    const newPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
    const newPeriodEnd   = new Date(subscription.current_period_end   * 1000).toISOString();

    // Only reset monthly_uploads_used when a new billing period begins
    const { data: existing } = await admin
      .from("users")
      .select("upload_period_start")
      .eq("id", userId)
      .single();

    const storedPeriodStart = existing?.upload_period_start ?? null;
    const isNewPeriod = storedPeriodStart !== newPeriodStart;

    const update: Record<string, unknown> = {
      subscription_tier:       tier,
      subscription_status:     subscription.status,
      subscription_id:         subscription.id,
      subscription_period_end: newPeriodEnd,
      monthly_upload_limit:    uploadLimit,
      upload_period_start:     newPeriodStart,
    };

    if (isNewPeriod) {
      update.monthly_uploads_used = 0;
    }

    const { error } = await admin.from("users").update(update).eq("id", userId);
    if (error) {
      console.error("[stripe/webhook] subscription update failed:", error);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log("[stripe/webhook] ✓ subscription upserted for user", userId, "| tier:", tier, "| newPeriod:", isNewPeriod);
  }

  // ── Subscription canceled ────────────────────────────────────────────────
  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id;

    if (!userId) {
      console.error("[stripe/webhook] no user_id on deleted subscription:", subscription.id);
      return NextResponse.json({ received: true });
    }

    const { error } = await admin.from("users").update({
      subscription_status:  "canceled",
      subscription_tier:    null,
      monthly_upload_limit: null,
    }).eq("id", userId);

    if (error) {
      console.error("[stripe/webhook] subscription delete update failed:", error);
    }

    console.log("[stripe/webhook] ✓ subscription canceled for user", userId);
  }

  return NextResponse.json({ received: true });
}

function tierFromPrice(priceId: string | undefined): { tier: string; uploadLimit: number } {
  if (
    priceId === process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_STARTER_ANNUAL_PRICE_ID
  ) {
    return { tier: "starter", uploadLimit: 40 };
  }
  if (
    priceId === process.env.STRIPE_AGENCY_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_AGENCY_ANNUAL_PRICE_ID
  ) {
    return { tier: "agency", uploadLimit: 100 };
  }
  return { tier: "starter", uploadLimit: 40 };
}
