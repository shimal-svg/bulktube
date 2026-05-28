'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const rawNonceRef = useRef<string | null>(null)

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
      <div className="flex items-center gap-3">
        {avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatar} alt={email} className="h-7 w-7 rounded-full" />
        )}
        <span className="text-sm text-drrop-subtle">{email}</span>
        <form action="/auth/signout" method="POST">
          <button className="text-sm text-drrop-muted hover:text-drrop-text transition">
            Sign out
          </button>
        </form>
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
