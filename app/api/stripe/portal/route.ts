import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = createAdminClient()
  const { data: userData } = await admin
    .from("users")
    .select("subscription_id")
    .eq("id", user.id)
    .single()

  if (!userData?.subscription_id) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 })
  }

  const subscription = await getStripe().subscriptions.retrieve(userData.subscription_id)
  const customerId = typeof subscription.customer === "string"
    ? subscription.customer
    : subscription.customer.id

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: "https://drrop.io/credits",
  })

  return NextResponse.json({ url: portalSession.url })
}
