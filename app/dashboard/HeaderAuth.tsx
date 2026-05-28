'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

  async function handleCredential(response: { credential: string }) {
    console.log('[OneTap] ✅ CALLBACK FIRED')
    console.log('[OneTap] credential present:', !!response?.credential, '| length:', response?.credential?.length)
    setOneTapVisible(false)
    const supabase = createClient()
    try {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })
      console.log('[OneTap] signInWithIdToken result — session:', !!data?.session, '| user:', data?.user?.email, '| error:', error?.message ?? 'none')
      if (error) {
        console.error('[OneTap] ❌ sign-in failed:', error)
      } else {
        console.log('[OneTap] ✅ sign-in success, calling router.refresh()')
        router.refresh()
      }
    } catch (err) {
      console.error('[OneTap] ❌ unexpected exception:', err)
    }
  }

  useEffect(() => {
    if (email) return

    let cancelled = false
    let timerId: ReturnType<typeof setInterval> | null = null

    function init() {
      if (cancelled) return
      console.log('[OneTap] initialize, client_id:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
      window.google!.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        auto_select: true,
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

    if (window.google?.accounts?.id) {
      console.log('[OneTap] GSI already loaded')
      init()
    } else {
      console.log('[OneTap] waiting for GSI script...')
      timerId = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(timerId!)
          timerId = null
          console.log('[OneTap] GSI loaded (polled)')
          init()
        }
      }, 50)
    }

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
