'use client'

import { useState } from 'react'

type PriceIds = {
  starterMonthly: string
  starterAnnual: string
  agencyMonthly: string
  agencyAnnual: string
}

type PlanId = 'starter' | 'agency' | 'agency_max'

type Plan = {
  id: PlanId
  name: string
  monthlyPrice: number | null
  annualTotal: number | null
  annualMonthly: number | null
  limit: string
  badge?: string
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 7.99,
    annualTotal: 72,
    annualMonthly: 6.00,
    limit: '40 uploads / month',
  },
  {
    id: 'agency',
    name: 'Agency',
    monthlyPrice: 12.99,
    annualTotal: 117,
    annualMonthly: 9.75,
    limit: '100 uploads / month',
    badge: 'Best Deal',
    highlight: true,
  },
  {
    id: 'agency_max',
    name: 'Agency Max',
    monthlyPrice: null,
    annualTotal: null,
    annualMonthly: null,
    limit: 'Unlimited uploads',
  },
]

export default function PricingSection({
  priceIds,
  currentTier,
  currentStatus,
}: {
  priceIds: PriceIds
  currentTier: string | null
  currentStatus: string | null
}) {
  const [annual, setAnnual] = useState(true)
  const [loading, setLoading] = useState<string | null>(null)

  const hasActiveSub = !!currentTier && currentStatus === 'active'

  function priceIdFor(plan: Plan): string | null {
    if (plan.id === 'starter') return annual ? priceIds.starterAnnual : priceIds.starterMonthly
    if (plan.id === 'agency')  return annual ? priceIds.agencyAnnual  : priceIds.agencyMonthly
    return null
  }

  async function handleSubscribe(plan: Plan) {
    const priceId = priceIdFor(plan)
    if (!priceId) return
    setLoading(plan.id)
    try {
      const res = await fetch('/api/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error ?? 'No checkout URL')
      window.location.href = url
    } catch (err) {
      console.error('Subscription error:', err)
      setLoading(null)
    }
  }

  async function handleManage() {
    setLoading('manage')
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error || !url) throw new Error(error ?? 'No portal URL')
      window.location.href = url
    } catch (err) {
      console.error('Portal error:', err)
      setLoading(null)
    }
  }

  return (
    <>
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <span className={`text-sm font-medium ${!annual ? 'text-drrop-text' : 'text-drrop-muted'}`}>
          Monthly
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={annual}
          onClick={() => setAnnual(v => !v)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            annual ? 'bg-lime' : 'bg-drrop-border'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              annual ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${annual ? 'text-drrop-text' : 'text-drrop-muted'}`}>
          Annual
        </span>
        {annual && (
          <span className="rounded-full bg-lime/20 px-2.5 py-0.5 text-xs font-semibold text-lime">
            Save 25%
          </span>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map(plan => {
          const isCurrent = currentTier === plan.id && hasActiveSub
          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border bg-surface p-8 flex flex-col gap-4 ${
                plan.highlight ? 'border-lime' : 'border-drrop-border'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lime text-drrop text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  {plan.badge}
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 bg-drrop-border text-drrop-text text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                  Current plan
                </span>
              )}

              <h3 className="font-display font-bold text-xl tracking-[-0.03em] text-drrop-text">
                {plan.name}
              </h3>

              <div>
                {plan.monthlyPrice !== null ? (
                  <>
                    <p className="text-3xl font-bold text-drrop-text">
                      ${annual ? plan.annualMonthly!.toFixed(2) : plan.monthlyPrice.toFixed(2)}
                      <span className="text-base font-normal text-drrop-muted">/mo</span>
                    </p>
                    {annual && (
                      <p className="text-xs text-drrop-muted mt-0.5">
                        Billed ${plan.annualTotal}/year
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-3xl font-bold text-drrop-text">Custom</p>
                )}
              </div>

              <p className="text-sm text-drrop-subtle">{plan.limit}</p>

              <div className="mt-auto pt-2">
                {plan.id === 'agency_max' ? (
                  <a
                    href="mailto:shimal@drrop.io"
                    className="block w-full rounded-lg px-4 py-2.5 text-sm font-bold text-center border border-drrop-border text-drrop-muted hover:border-lime hover:text-lime transition"
                  >
                    Inquire
                  </a>
                ) : isCurrent ? (
                  <button
                    onClick={handleManage}
                    disabled={loading === 'manage'}
                    className="w-full rounded-lg px-4 py-2.5 text-sm font-bold border border-drrop-border text-drrop-muted hover:border-lime hover:text-lime transition disabled:opacity-50"
                  >
                    {loading === 'manage' ? 'Loading…' : 'Manage Subscription'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!loading}
                    className={`w-full rounded-lg px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${
                      plan.highlight
                        ? 'bg-lime text-drrop hover:bg-[#d9ff6a]'
                        : 'bg-drrop border border-drrop-border text-drrop-text hover:border-lime hover:text-lime'
                    }`}
                  >
                    {loading === plan.id ? 'Loading…' : 'Subscribe'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {hasActiveSub && (
        <p className="text-center text-xs text-drrop-muted mt-8">
          To cancel or change your plan, use the{' '}
          <button
            onClick={handleManage}
            disabled={loading === 'manage'}
            className="underline hover:text-drrop-text transition disabled:opacity-50"
          >
            billing portal
          </button>
          .
        </p>
      )}
    </>
  )
}
