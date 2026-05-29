'use client'

import { useState } from 'react'
import Link from 'next/link'

const UPLOAD_OPTIONS = ['100–200', '200–500', '500–1,000', '1,000+']

export default function InquirePage() {
  const [fields, setFields] = useState({
    name: '',
    email: '',
    company: '',
    uploadsPerMonth: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setFields(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-drrop">
      <header className="border-b border-drrop-border bg-surface px-6 py-4 flex items-center gap-4">
        <Link href="/credits" className="text-sm text-drrop-muted hover:text-drrop-text transition">
          ← Plans
        </Link>
        <span className="font-display font-bold text-drrop-text tracking-[-0.03em]">Agency Max</span>
      </header>

      <main className="max-w-lg mx-auto px-6 py-16">
        <h1 className="font-display font-bold text-2xl tracking-[-0.04em] text-drrop-text mb-2 text-center">
          Get in touch
        </h1>
        <p className="text-drrop-muted text-sm text-center mb-10">
          Tell us about your volume and we&apos;ll set you up with a custom plan.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-lime/30 bg-lime/5 px-6 py-8 text-center">
            <p className="text-lime font-semibold text-sm">
              Thanks — we&apos;ll be in touch within 1 business day.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-drrop-subtle">Name *</label>
                <input
                  type="text"
                  required
                  value={fields.name}
                  onChange={set('name')}
                  className="rounded-lg border border-drrop-border bg-drrop px-3 py-2.5 text-sm text-drrop-text placeholder:text-drrop-muted focus:border-lime focus:outline-none"
                  placeholder="Jane Smith"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-drrop-subtle">Email *</label>
                <input
                  type="email"
                  required
                  value={fields.email}
                  onChange={set('email')}
                  className="rounded-lg border border-drrop-border bg-drrop px-3 py-2.5 text-sm text-drrop-text placeholder:text-drrop-muted focus:border-lime focus:outline-none"
                  placeholder="jane@agency.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-drrop-subtle">Company or agency name</label>
              <input
                type="text"
                value={fields.company}
                onChange={set('company')}
                className="rounded-lg border border-drrop-border bg-drrop px-3 py-2.5 text-sm text-drrop-text placeholder:text-drrop-muted focus:border-lime focus:outline-none"
                placeholder="Acme Media"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-drrop-subtle">Approximate uploads per month *</label>
              <select
                required
                value={fields.uploadsPerMonth}
                onChange={set('uploadsPerMonth')}
                className="rounded-lg border border-drrop-border bg-drrop px-3 py-2.5 text-sm text-drrop-text focus:border-lime focus:outline-none"
              >
                <option value="" disabled>Select a range…</option>
                {UPLOAD_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-drrop-subtle">Anything else you&apos;d like us to know</label>
              <textarea
                value={fields.message}
                onChange={set('message')}
                rows={4}
                className="rounded-lg border border-drrop-border bg-drrop px-3 py-2.5 text-sm text-drrop-text placeholder:text-drrop-muted focus:border-lime focus:outline-none resize-none"
                placeholder="Tell us about your workflow, team size, or any specific requirements…"
              />
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-lime text-drrop px-4 py-3 text-sm font-bold tracking-[-0.02em] hover:bg-[#d9ff6a] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending…' : 'Send inquiry'}
            </button>
          </form>
        )}
      </main>
    </div>
  )
}
