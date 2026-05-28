import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Requires columns google_ads_customer_id (text) and google_ads_customer_name (text)
// on the public.users table. Add them in Supabase:
//   ALTER TABLE public.users ADD COLUMN google_ads_customer_id text;
//   ALTER TABLE public.users ADD COLUMN google_ads_customer_name text;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { customerId, customerName } = body;

  if (!customerId || !customerName) {
    return NextResponse.json(
      { error: "Missing customerId or customerName" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({
      google_ads_customer_id: customerId,
      google_ads_customer_name: customerName,
    })
    .eq("id", user.id);

  if (error) {
    // Gracefully degrade — client already persisted to localStorage
    console.warn("[ads-account] DB update failed (columns may not exist yet):", error.message);
    return NextResponse.json({ ok: true, warning: error.message });
  }

  return NextResponse.json({ ok: true });
}
