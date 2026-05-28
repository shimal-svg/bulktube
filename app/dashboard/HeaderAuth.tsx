'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const LS_KEYS = [
  'drrop_ads_oauth_done', 'drrop_sheets_oauth_done',
  'drrop_remember_channel', 'drrop_remember_ads',
  'drrop_yt_enabled', 'drrop_ads_enabled',
  'drrop_ads_customer_id', 'drrop_ads_customer_name',
]

type GsiNotification = {
  isDisplayMoment(): boolean
  isDisplayed(): boolean
  isSkippedMoment(): boolean
  isDismissedMoment(): boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize(config: {
            client_id: string
            auto_select: boolean
            nonce?: string
            callback: (response: { credential: string }) => void
          }): void
          prompt(callback?: (notification: GsiNotification) => void): void
          cancel(): void
          disableAutoSelect(): void
        }
      }
    }
  }
}

export default function HeaderAuth({
  email,
  avatar,
}: {
  email?: string | null
  avatar?: string | null
}) {
  const router = useRouter()
  const [oneTapVisible, setOneTapVisible] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const rawNonceRef = useRef<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dropdownOpen) return
    function onClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [dropdownOpen])

  async function handleSignOut() {
    setDropdownOpen(false)
    window.google?.accounts?.id?.disableAutoSelect()
    await fetch('/auth/signout', { method: 'POST' })
    LS_KEYS.forEach(k => localStorage.removeItem(k))
    window.dispatchEvent(new CustomEvent('drrop:signout'))
    router.refresh()
  }

  async function handleCredential(response: { credential: string }) {
    console.log('[OneTap] ✅ CALLBACK FIRED, credential length:', response?.credential?.length)
    setOneTapVisible(false)
    try {
      const res = await fetch('/auth/callback/one-tap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential, nonce: rawNonceRef.current }),
      })
      const body = await res.json()
      console.log('[OneTap] server response:', res.status, body)
      if (res.ok) {
        console.log('[OneTap] ✅ sign-in success, refreshing...')
        router.refresh()
      } else {
        console.error('[OneTap] ❌ server error:', body.error)
      }
    } catch (err) {
      console.error('[OneTap] ❌ fetch failed:', err)
    }
  }

  useEffect(() => {
    if (email) return

    let cancelled = false
    let timerId: ReturnType<typeof setInterval> | null = null

    function init(hashedNonce: string) {
      if (cancelled) return
      console.log('[OneTap] initialize, client_id:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
      window.google!.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        auto_select: true,
        nonce: hashedNonce,
        callback: handleCredential,
      })
      console.log('[OneTap] prompt()')
      window.google!.accounts.id.prompt((n) => {
        const type = n.isDisplayMoment() ? 'display' : n.isSkippedMoment() ? 'skipped' : n.isDismissedMoment() ? 'dismissed' : 'unknown'
        const detail = n.isDisplayMoment() ? `displayed=${n.isDisplayed()}` : ''
        console.log(`[OneTap] prompt notification: ${type} ${detail}`)
        if (n.isDisplayMoment()) {
          setOneTapVisible(n.isDisplayed())
        } else if (n.isDismissedMoment()) {
          setOneTapVisible(false)
        }
      })
    }

    async function setup() {
      // Generate nonce: random bytes → hex raw, SHA-256 → hex hashed
      const bytes = crypto.getRandomValues(new Uint8Array(32))
      const raw = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))
      const hashed = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
      rawNonceRef.current = raw

      if (cancelled) return

      if (window.google?.accounts?.id) {
        console.log('[OneTap] GSI already loaded')
        init(hashed)
      } else {
        console.log('[OneTap] waiting for GSI script...')
        timerId = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(timerId!)
            timerId = null
            console.log('[OneTap] GSI loaded (polled)')
            init(hashed)
          }
        }, 50)
      }
    }

    setup()

    return () => {
      cancelled = true
      if (timerId !== null) clearInterval(timerId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  function openLoginPopup() {
    window.open(
      '/auth/callback/initiate?service=login',
      '_blank',
      'width=560,height=660,popup=yes,left=200,top=100'
    )
  }

  if (email) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(v => !v)}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          {avatar && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt={email} className="h-7 w-7 rounded-full" />
          )}
          <span className="text-sm text-drrop-subtle">{email}</span>
          <svg className="w-3 h-3 text-drrop-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-drrop-border bg-surface shadow-xl z-50 overflow-hidden">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2.5 text-sm text-drrop-text hover:bg-drrop transition"
            >
              Sign out of everything
            </button>
          </div>
        )}
      </div>
    )
  }

  if (oneTapVisible) return null

  return (
    <button
      onClick={openLoginPopup}
      className="rounded-lg px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      style={{ backgroundColor: '#4285F4' }}
    >
      Sign in
    </button>
  )
}
