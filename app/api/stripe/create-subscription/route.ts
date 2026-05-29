import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { priceId } = await request.json()
  if (!priceId) return NextResponse.json({ error: "Missing priceId" }, { status: 400 })

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    client_reference_id: user.id,
    subscription_data: { metadata: { user_id: user.id } },
    success_url: "https://drrop.io/dashboard?subscribed=true",
    cancel_url: "https://drrop.io/credits",
  })

  return NextResponse.json({ url: session.url })
}
