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
    <div className="min-h-screen bg-drrop">
      <header className="border-b border-drrop-border bg-surface px-6 py-4 flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-drrop-muted hover:text-drrop-text transition"
        >
          ← Dashboard
        </Link>
        <span className="font-display font-bold text-drrop-text tracking-[-0.03em]">
          Buy Credits
        </span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-2xl tracking-[-0.04em] text-drrop-text mb-2 text-center">
          Purchase a credit pack
        </h1>
        <p className="text-drrop-muted text-sm text-center mb-12">
          Each credit lets you upload one video. Credits are valid for 1 year from purchase.
        </p>

        <div className="grid grid-cols-3 gap-6">
          {PACKS.map((pack) => (
            <PackCard key={pack.credits} pack={pack} />
          ))}
        </div>

        {isInternal && (
          <div className="mt-12">
            <p className="text-xs text-drrop-muted text-center mb-4 uppercase tracking-wide">
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
      className={`relative rounded-2xl border bg-surface p-8 flex flex-col items-center gap-4 ${
        pack.popular ? "border-lime" : "border-drrop-border"
      }`}
    >
      {pack.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime text-drrop text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
          Most popular
        </span>
      )}

      <div className="font-display font-bold text-5xl text-drrop-text">{pack.credits}</div>
      <div className="text-drrop-muted text-sm -mt-2">
        {pack.credits === 1 ? "credit" : "credits"}
      </div>

      <div className="text-2xl font-semibold text-drrop-text">${pack.price}</div>
      <div className="text-drrop-muted text-xs">
        ${(pack.price / pack.credits).toFixed(2)} per upload
      </div>

      <form action="/api/stripe/checkout" method="POST" className="w-full mt-2">
        <input type="hidden" name="credits" value={pack.credits} />
        <button
          type="submit"
          className={`w-full rounded-full py-2.5 text-sm font-semibold transition cursor-pointer ${
            pack.popular
              ? "bg-lime text-drrop hover:bg-[#d9ff6a]"
              : "bg-drrop border border-drrop-border text-drrop-text hover:border-lime hover:text-lime"
          }`}
        >
          Buy {pack.credits} {pack.credits === 1 ? "credit" : "credits"}
        </button>
      </form>
    </div>
  );
}
