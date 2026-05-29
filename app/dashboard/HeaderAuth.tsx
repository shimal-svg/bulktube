'use client'

import { useRouter } from 'next/navigation'

const LS_KEYS = [
  'drrop_ads_oauth_done',
  'drrop_yt_enabled', 'drrop_ads_enabled',
  'drrop_ads_customer_id', 'drrop_ads_customer_name',
]

export default function HeaderAuth({
  email,
  avatar,
}: {
  email?: string | null
  avatar?: string | null
}) {
  const router = useRouter()

  if (!email) return null

  async function handleSignOut() {
    await fetch('/auth/signout', { method: 'POST' })
    LS_KEYS.forEach(k => localStorage.removeItem(k))
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      {avatar && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt={email} className="h-7 w-7 rounded-full" />
      )}
      <span className="text-sm text-drrop-subtle">{email}</span>
      <span className="text-xs text-drrop-muted">|</span>
      <button
        onClick={handleSignOut}
        className="text-xs text-drrop-muted hover:text-red-400 transition"
      >
        Sign out
      </button>
    </div>
  )
}
