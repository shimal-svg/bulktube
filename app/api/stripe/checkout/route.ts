import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

const PACKS: Record<number, { amount: number; label: string }> = {
  20:  { amount: 2000,  label: "20 Credits" },
  60:  { amount: 6000,  label: "60 Credits" },
  100: { amount: 10000, label: "100 Credits" },
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const credits = Number(formData.get("credits"));
  const pack = PACKS[credits];

  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: pack.amount,
          product_data: { name: `BulkTube — ${pack.label}` },
        },
        quantity: 1,
      },
    ],
    client_reference_id: user.id,
    metadata: { user_id: user.id, credits: String(credits) },
    success_url: `${origin}/dashboard?payment=success`,
    cancel_url:  `${origin}/credits`,
  });

  return NextResponse.redirect(session.url!, { status: 303 });
}
