import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const PACKS = [
  { credits: 20,  price: 20,  popular: false },
  { credits: 60,  price: 60,  popular: true  },
  { credits: 100, price: 100, popular: false },
];

const TEST_EMAIL = "shimal@sdlosangeles.com";

export default async function CreditsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const isInternal = user.email === TEST_EMAIL;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 hover:text-zinc-700 transition"
        >
          ← Dashboard
        </Link>
        <span className="font-bold text-zinc-900">Buy Credits</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2 text-center">
          Purchase a credit pack
        </h1>
        <p className="text-zinc-500 text-sm text-center mb-12">
          Each credit lets you upload one video. Credits are valid for 1 year from purchase.
        </p>

        <div className="grid grid-cols-3 gap-6">
          {PACKS.map((pack) => (
            <PackCard key={pack.credits} pack={pack} />
          ))}
        </div>

        {isInternal && (
          <div className="mt-12">
            <p className="text-xs text-zinc-400 text-center mb-4 uppercase tracking-wide">
              Internal testing only
            </p>
            <div className="max-w-[200px] mx-auto">
              <PackCard pack={{ credits: 1, price: 1, popular: false }} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function PackCard({ pack }: { pack: { credits: number; price: number; popular: boolean } }) {
  return (
    <div
      className={`relative rounded-2xl border bg-white p-8 flex flex-col items-center gap-4 ${
        pack.popular ? "border-zinc-900 shadow-md" : "border-zinc-200 shadow-sm"
      }`}
    >
      {pack.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
          Most popular
        </span>
      )}

      <div className="text-5xl font-bold text-zinc-900">{pack.credits}</div>
      <div className="text-zinc-500 text-sm -mt-2">
        {pack.credits === 1 ? "credit" : "credits"}
      </div>

      <div className="text-2xl font-semibold text-zinc-900">${pack.price}</div>
      <div className="text-zinc-400 text-xs">
        ${(pack.price / pack.credits).toFixed(2)} per upload
      </div>

      <form action="/api/stripe/checkout" method="POST" className="w-full mt-2">
        <input type="hidden" name="credits" value={pack.credits} />
        <button
          type="submit"
          className={`w-full rounded-lg py-2.5 text-sm font-medium transition cursor-pointer ${
            pack.popular
              ? "bg-zinc-900 text-white hover:bg-zinc-700"
              : "bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
          }`}
        >
          Buy {pack.credits} {pack.credits === 1 ? "credit" : "credits"}
        </button>
      </form>
    </div>
  );
}
