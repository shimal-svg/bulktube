import { createClient } from "@/lib/supabase/server";
import { getValidGoogleToken } from "@/lib/google/token";
import { NextResponse } from "next/server";

const ADS_VERSION = "v20";

function formatCustomerId(id: string): string {
  const d = id.replace(/\D/g, "");
  return d.length === 10
    ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`
    : id;
}

async function fetchCustomerName(
  id: string,
  token: string,
  devToken: string
): Promise<string | null> {
  // Attempt 1: GAQL search with login-customer-id set to the customer's own ID
  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${ADS_VERSION}/customers/${id}/googleAds:search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "developer-token": devToken,
          "Content-Type": "application/json",
          "login-customer-id": id,
        },
        body: JSON.stringify({
          query: "SELECT customer.id, customer.descriptive_name FROM customer LIMIT 1",
        }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const name: string | undefined = data.results?.[0]?.customer?.descriptiveName;
      if (name) return name;
    }
  } catch {}

  // Attempt 2: REST GET /customers/{id}
  try {
    const res = await fetch(
      `https://googleads.googleapis.com/${ADS_VERSION}/customers/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "developer-token": devToken,
          "login-customer-id": id,
        },
      }
    );
    if (res.ok) {
      const data = await res.json();
      const name: string | undefined = data.descriptiveName;
      if (name) return name;
    }
  } catch {}

  return null;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getValidGoogleToken(user.id);
  if (!token)
    return NextResponse.json(
      { error: "Google token unavailable. Sign out and sign in again." },
      { status: 401 }
    );

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!devToken)
    return NextResponse.json(
      { error: "Google Ads developer token not configured on this server." },
      { status: 503 }
    );

  const listRes = await fetch(
    `https://googleads.googleapis.com/${ADS_VERSION}/customers:listAccessibleCustomers`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "developer-token": devToken,
      },
    }
  );

  if (!listRes.ok) {
    const body = await listRes.json().catch(() => ({}));
    const reason = body?.error?.details?.[0]?.reason;
    if (reason === "ACCESS_TOKEN_SCOPE_INSUFFICIENT") {
      return NextResponse.json(
        { error: "Google Ads permission not granted. Sign out and sign in again to connect your Ads account." },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: body?.error?.message ?? "Google Ads API error" },
      { status: listRes.status }
    );
  }

  const { resourceNames = [] }: { resourceNames?: string[] } = await listRes.json();
  const customerIds = (resourceNames as string[])
    .map((r) => r.replace("customers/", ""))
    .slice(0, 50);

  const customers = await Promise.all(
    customerIds.map(async (id) => {
      const formattedId = formatCustomerId(id);
      const name = await fetchCustomerName(id, token, devToken);
      return {
        id,
        name: name ?? formattedId,
        formattedId,
      };
    })
  );

  return NextResponse.json({ customers });
}
