import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

// Stripe requires the raw body for signature verification — do not parse JSON.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event;
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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status !== "paid") {
      console.log("[stripe/webhook] session not paid yet — skipping", session.id);
      return NextResponse.json({ received: true });
    }

    const userId   = session.metadata?.user_id ?? session.client_reference_id;
    const credits  = Number(session.metadata?.credits ?? 0);

    if (!userId || !credits) {
      console.error("[stripe/webhook] missing userId or credits — session:", session.id);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const stripePaymentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.id;

    const admin = createAdminClient();

    // Idempotency guard: skip if this payment was already recorded
    const { data: existing } = await admin
      .from("credit_packs")
      .select("id")
      .eq("stripe_payment_id", stripePaymentId)
      .maybeSingle();

    if (existing) {
      console.log("[stripe/webhook] already recorded — skipping", stripePaymentId);
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

    console.log("[stripe/webhook] ✓ added", credits, "credits for user", userId);
  }

  return NextResponse.json({ received: true });
}
